import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { IsArray } from 'class-validator';
import { PosterDto } from 'src/module/poster/dto/poster.dto';
import { GenreDto } from './genre.dto';

export class FilmResponseDto {
  @ApiProperty({
    description: 'The unique identifier of the film',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  @Expose()
  id: string;

  @ApiProperty({
    description: 'The title of the film',
    example: 'Inception',
  })
  @Expose()
  title: string;

  @ApiProperty({
    description: 'The description of the film',
    example: 'A mind-bending thriller about dream invasion.',
  })
  @Expose()
  description: string;

  @ApiProperty({
    description: 'The posters of the film',
    type: [PosterDto],
  })
  @Type(() => PosterDto)
  @IsArray()
  @Expose()
  posters: PosterDto[];

  @ApiProperty({
    description: 'The genres of the film',
    type: [GenreDto],
  })
  @Type(() => GenreDto)
  @IsArray()
  @Expose()
  genres: GenreDto[];

  @ApiProperty({
    description: 'The number of views of the film',
    example: 1500000,
  })
  @Expose()
  views: number;

  @ApiProperty({
    description: 'The rating of the film',
    example: 8.8,
  })
  @Expose()
  rating: number;

  @ApiProperty({
    description: 'The release date of the film',
    example: '2010-07-16T00:00:00.000Z',
  })
  @Expose()
  releaseDate?: Date;
}
