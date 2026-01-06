import { ApiProperty, PickType } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsString } from 'class-validator';
import { BaseDto } from 'src/core/base/base.dto';

export class GenreDto extends BaseDto {
  @ApiProperty({
    description: 'The name of the genre',
    example: 'Action',
  })
  @IsString()
  @Expose()
  name: string;

  @ApiProperty({
    description: 'The slug of the genre',
    example: 'action',
  })
  @IsString()
  @Expose()
  slug: string;
}

export class UpdateGenreDto extends PickType(GenreDto, ['name', 'slug']) {}

export class CreateGenreDto extends UpdateGenreDto {}
