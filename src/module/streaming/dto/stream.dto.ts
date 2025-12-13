import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class StreamingDto {
  @ApiProperty({ description: 'URL streaming của phim' })
  @Expose()
  url: string;
}
