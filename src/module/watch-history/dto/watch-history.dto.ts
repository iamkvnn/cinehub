import { BaseDto } from 'src/core/base/base.dto';
import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { FilmDto } from 'src/module/film/dto/film.dto';

export class WatchHistoryDto extends BaseDto {
  @ApiProperty({
    description: 'ID của phim',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @Expose()
  filmId: string;

  @ApiProperty({
    description: 'Thông tin phim',
    type: FilmDto,
  })
  @Expose()
  @Type(() => FilmDto)
  film: FilmDto;

  @ApiProperty({
    description: 'Thời lượng đã xem (tính bằng giây)',
    example: 3600,
  })
  @Expose()
  watchedDuration: number;
}
