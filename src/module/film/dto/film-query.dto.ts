import { ApiProperty } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';
import { PaginatedApiQuery } from 'src/common/dto';
import { AgeLimit, FilmStatus, FilmType } from '../const/const';

export class FilmQueryDto extends PaginatedApiQuery {
  @ApiProperty({
    description: 'Country of the film',
    type: 'string',
    required: false,
  })
  @IsOptional()
  country?: string;

  @ApiProperty({
    description: 'Release year of the film',
    type: 'number',
    required: false,
  })
  @IsOptional()
  releaseYear?: number;

  @ApiProperty({
    description: 'Genre ID of the film',
    type: 'string',
    required: false,
  })
  @IsOptional()
  genreId?: string;

  @ApiProperty({
    description: 'Director ID of the film',
    type: 'string',
    required: false,
  })
  @IsOptional()
  directorId?: string;

  @ApiProperty({
    description: 'Actor ID of the film',
    type: 'string',
    required: false,
  })
  @IsOptional()
  actorId?: string;

  @ApiProperty({
    description: 'Status of the film',
    enum: FilmStatus,
    required: false,
  })
  @IsOptional()
  status?: FilmStatus;

  @ApiProperty({
    description: 'Type of the film',
    enum: FilmType,
    required: false,
  })
  @IsOptional()
  type?: FilmType;

  @ApiProperty({
    description: 'Age limit of the film',
    enum: AgeLimit,
    required: false,
  })
  @IsOptional()
  ageLimit?: AgeLimit;
}
