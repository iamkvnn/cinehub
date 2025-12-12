import { ApiProperty, PickType } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsDate, IsNumber, IsOptional } from 'class-validator';
import { BaseDto } from 'src/core/base/base.dto';

export class EpisodeDto extends BaseDto {
  @ApiProperty({
    description: 'Tập thứ',
    example: 1,
  })
  @IsNumber()
  @Expose()
  number: number;

  @ApiProperty({
    description: 'Ngày phát hành tập',
    example: '2020-01-01',
    required: false,
    nullable: true,
  })
  @IsDate()
  @IsOptional()
  @Expose()
  releaseDate?: Date;
}

export class UpdateEpisodeDto extends PickType(EpisodeDto, ['releaseDate']) {}

export class CreateEpisodeDto extends UpdateEpisodeDto {}
