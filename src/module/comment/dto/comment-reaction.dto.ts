import { ApiProperty } from "@nestjs/swagger";
import { Expose } from "class-transformer";
import { IsEnum, IsString, IsOptional } from "class-validator";
import { ReportReason } from "../const/const";
import { ReactionType } from "../const/const";

export class CreateCommentReactionDto {
    @ApiProperty({
        description: 'Loại reaction (like/dislike)',
        enum: ReactionType,
        example: ReactionType.LIKE,
    })
    @IsEnum(ReactionType)
    type: ReactionType;

    @ApiProperty({
        description: 'ID của comment',
        example: 'comment-uuid-123',
    })
    @IsString()
    commentId: string;
}

export class CommentReactionDto {
    @ApiProperty({
        description: 'ID của reaction',
        example: 'reaction-uuid-123',
    })
    @Expose()
    id: string;

    @ApiProperty({
        description: 'Loại reaction (like/dislike)',
        enum: ReactionType,
        example: ReactionType.LIKE,
    })
    @Expose()
    type: ReactionType;

    @ApiProperty({
        description: 'ID của user',
        example: 'user-uuid-123',
    })
    @Expose()
    userId: string;

    @ApiProperty({
        description: 'ID của comment',
        example: 'comment-uuid-123',
    })
    @Expose()
    commentId: string;
}

export class CommentReactionResponseDto {
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

export class CreateCommentReportDto {
    @ApiProperty({
        description: 'Lý do báo cáo',
        enum: ReportReason,
        example: ReportReason.SPAM,
    })
    @IsEnum(ReportReason)
    reason: ReportReason;

    @ApiProperty({
        description: 'Mô tả chi tiết (tùy chọn)',
        example: 'Bình luận này chứa nội dung spam',
        required: false,
    })
    @IsString()
    @IsOptional()
    description?: string;

    @ApiProperty({
        description: 'ID của comment',
        example: 'comment-uuid-123',
    })
    @IsString()
    commentId: string;
}

export class CommentReportDto {
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
        example: 'Bình luận này chứa nội dung spam',
    })
    @Expose()
    description?: string;

    @ApiProperty({
        description: 'ID của user báo cáo',
        example: 'user-uuid-123',
    })
    @Expose()
    userId: string;

    @ApiProperty({
        description: 'ID của comment bị báo cáo',
        example: 'comment-uuid-123',
    })
    @Expose()
    commentId: string;

    @ApiProperty({
        description: 'Thời gian tạo',
        example: '2024-01-01T00:00:00.000Z',
    })
    @Expose()
    createdAt: Date;
}
