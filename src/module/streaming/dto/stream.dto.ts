import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class StreamingDto {
  @ApiProperty({ description: 'URL streaming của phim' })
  @Expose()
  url: string;
}

export class VideoStatusDto {
  @ApiProperty({ description: 'Trạng thái của video' })
  @Expose()
  status: string;
}