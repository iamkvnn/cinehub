import { BaseDto } from 'src/core/base/base.dto';
import { ApiProperty } from '@nestjs/swagger';
import { WhistlesEntity } from '../entity/whistles.entity';

/**
 * Create Whistles DTO
 * Dùng để thêm phim vào danh sách yêu thích
 */
export class CreateWhistlesDto {
  @ApiProperty({
    description: 'ID của phim',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  filmId: string;
}

/**
 * Whistles Response DTO
 * Dùng để trả về thông tin phim yêu thích
 */
export class WhistlesResponseDto extends BaseDto {
  @ApiProperty({
    description: 'ID của phim',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  filmId: string;

  /**
   * Mapping từ WhistlesEntity sang WhistlesResponseDto
   * @param entity - Whistles Entity
   * @returns Whistles Response DTO
   */
  static fromEntity(entity: WhistlesEntity): WhistlesResponseDto {
    const dto = new WhistlesResponseDto();
    dto.id = entity.id;
    dto.filmId = entity.film.id;
    dto.createdAt = entity.createdAt;
    dto.updatedAt = entity.updatedAt;
    return dto;
  }
}

/**
 * Whistles List Response DTO
 * Dùng để trả về danh sách phim yêu thích
 */
export class WhistlesListResponseDto {
  @ApiProperty({
    description: 'Danh sách phim yêu thích',
    type: [WhistlesResponseDto],
  })
  data: WhistlesResponseDto[];

  @ApiProperty({
    description: 'Tổng số phim yêu thích',
    example: 10,
  })
  total: number;

  /**
   * Mapping từ mảng WhistlesEntity sang WhistlesListResponseDto
   * @param entities - Mảng Whistles Entity
   * @returns Whistles List Response DTO
   */
  static fromEntities(entities: WhistlesEntity[]): WhistlesListResponseDto {
    return {
      data: entities.map((entity) => WhistlesResponseDto.fromEntity(entity)),
      total: entities.length,
    };
  }
}
