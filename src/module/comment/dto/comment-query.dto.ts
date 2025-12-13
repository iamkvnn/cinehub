import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class CommentQueryDto {
  @ApiProperty({
    description: 'ID phim',
    example: 'film12345',
  })
  @IsString()
  filmId: string;

  @ApiProperty({
    description: 'tập phim',
    example: '1',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  episode?: number;

  @ApiProperty({
    description: 'mùa phim',
    example: '1',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  season?: number;

  @ApiProperty({
    description: 'ID đánh giá',
    example: 'review12345',
    required: false,
  })
  @IsOptional()
  @IsString()
  reviewId?: string;

  @ApiProperty({
    description: 'ID bình luận cha',
    example: 'parent12345',
    required: false,
  })
  @IsOptional()
  @IsString()
  parentId?: string;

  @ApiProperty({
    description: 'Số trang',
    example: 1,
    required: false,
    default: 1,
  })
  @IsOptional()
  @IsNumber()
  page: number = 1;

  @ApiProperty({
    description: 'Số lượng bản ghi trên mỗi trang',
    example: 10,
    required: false,
    default: 10,
  })
  @IsOptional()
  @IsNumber()
  limit: number = 10;
}
