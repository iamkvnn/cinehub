import { BaseDto } from 'src/core/base/base.dto';
import { PosterType } from '../const/poster.const';
import { Expose } from 'class-transformer';
import { IsEnum, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class PosterDto extends BaseDto {
  @ApiProperty()
  @IsString()
  @Expose()
  url: string;

  @ApiProperty({ enum: PosterType })
  @IsEnum(PosterType)
  @Expose()
  type: PosterType;
}
