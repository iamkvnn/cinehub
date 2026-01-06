import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsOptional, IsString } from 'class-validator';
import { CreateUserDto } from 'src/module/user/dto/user.dto';

export class RegisterDto extends CreateUserDto {}

export class VerifyEmailDto {
  @ApiProperty({
    description: 'Mã xác thực được gửi qua email',
    example: '123456',
  })
  @IsString()
  @Expose()
  code: string;

  @ApiProperty({
    description: 'Địa chỉ email cần xác thực',
    example: '',
  })
  @IsString()
  @Expose()
  email: string;
}