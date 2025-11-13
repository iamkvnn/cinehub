import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { IsInstance } from 'class-validator';
import { UserDto } from 'src/module/user/dto/user.dto';

export class LoginResponseDto {
  @Expose()
  @ApiProperty()
  accessToken: string;

  @Expose()
  @ApiProperty()
  refreshToken: string;

  @ApiProperty({ type: UserDto })
  @Type(() => UserDto)
  @IsInstance(UserDto)
  @Expose()
  user: UserDto;
}
