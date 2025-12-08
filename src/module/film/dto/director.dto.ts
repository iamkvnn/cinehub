import { ApiProperty, OmitType } from "@nestjs/swagger";
import { Expose } from "class-transformer";
import { IsDate, IsDateString, IsEnum, IsOptional, IsString } from "class-validator";
import { BaseDto } from "src/core/base/base.dto";
import { Gender } from "src/module/user/const/user.const";

export class DirectorDto extends BaseDto {
    @ApiProperty({
        description: 'Tên đạo diễn',
        example: 'Christopher Nolan',
    })
    @IsString()
    @Expose()
    name: string;

    @ApiProperty({
        enum: Gender,
        description: 'Giới tính của đạo diễn',
        example: Gender.MALE,
        required: false,
        nullable: true
    })
    @IsOptional()
    @IsEnum(Gender)
    @Expose()
    gender?: Gender;

    @ApiProperty({
        description: 'Tiểu sử của đạo diễn',
        required: false,
        nullable: true
    })
    @IsString()
    @IsOptional()
    @Expose()
    bio?: string;

    @ApiProperty({
        description: 'Ngày sinh của đạo diễn',
        required: false,
        nullable: true
    })
    @IsOptional()
    @IsDateString()
    @Expose()
    birthDate?: string;

    @ApiProperty({
        description: 'Quốc tịch của đạo diễn',
        required: false,
        nullable: true
    })
    @IsString()
    @IsOptional()
    @Expose()
    nationality?: string;

    @ApiProperty({
        description: 'URL ảnh của đạo diễn',
        required: false,
        nullable: true
    })
    @Expose()
    photoUrl?: string;
}

export class UpdateDirectorDto extends OmitType(DirectorDto, ['id', 'createdAt', 'updatedAt', 'deletedAt', 'photoUrl']) {}

export class CreateDirectorDto extends UpdateDirectorDto {}