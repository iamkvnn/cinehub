import { ApiProperty, OmitType } from "@nestjs/swagger";
import { Expose, Type } from "class-transformer";
import { BaseDto } from "src/core/base/base.dto";
import { SeasonStatus } from "../const/const";
import { IsArray, IsDate, IsNumber, IsOptional, ValidateNested } from "class-validator";

export class EpisodeDto extends BaseDto {
    @ApiProperty({
        description: 'Tập thứ',
        example: 1,
    })
    @IsNumber()
    @Expose()
    number: number;

    @ApiProperty({
        description: 'Ngày phát hành tập',
        example: '2020-01-01',
        required: false,
        nullable: true
    })
    @IsDate()
    @IsOptional()
    @Expose()
    releaseDate?: Date;
}

export class UpdateEpisodeDto extends OmitType(EpisodeDto, ['createdAt', 'updatedAt', 'deletedAt']) {}

export class CreateEpisodeDto extends OmitType(UpdateEpisodeDto, ['id']) {}

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

export class UpdateSeasonDto extends OmitType(SeasonDto, ['createdAt', 'updatedAt', 'deletedAt', 'episodes']) {
    @ApiProperty({
        description: 'Tập phim',
        type: [UpdateEpisodeDto],
    })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => UpdateEpisodeDto)
    @IsOptional()
    episodes?: UpdateEpisodeDto[];
}

export class CreateSeasonDto extends OmitType(UpdateSeasonDto, ['id', 'episodes']) {
    @ApiProperty({
        description: 'Tập phim',
        type: [CreateEpisodeDto],
    })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreateEpisodeDto)
    @IsOptional()
    episodes?: CreateEpisodeDto[];
}