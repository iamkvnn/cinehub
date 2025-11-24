import { ApiProperty } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';
import { PaginatedApiQuery } from 'src/common/dto';

export class PaginatedFilmByReleaseQuery extends PaginatedApiQuery {
  @ApiProperty({
    description: 'Sắp xếp theo ngày phát hành',
    example: 'DESC',
    required: false,
  })
  @IsOptional()
  releaseSort?: 'ASC' | 'DESC' = 'DESC';
}
