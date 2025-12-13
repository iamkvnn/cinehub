import { ApiProperty, OmitType } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import {
  IsDate,
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
} from 'class-validator';
import { BaseDto } from 'src/core/base/base.dto';
import { Gender } from 'src/module/user/const/user.const';

export class ActorDto extends BaseDto {
  @ApiProperty({
    description: 'Tên diễn viên',
    example: 'Leonardo DiCaprio',
  })
  @IsString()
  @Expose()
  name: string;

  @ApiProperty({
    enum: Gender,
    description: 'Giới tính của diễn viên',
    example: Gender.MALE,
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsEnum(Gender)
  @Expose()
  gender?: Gender;

  @ApiProperty({
    description: 'Tiểu sử của diễn viên',
    required: false,
    nullable: true,
  })
  @IsString()
  @IsOptional()
  @Expose()
  bio?: string;

  @ApiProperty({
    description: 'Ngày sinh của diễn viên',
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsDateString()
  @Expose()
  birthDate?: string;

  @ApiProperty({
    description: 'Quốc tịch của diễn viên',
    required: false,
    nullable: true,
  })
  @IsString()
  @IsOptional()
  @Expose()
  nationality?: string;

  @ApiProperty({
    description: 'URL ảnh của diễn viên',
    required: false,
    nullable: true,
  })
  @Expose()
  photoUrl?: string;
}

export class UpdateActorDto extends OmitType(ActorDto, [
  'id',
  'createdAt',
  'updatedAt',
  'deletedAt',
  'photoUrl',
]) {}

export class CreateActorDto extends UpdateActorDto {}
