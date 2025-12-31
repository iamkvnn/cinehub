import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class HeartbeatDto {
  @ApiProperty({ description: 'Vị trí hiện tại của phim' })
  @IsNumber()
  @Expose()
  currentTime: number;

  @ApiProperty({ description: 'ID của bản ghi xem' })
  @IsString()
  @IsOptional()
  @Expose()
  watchId?: string;
}
