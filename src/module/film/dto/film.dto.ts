import { BaseDto } from "src/core/base/base.dto";
import { AgeLimit, FilmStatus, FilmType } from "../const/const";
import { GenreDto } from "./genre.dto";
import { Expose, Type } from "class-transformer";
import { ApiProperty, OmitType, PickType } from "@nestjs/swagger";
import { IsArray, IsDate, IsEnum, IsOptional, IsString, ValidateNested } from "class-validator";
import { DirectorDto } from "./director.dto";
import { ActorDto } from "./actor.dto";
import { PosterDto } from "src/module/poster/dto/poster.dto";
import { CreateSeasonDto, SeasonDto, UpdateSeasonDto } from "./season.dto";

export class FilmDto extends BaseDto {
  @ApiProperty({
    description: 'Tiêu đề phim',
    example: 'Inception',
  })
  @IsString()
  @Expose()
  title: string;

  @ApiProperty({
    description: 'Tiêu đề gốc',
    example: 'Inception',
  })
  @Expose()
  @IsString()
  originalTitle: string;

    @ApiProperty({
    description: 'Tiêu đề tiếng Anh',
    example: 'Inception',
    })
    @IsString()
    @Expose()
  englishTitle: string;

  @ApiProperty({
    description: 'Mô tả phim',
    example: 'A mind-bending thriller about dream invasion.',
    required: false,
    nullable: true,
  })
  @IsString()
  @IsOptional()
  @Expose()
  description?: string;

  @ApiProperty({
    description: 'Số lượt xem',
    example: 10,
  })
  @Expose()
  views: number;

  @ApiProperty({
    description: 'Đánh giá của người dùng',
    example: 8.5,
  })
  @Expose()
  userRating: number;

  @ApiProperty({
    enum: AgeLimit,
    description: 'Giới hạn độ tuổi',
    example: AgeLimit.T18,
  })
  @IsEnum(AgeLimit)
  @Expose()
  ageLimit: AgeLimit;

  @ApiProperty({
    description: 'Quốc gia sản xuất',
    example: 'USA',
  })
  @IsString()
  @Expose()
  country: string;

    @ApiProperty({
    description: 'Đánh giá trên IMDb',
    example: 7.8,
    })
    @Expose()
  imdbRating: number;

    @ApiProperty({
    description: 'Ngày phát hành',
    example: '2010-07-16',
    })
    @IsDate()
    @Expose()
  releaseDate: Date;

    @ApiProperty({
    enum: FilmStatus,
    description: 'Trạng thái phim',
    example: FilmStatus.RELEASING,
    })
    @Expose()
  status: FilmStatus;

    @ApiProperty({
    enum: FilmType,
    description: 'Loại phim',
    example: FilmType.MOVIE,
    })
    @IsEnum(FilmType)
    @Expose()
  type: FilmType;

  @ApiProperty({
    description: 'Thể loại phim',
    type: [GenreDto],
  })
  @Type(() => GenreDto)
  @Expose()
  genres: GenreDto[];

    @ApiProperty({
    description: 'Đạo diễn',
    type: [DirectorDto],
  })
  @Type(() => DirectorDto)
  @Expose()
  directors: DirectorDto[];

    @ApiProperty({
    description: 'Diễn viên',
    type: [ActorDto],
  })
  @Type(() => ActorDto)
  @Expose()
  actors: ActorDto[];

    @ApiProperty({
    description: 'Áp phích phim',
    type: [PosterDto],
  })
  @Type(() => PosterDto)
  @Expose()
  posters: PosterDto[];

    @ApiProperty({
    description: 'Mùa phim',
    type: [SeasonDto],
  })
  @Type(() => SeasonDto)
  @Expose()
  seasons: SeasonDto[];
}

export class UpdateFilmDto extends PickType(FilmDto, ['title', 'originalTitle', 'englishTitle', 'description', 'ageLimit', 'country', 'releaseDate', 'status', 'type']) {
    @ApiProperty({
    description: 'Đạo diễn',
    type: [String],
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  directors?: string[];

    @ApiProperty({
    description: 'Diễn viên',
    type: [String],
    required: false,
    nullable: true,
  })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
  actors?: string[];

    @ApiProperty({
    description: 'Thể loại',
    type: [String],
    required: false,
    nullable: true,
  })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
  genres?: string[];
}

export class CreateFilmDto extends UpdateFilmDto {}