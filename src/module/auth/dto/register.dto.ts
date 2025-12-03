import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsOptional, IsString } from 'class-validator';
import { CreateUserDto } from 'src/module/user/dto/user.dto';

export class RegisterDto extends CreateUserDto {
  @ApiProperty({
    description: 'Mã OTP để xác thực tài khoản',
    example: '123456',
    required: false,
  })
  @IsString()
  @Expose()
  @IsOptional()
  otp?: string;
}
