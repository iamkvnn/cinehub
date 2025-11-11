import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { UserService } from 'src/module/user/service/user.service';
import { RegisterDto } from '../dto/register.dto';
import {
  comparePassword,
  generateOtp,
  hashPasswordSync,
} from 'src/common/utils';
import { MailService } from 'src/core/mail/mail.service';
import { ResetPasswordDto } from '../dto/reset-password.dto';
import { LoginDto } from '../dto/login.dto';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  private readonly accessSecret: string;
  private readonly accessExpire: number;

  private readonly refreshSecret: string;
  private readonly refreshExpire: number;
  constructor(
    private readonly userService: UserService,
    private readonly mailService: MailService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    const jwtConfig = this.configService.get<{
      access: { secret: string; expired: number };
      refresh: { secret: string; expired: number };
    }>('jwt');

    if (!jwtConfig) {
      throw new Error('JWT config missing');
    }

    this.accessSecret = jwtConfig.access.secret;
    this.accessExpire = jwtConfig.access.expired;
    this.refreshSecret = jwtConfig.refresh.secret;
    this.refreshExpire = jwtConfig.refresh.expired;
  }

  async registerUser(registerUser: RegisterDto) {
    const otp = generateOtp();
    this.mailService.sendOtpEmail(registerUser.email, otp);
    const user = await this.userService.createUser(registerUser);
    await this.userService.updateUser(user.id, {
      otp: otp,
      otpExpiresAt: new Date(Date.now() + 90 * 1000),
    });
    return user;
  }

  async verifyOtp(registerUser: RegisterDto) {
    const user = await this.userService.findByEmail(registerUser.email);
    if (user.isVerified) {
      throw new BadRequestException('Tài khoản đã được xác minh');
    }
    if (user.otp !== registerUser.otp) {
      throw new BadRequestException('Mã OTP không đúng');
    }
    if (user.otpExpiresAt && user.otpExpiresAt < new Date()) {
      throw new BadRequestException('Mã OTP đã hết hạn');
    }
    await this.userService.updateUser(user.id, { isVerified: true });
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
  async login(
    request: LoginDto,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const user = await this.userService.findByEmail(request.email);

    if (!user) {
      throw new BadRequestException('Email hoặc mật khẩu không đúng');
    }

    const passwordMatch: boolean = await comparePassword(
      request.password,
      user.password,
    );

    if (!passwordMatch) {
      throw new BadRequestException('Email hoặc mật khẩu không đúng');
    }

    const payload = { sub: user.id, email: user.email };

    const accessToken = await this.jwtService.signAsync(payload, {
      secret: this.accessSecret,
      expiresIn: this.accessExpire,
    });

    const refreshToken = await this.jwtService.signAsync(payload, {
      secret: this.refreshSecret,
      expiresIn: this.refreshExpire,
    });

    await this.userService.updateUser(user.id, {
      refreshToken: refreshToken,
    });

    return {
      accessToken,
      refreshToken,
    };
  }
  // async refreshToken(
  //   userId: string,
  //   token: string,
  // ): Promise<{ accessToken: string; refreshToken: string }> {
  //   const user = await this.userService.findById(userId);

  //   if (!user || !user.refreshToken) {
  //     throw new UnauthorizedException('Token không hợp lệ');
  //   }

  //   const decoded = await this.jwtService.verifyAsync(token, {
  //     secret: this.refreshSecret,
  //   });

  //   if (!decoded) {
  //     throw new UnauthorizedException('Token không hợp lệ');
  //   }

  //   const match = await bcrypt.compare(token, user.refreshToken);

  //   if (!match) {
  //     throw new UnauthorizedException('Token không khớp');
  //   }

  //   const payload: JwtPayload = { sub: user.id, email: user.email };

  //   const accessToken = await this.jwtService.signAsync(payload, {
  //     secret: this.accessSecret,
  //     expiresIn: this.accessExpire,
  //   });

  //   const refreshToken = await this.jwtService.signAsync(payload, {
  //     secret: this.refreshSecret,
  //     expiresIn: this.refreshExpire,
  //   });

  //   await this.userService.updateUser(user.id, {
  //     refreshToken: newRefresh,
  //   });

  //   return {
  //     accessToken: newAccess,
  //     refreshToken: newRefresh,
  //   };
  // }
}
