import { IsDateString, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateFilmDto {
  @ApiProperty()
  @IsString()
  title: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  poster?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  releaseDate?: string;

  @ApiProperty()
  @IsString()
  categoryId: string;
}
