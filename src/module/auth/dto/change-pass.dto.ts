import { ApiProperty } from "@nestjs/swagger";
import { Expose } from "class-transformer";
import { IsString, IsStrongPassword } from "class-validator";
  
export class ChangePassDto {
  @ApiProperty({
    description: "Mật khẩu cũ của người dùng",
    example: "",
  })
  @IsString()
  @Expose()
  oldPassword: string;

  @ApiProperty({
    description: "Mật khẩu mới của người dùng",
    example: "",
  })
  @IsStrongPassword({
    minLength: 8,
    minUppercase: 1,
    minLowercase: 1,
    minNumbers: 1,
    minSymbols: 1,
  })
  @Expose()
  newPassword: string;
}