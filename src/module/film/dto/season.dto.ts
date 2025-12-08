import { ApiProperty, PickType } from "@nestjs/swagger";
import { Expose } from "class-transformer";
import { BaseDto } from "src/core/base/base.dto";
import { SeasonStatus } from "../const/const";
import { IsDate, IsNumber, IsOptional } from "class-validator";
import { EpisodeDto } from "./episode.dto";

export class SeasonDto extends BaseDto {
    @ApiProperty({
        description: 'Mùa thứ',
        example: 1,
    })
    @IsNumber()
    @Expose()
    number: number;

    @ApiProperty({
        description: 'Năm phát hành',
        example: '2020-01-01',
        required: false,
        nullable: true
    })
    @IsDate()
    @IsOptional()
    @Expose()
    releaseDate?: Date;
    
    @ApiProperty({
        description: 'Ngày kết thúc',
        example: '2020-12-31',
        required: false,
        nullable: true
    })
    @IsDate()
    @IsOptional()
    @Expose()
    endDate?: Date;

    @ApiProperty({
        enum: SeasonStatus,
        description: 'Trạng thái mùa',
        example: SeasonStatus.UPCOMING,
    })
    @Expose()
    status: SeasonStatus;
    
    @ApiProperty({
        description: 'Tập phim',
        type: [EpisodeDto],
    })
    @Expose()
    episodes: EpisodeDto[];
}

export class UpdateSeasonDto extends PickType(SeasonDto, ['releaseDate', 'endDate', 'status']) { }

export class CreateSeasonDto extends UpdateSeasonDto { }