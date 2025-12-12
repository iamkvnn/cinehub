import { ApiProperty, PickType } from "@nestjs/swagger";
import { Expose, Type } from "class-transformer";
import { IsInstance, IsString } from "class-validator";
import { BaseDto } from "src/core/base/base.dto";
import { ActorDto } from "./actor.dto";

export class CastDto extends BaseDto {
    @ApiProperty({
        description: 'Tên nhân vật',
        example: 'Leonardo DiCaprio',
    })
    @IsString()
    @Expose()
    character: string;

    @ApiProperty({
      description: 'Diễn viên',
      type: ActorDto,
    })
    @Type(() => ActorDto)
    @Expose()
    actor: ActorDto;
}

export class UpdateCastDto extends PickType(CastDto, ['character']) {
    @ApiProperty({
        description: 'Id diễn viên',
        example: 'actor12345',
    })
    @IsString()
    @Expose()
    actorId: string;
}