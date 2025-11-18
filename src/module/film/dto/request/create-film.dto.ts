import { IsDateString, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class CreateFilmDto {
  @ApiProperty()
  @IsString()
  @Expose()
  title: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @Expose()
  description?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  @Expose()
  releaseDate?: string;

  // @ApiProperty()
  // @IsString()
  // categoryId: string;
}
