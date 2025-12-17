import { ApiProperty, PickType } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { BaseDto } from 'src/core/base/base.dto';

export class GenreDto extends BaseDto {
  @ApiProperty({
    description: 'The name of the genre',
    example: 'Action',
  })
  @Expose()
  name: string;
}

export class UpdateGenreDto extends PickType(GenreDto, ['name', 'id']) {}

export class CreateGenreDto extends PickType(GenreDto, ['name']) {}
