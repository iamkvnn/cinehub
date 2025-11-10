import { ApiProperty } from "@nestjs/swagger";
import { Expose } from "class-transformer";
import { IsOptional, IsString } from "class-validator";
import { CreateUserDto } from "src/module/user/dto/user.dto";

export class RegisterDto extends CreateUserDto {
    @ApiProperty()
    @IsString()
    @Expose()
    @IsOptional()
    otp?: string;
}