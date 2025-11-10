import { BadRequestException } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsOptional } from 'class-validator';

export class PaginatedApiQuery {
  @ApiProperty({ description: 'Current page', example: 1, default: 1 })
  @IsOptional()
  page: number = 1;

  @ApiProperty({ description: 'Items per page', example: 10, default: 10 })
  @IsOptional()
  limit: number = 10;

  @ApiProperty({
    description: 'Sort, e.g: {"createdAt":"DESC"}',
    type: 'string',
    example: '{ "createdAt": "DESC" }',
    required: false,
  })
  @Transform(({ value }) => {
    try {
      return JSON.parse(value);
    } catch {
      throw new BadRequestException('Invalid JSON format for sort parameter');
    }
  })
  @IsOptional()
  sort?: Record<string, string>;
}
