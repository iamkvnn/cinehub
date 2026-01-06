import {
  BadRequestException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { UserService } from 'src/module/user/service/user.service';
import { RegisterDto, VerifyEmailDto } from '../dto/register.dto';
import {
  comparePassword,
  generateOtp,
  generateRandomPassword,
  hashPasswordSync,
} from 'src/common/utils';
import { MailService } from 'src/core/mail/mail.service';
import { ResetPasswordDto } from '../dto/reset-password.dto';
import { LoginDto } from '../dto/login.dto';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { GoogleProfileDto, GoogleTokenResponse } from '../dto/google.dto';
import { UserEntity } from 'src/module/user/entity/user.entity';
import axios from 'axios';
import { JwtPayload } from '../dto/jwt-payload';
import { LoginResponseDto } from '../dto/login.response.dto';
import { ERROR_CODE } from 'src/common/const/const';
import { ChangePassDto } from '../dto/change-pass.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly refreshExpire: any;
  private readonly refreshSecret: string;
  private readonly googleTokenUrl: string;
  private readonly googleUserInfoUrl: string;
  private readonly googleClientId: string;
  private readonly googleClientSecret: string;
  private readonly googleRedirectUrl: string;
  constructor(
    private readonly userService: UserService,
    private readonly mailService: MailService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    this.refreshSecret = this.configService.get<string>('jwt.refresh.secret')!;
    this.refreshExpire = this.configService.get('jwt.refresh.expired');
    this.googleTokenUrl = this.configService.get<string>('google.tokenUrl', '');
    this.googleUserInfoUrl = this.configService.get<string>(
      'google.userInfoUrl',
      '',
    );
    this.googleClientId = this.configService.get<string>('google.clientId')!;
    this.googleClientSecret = this.configService.get<string>(
      'google.clientSecret',
    )!;
    this.googleRedirectUrl =
      this.configService.get<string>('google.redirectUrl')!;
  }

  async registerUser(registerUser: RegisterDto) {
    const user = await this.userService.createUser(registerUser);
    await this.mailService.sendOtpEmail(registerUser.email, user.otp as string);
    return user;
  }

  async verifyOtp(verifyDto: VerifyEmailDto): Promise<LoginResponseDto> {
    const user = await this.userService.findByEmail(verifyDto.email);
    if (user.isVerified) {
      throw new BadRequestException('Tài khoản đã được xác minh');
    }
    if (user.otp !== verifyDto.code) {
      throw new BadRequestException('Mã OTP không đúng');
    }
    if (user.otpExpiresAt && user.otpExpiresAt < new Date()) {
      throw new BadRequestException('Mã OTP đã hết hạn');
    }
    await this.userService.updateUser(user.id, { isVerified: true });

    await this.mailService.sendVerificationSuccessEmail(user.email, user.name);

    const { accessToken, refreshToken } = this.signTokenPair(user);

    await this.userService.updateUser(user.id, {
      refreshToken: refreshToken,
    });
    return {
      accessToken,
      refreshToken,
      user: user,
    };
  }

  async resendOtp(email: string) {
    const user = await this.userService.findByEmail(email);
    if (user.isVerified) {
      throw new BadRequestException('Tài khoản đã được xác minh');
    }
    const otp = generateOtp();
    this.mailService.sendOtpEmail(user.email, otp);
    await this.userService.updateUser(user.id, {
      otp: otp,
      otpExpiresAt: new Date(Date.now() + 90 * 1000),
    });
  }

  async forgotPassword(email: string) {
    const user = await this.userService.findByEmail(email);
    const otp = generateOtp();
    this.mailService.sendOtpEmail(user.email, otp);
    await this.userService.updateUser(user.id, {
      otp: otp,
      otpExpiresAt: new Date(Date.now() + 90 * 1000),
    });
  }

  async resetPassword(dto: ResetPasswordDto) {
    const user = await this.userService.findByEmail(dto.email);
    if (user.otp !== dto.otp) {
      throw new BadRequestException('Mã OTP không đúng');
    }
    if (user.otpExpiresAt && user.otpExpiresAt < new Date()) {
      throw new BadRequestException('Mã OTP đã hết hạn');
    }
    await this.userService.updateUser(user.id, {
      password: hashPasswordSync(dto.newPassword),
    });
  }

  async changePassword(userId: string, dto: ChangePassDto) {
    const user = await this.userService.findById(userId);
    const passwordMatch: boolean = await comparePassword(
      dto.oldPassword,
      user.password,
    );
    if (!passwordMatch) {
      throw new BadRequestException('Mật khẩu cũ không đúng');
    }
    await this.userService.updateUser(user.id, {
      password: hashPasswordSync(dto.newPassword),
    });
  }

  async login(request: LoginDto): Promise<LoginResponseDto> {
    const user = await this.userService.findByEmail(request.email);
    const passwordMatch: boolean = await comparePassword(
      request.password,
      user.password,
    );
    if (!passwordMatch) {
      throw new BadRequestException('Email hoặc mật khẩu không đúng');
    }
    if (!user.isVerified) {
      await this.resendOtp(user.email);
      throw new BadRequestException({
        message: 'Tài khoản chưa được xác minh',
        code: ERROR_CODE.USER_NOT_VERIFIED,
      });
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Tài khoản đã bị khóa');
    }

    const { accessToken, refreshToken } = this.signTokenPair(user);

    await this.userService.updateUser(user.id, {
      refreshToken: refreshToken,
    });
    return {
      accessToken,
      refreshToken,
      user: user,
    };
  }

  private signTokenPair(user: UserEntity) {
    const payload = { sub: user.id, email: user.email } as JwtPayload;
    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, {
      secret: this.refreshSecret,
      expiresIn: this.refreshExpire,
    });
    return { accessToken, refreshToken };
  }

  async refreshToken(token: string): Promise<LoginResponseDto> {
    try {
      this.jwtService.verify(token, {
        secret: this.refreshSecret,
      });
    } catch (e: any) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const decoded = this.jwtService.decode(token) as JwtPayload;
    const user = await this.userService.findById(decoded.sub);

    if (!user.isActive) {
      throw new UnauthorizedException('Tài khoản đã bị khóa');
    }

    const { accessToken, refreshToken } = this.signTokenPair(user);

    await this.userService.updateUser(user.id, {
      refreshToken: refreshToken,
    });

    return {
      accessToken,
      refreshToken,
      user: user,
    };
  }

  async exchangeCodeForToken(
    code: string,
    codeVerifier: string,
  ): Promise<GoogleTokenResponse> {
    try {
      const response = await axios.post<GoogleTokenResponse>(
        this.googleTokenUrl,
        new URLSearchParams({
          code,
          client_id: this.googleClientId,
          client_secret: this.googleClientSecret,
          redirect_uri: this.googleRedirectUrl,
          grant_type: 'authorization_code',
          code_verifier: codeVerifier,
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        },
      );

      return response.data;
    } catch (error) {
      console.error('Error exchanging code for token:', error);
      throw new UnauthorizedException('Failed to exchange authorization code');
    }
  }

  async getGoogleUserInfo(accessToken: string): Promise<GoogleProfileDto> {
    try {
      const response = await axios.get<GoogleProfileDto>(
        this.googleUserInfoUrl,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      return response.data;
    } catch (error) {
      throw new UnauthorizedException('Failed to fetch user info');
    }
  }

  async handleGoogleLogin(code: string, codeVerifier: string) {
    const tokenResponse = await this.exchangeCodeForToken(code, codeVerifier);
    const userInfo = await this.getGoogleUserInfo(tokenResponse.access_token);

    const { user, isNew } =
      await this.userService.findOrCreateByGoogleProfile(userInfo);

    if (isNew) {
      const randomPassword = generateRandomPassword();
      await this.userService.updateUser(user.id, {
        password: hashPasswordSync(randomPassword),
      });
      await this.mailService.sendGoogleWelcomeEmail(
        user.email,
        randomPassword,
        user.name,
      );
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Tài khoản đã bị khóa');
    }

    const { accessToken, refreshToken } = this.signTokenPair(user);

    await this.userService.updateUser(user.id, {
      refreshToken: refreshToken,
    });

    return {
      accessToken,
      refreshToken,
      user,
    };
  }
}
