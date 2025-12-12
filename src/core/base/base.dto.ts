import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsUUID } from 'class-validator';

export abstract class BaseDto {
  @ApiProperty({ description: 'Unique identifier' })
  @IsUUID()
  @Expose()
  id: string;

  @ApiProperty({ description: 'Creation timestamp' })
  @Expose()
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  @Expose()
  updatedAt: Date;

  @ApiProperty({
    description: 'Soft deletion timestamp',
    required: false,
    default: null,
  })
  @Expose()
  deletedAt?: Date | null;
}
