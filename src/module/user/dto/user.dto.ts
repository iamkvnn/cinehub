import { ApiProperty, OmitType } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsEmail, IsEnum, IsString, IsStrongPassword } from 'class-validator';
import { BaseDto } from 'src/core/base/base.dto';
import { Gender } from '../const/user.const';

export class UserDto extends BaseDto {
  @ApiProperty()
  @IsString()
  @Expose()
  name: string;

  @ApiProperty()
  @IsEmail()
  @Expose()
  email: string;

  @ApiProperty({
    enum: Gender
  })
  @IsEnum(Gender)
  @Expose()
  gender: Gender;
}

export class CreateUserDto extends OmitType(UserDto, [
  'id',
  'createdAt',
  'updatedAt',
  'deletedAt',
]) {
  @ApiProperty()
  @IsStrongPassword({
    minLength: 8,
    minUppercase: 1,
    minLowercase: 1,
    minNumbers: 1,
    minSymbols: 1,
  })
  @Expose()
  password: string;
}

export class UpdateUserDto extends OmitType(CreateUserDto, ['password']) {}
