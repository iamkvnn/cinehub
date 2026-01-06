import { ApiProperty, PickType } from '@nestjs/swagger';
import { Expose, Transform, Type } from 'class-transformer';
import { IsNumber, IsOptional, IsString, ValidateIf } from 'class-validator';
import { BaseDto } from 'src/core/base/base.dto';
import { UserDto } from 'src/module/user/dto/user.dto';
import { ReviewReportDto } from './review-reaction.dto';

export class ReviewDto extends BaseDto {
  @ApiProperty({
    description: 'Nội dung bình luận',
    example: 'Hay!',
  })
  @IsString()
  @Expose()
  content: string;

  @ApiProperty({
    description: 'Đánh giá phim (1-10)',
    example: 10,
  })
  @IsNumber()
  @Expose()
  rating: number;

  @ApiProperty({
    description: 'Tổng số lượt thích',
    example: 10,
  })
  @Expose()
  totalLikes: number;

  @ApiProperty({
    description: 'Tổng số lượt không thích',
    example: 2,
  })
  @Expose()
  totalDislikes: number;

  @ApiProperty({
    description: 'Đánh giá có bình luận hay không',
    example: true,
  })
  @Transform(({ obj }) => obj.comments?.length || 0)
  @Expose()
  totalComments: number;

  @ApiProperty({
    description: 'Thông tin tác giả đánh giá',
    type: () => UserDto,
  })
  @Expose()
  @Type(() => UserDto)
  author: UserDto;

  @ApiProperty({
    description: 'ID phim được đánh giá',
    example: 'film12345',
  })
  @IsString()
  @Expose()
  filmId: string;

  @ApiProperty({
    description: 'Danh sách báo cáo',
    type: () => [ReviewReportDto],
  })
  @Expose()
  @Type(() => ReviewReportDto)
  reports: ReviewReportDto[];

  @ApiProperty({
    description: 'Đã bị báo cáo hay chưa',
    example: true,
  })
  @Expose()
  @Transform(({ obj }) => obj.reports?.length > 0)
  isReported: boolean;
}

export class CreateReviewDto extends PickType(ReviewDto, [
  'content',
  'rating',
  'filmId',
]) {}

export class UpdateReviewDto extends PickType(ReviewDto, [
  'content',
  'rating',
]) {}
