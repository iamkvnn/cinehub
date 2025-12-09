import { ApiProperty } from "@nestjs/swagger";
import { IsOptional } from "class-validator";

export class CommentQueryDto {
    @ApiProperty({
        description: 'ID phim',
        example: 'film12345',
        required: false,
    })
    @IsOptional()
    filmId?: string;

    @ApiProperty({
        description: 'tập phim',
        example: '1',
        required: false,
    })
    @IsOptional()
    episode?: number;

    @ApiProperty({
        description: 'mùa phim',
        example: '1',
        required: false,
    })
    @IsOptional()
    season?: number;

    @ApiProperty({
        description: 'ID đánh giá',
        example: 'review12345',
        required: false,
    })
    @IsOptional()
    reviewId?: string;

    @ApiProperty({
        description: 'ID bình luận cha',
        example: 'parent12345',
        required: false,
    })
    @IsOptional()
    parentId?: string;

    @ApiProperty({
        description: 'Số trang',
        example: 1,
        required: false,
        default: 1,
    })
    @IsOptional()
    page: number = 1;

    @ApiProperty({
        description: 'Số lượng bản ghi trên mỗi trang',
        example: 10,
        required: false,
        default: 10,
    })
    @IsOptional()
    limit: number = 10;
}