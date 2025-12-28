import { ApiProperty } from "@nestjs/swagger";
import { Expose } from "class-transformer";
import { IsString } from "class-validator";

export class RefreshDto {
  @ApiProperty({
    description: "Refresh token của người dùng",
    example: "",
  })
  @IsString()
  @Expose()
  token: string;
}