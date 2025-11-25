import { BaseDto } from 'src/core/base/base.dto';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { WatchHistoryEntity } from '../entity/watch-history.entity';

/**
 * Create Watch History DTO
 * Dùng để tạo hoặc cập nhật lịch sử xem
 */
export class CreateWatchHistoryDto {
  @ApiProperty({
    description: 'ID của phim',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  filmId: string;

  @ApiProperty({
    description: 'Thời lượng đã xem (tính bằng giây)',
    example: 3600,
  })
  watchedDuration: number;

  @ApiProperty({
    description: 'Tổng thời lượng phim (tính bằng giây)',
    example: 7200,
  })
  totalDuration: number;
}

/**
 * Watch History Response DTO
 * Dùng để trả về thông tin lịch sử xem
 */
export class WatchHistoryResponseDto extends BaseDto {
  @ApiProperty({
    description: 'ID của phim',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  filmId: string;

  @ApiProperty({
    description: 'Thời lượng đã xem (tính bằng giây)',
    example: 3600,
  })
  watchedDuration: number;

  @ApiProperty({
    description: 'Tổng thời lượng phim (tính bằng giây)',
    example: 7200,
  })
  totalDuration: number;

  @ApiPropertyOptional({
    description: 'Phần trăm đã xem (%)',
    example: 50,
  })
  watchPercentage?: number;

  /**
   * Mapping từ WatchHistoryEntity sang WatchHistoryResponseDto
   * @param entity - Watch History Entity
   * @returns Watch History Response DTO
   */
  static fromEntity(entity: WatchHistoryEntity): WatchHistoryResponseDto {
    const dto = new WatchHistoryResponseDto();
    dto.id = entity.id;
    dto.filmId = entity.film.id;
    dto.watchedDuration = entity.watchedDuration;
    dto.totalDuration = entity.totalDuration;
    dto.watchPercentage =
      entity.totalDuration > 0
        ? Math.round(
            (entity.watchedDuration / entity.totalDuration) * 100 * 100,
          ) / 100
        : 0;
    dto.createdAt = entity.createdAt;
    dto.updatedAt = entity.updatedAt;
    return dto;
  }
}

/**
 * Watch History List Response DTO
 * Dùng để trả về danh sách lịch sử xem
 */
export class WatchHistoryListResponseDto {
  @ApiProperty({
    description: 'Danh sách lịch sử xem',
    type: [WatchHistoryResponseDto],
  })
  data: WatchHistoryResponseDto[];

  @ApiProperty({
    description: 'Tổng số lịch sử xem',
    example: 10,
  })
  total: number;

  /**
   * Mapping từ mảng WatchHistoryEntity sang WatchHistoryListResponseDto
   * @param entities - Mảng Watch History Entity
   * @returns Watch History List Response DTO
   */
  static fromEntities(
    entities: WatchHistoryEntity[],
  ): WatchHistoryListResponseDto {
    return {
      data: entities.map((entity) =>
        WatchHistoryResponseDto.fromEntity(entity),
      ),
      total: entities.length,
    };
  }
}
