import { BadRequestException } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class PaginatedApiQuery {
  @ApiProperty({ description: 'Current page', example: 1, default: 1 })
  @IsOptional()
  @IsNumber()
  page: number = 1;

  @ApiProperty({ description: 'Items per page', example: 10, default: 10 })
  @IsOptional()
  @IsNumber()
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

  @ApiProperty({
    description: 'query string for search',
    type: 'string',
    required: false,
  })
  @IsString()
  @IsOptional()
  search?: string;
}
