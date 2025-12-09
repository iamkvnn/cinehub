import { ApiProperty, PickType } from "@nestjs/swagger";
import { Expose, Transform, Type } from "class-transformer";
import { IsNumber, IsOptional, IsString, ValidateIf } from "class-validator";
import { BaseDto } from "src/core/base/base.dto";
import { UserDto } from "src/module/user/dto/user.dto";

export class CommentDto extends BaseDto {
    @ApiProperty({
        description: 'Nội dung bình luận',
        example: 'Hay!',
    })
    @IsString()
    @Expose()
    content: string;

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
        description: 'Tổng số phản hồi',
        example: 2,
    })
    @Transform(({ obj }) => obj.replies?.length || 0)
    @Expose()
    totalReplies: number;

    @ApiProperty({
        description: 'Mùa (nếu bình luận về một tập phim)',
        example: 1,
        required: false,
    })
    @IsNumber()
    @ValidateIf(o => o.episode !== undefined)
    @Expose()
    season?: number;

    @ApiProperty({
        description: 'Tập (nếu bình luận về một tập phim)',
        example: 3,
        required: false,
    })
    @IsNumber()
    @ValidateIf(o => o.season !== undefined)
    @Expose()
    episode?: number;

    @ApiProperty({
        description: 'ID bình luận cha (nếu là phản hồi)',
        example: 'cmt12345',
        required: false,
    })
    @IsString()
    @IsOptional()
    @Expose()
    parentId?: string;

    @ApiProperty({
        description: 'Thông tin tác giả bình luận',
        type: () => UserDto,
    })
    @Expose()
    @Type(() => UserDto)
    author: UserDto;
}

export class CreateCommentDto extends PickType(CommentDto, [
    'content',
    'season',
    'episode',
    'parentId',
]) {
    @ApiProperty({
        description: 'ID phim được bình luận',
        example: 'film12345',
    })
    @IsString()
    @Expose()
    filmId: string;

    @ApiProperty({
        description: 'ID đánh giá được bình luận',
        example: 'review12345',
        required: false,
    })
    @IsOptional()
    @IsString()
    @Expose()
    reviewId?: string;
}

export class UpdateCommentDto extends PickType(CommentDto, [
    'content',
]) {}