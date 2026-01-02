import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { IsEnum, IsString, IsOptional } from 'class-validator';
import { ReactionType, ReportReason } from 'src/module/comment/const/const';
import { UserDto } from 'src/module/user/dto/user.dto';

export class CreateReviewReactionDto {
  @ApiProperty({
    description: 'Loại reaction (like/dislike)',
    enum: ReactionType,
    example: ReactionType.LIKE,
  })
  @IsEnum(ReactionType)
  type: ReactionType;

  @ApiProperty({
    description: 'ID của review',
    example: 'review-uuid-123',
  })
  @IsString()
  reviewId: string;
}

export class ReviewReactionResponseDto {
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
    description: 'Reaction hiện tại của user (nếu có)',
    enum: ReactionType,
    nullable: true,
    example: ReactionType.LIKE,
  })
  @Expose()
  userReaction: ReactionType | null;
}

export class CreateReviewReportDto {
  @ApiProperty({
    description: 'Lý do báo cáo',
    enum: ReportReason,
    example: ReportReason.SPAM,
  })
  @IsEnum(ReportReason)
  reason: ReportReason;

  @ApiProperty({
    description: 'Mô tả chi tiết (tùy chọn)',
    example: 'Đánh giá này chứa nội dung spam',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'ID của review',
    example: 'review-uuid-123',
  })
  @IsString()
  reviewId: string;
}

export class ReviewReportDto {
  @ApiProperty({
    description: 'ID của báo cáo',
    example: 'report-uuid-123',
  })
  @Expose()
  id: string;

  @ApiProperty({
    description: 'Lý do báo cáo',
    enum: ReportReason,
    example: ReportReason.SPAM,
  })
  @Expose()
  reason: ReportReason;

  @ApiProperty({
    description: 'Mô tả chi tiết',
    example: 'Đánh giá này chứa nội dung spam',
  })
  @Expose()
  description?: string;

  @ApiProperty({
    description: 'User báo cáo',
    type: () => UserDto,
  })
  @Type(() => UserDto)
  @Expose()
  user: UserDto;

  @ApiProperty({
    description: 'ID của review bị báo cáo',
    example: 'review-uuid-123',
  })
  @Expose()
  reviewId: string;

  @ApiProperty({
    description: 'Thời gian tạo',
    example: '2024-01-01T00:00:00.000Z',
  })
  @Expose()
  createdAt: Date;
}
