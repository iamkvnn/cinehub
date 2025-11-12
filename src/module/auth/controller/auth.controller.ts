import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { AuthService } from '../service/auth.service';
import { RegisterDto } from '../dto/register.dto';
import { createApiResponseDto } from 'src/common/dto';
import { createApiResponse } from 'src/common/utils';
import { UserDto } from 'src/module/user/dto/user.dto';
import { plainToInstance } from 'class-transformer';
import { ResetPasswordDto } from '../dto/reset-password.dto';
import { LoginDto } from '../dto/login.dto';
import { LoginResponseDto } from '../dto/login.response.dto';
import { JwtAuthGuard } from 'src/common/guard';
import { AuthGuard } from '@nestjs/passport';
import express from 'express';

@ApiTags('Auth')
@Controller({ path: 'auth', version: '1' })
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Đăng ký tài khoản và gửi mã OTP' })
  @ApiResponse({
    status: 201,
    description: 'Đăng ký thành công, OTP gửi qua email',
    type: createApiResponseDto(UserDto),
  })
  async register(@Body() dto: RegisterDto) {
    return createApiResponse(
      plainToInstance(UserDto, await this.authService.registerUser(dto), {
        excludeExtraneousValues: true,
      }),
    );
  }

  @Post('verify-otp')
  @ApiOperation({ summary: 'Xác thực OTP để kích hoạt tài khoản' })
  @ApiResponse({
    status: 200,
    description: 'Xác thực OTP thành công, tài khoản đã được kích hoạt',
  })
  async verifyOtp(@Body() dto: RegisterDto) {
    await this.authService.verifyOtp(dto);
  }

  @Post('resend-otp')
  @ApiOperation({ summary: 'Gửi lại mã OTP' })
  @ApiBody({
    schema: {
      properties: { email: { type: 'string', example: 'user@example.com' } },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Gửi lại mã OTP thành công',
  })
  async resendOtp(@Body('email') email: string) {
    await this.authService.resendOtp(email);
  }

  @Post('forgot-password')
  @ApiOperation({ summary: 'Yêu cầu đặt lại mật khẩu' })
  @ApiBody({
    schema: {
      properties: { email: { type: 'string', example: 'user@example.com' } },
    },
  })
  @ApiResponse({
    status: 200,
    description:
      'Yêu cầu đặt lại mật khẩu thành công, mã OTP đã được gửi qua email',
  })
  async forgotPassword(@Body('email') email: string) {
    await this.authService.forgotPassword(email);
  }

  @Post('reset-password')
  @ApiOperation({ summary: 'Đặt lại mật khẩu bằng mã OTP' })
  @ApiResponse({
    status: 200,
    description: 'Đặt lại mật khẩu thành công',
  })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    await this.authService.resetPassword(dto);
  }

  @Post('login')
  @ApiOperation({ summary: 'Login' })
  @ApiResponse({
    status: 200,
    description: 'Login successfully',
    type: createApiResponseDto(LoginResponseDto),
  })
  async login(@Body() dto: LoginDto) {
    return plainToInstance(
      LoginResponseDto,
      await this.authService.login(dto),
      { excludeExtraneousValues: true },
    );
  }

  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleLogin() {}

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  googleCallback(@Req() req: express.Request) {
    return req.user;
  }
  @UseGuards(JwtAuthGuard)
  @Get('test-login')
  @ApiOperation({ summary: 'Test login' })
  @ApiResponse({
    status: 200,
    description: 'Login successfully',
  })
  testLogin(): string {
    return 'Login ok';
  }
}
