import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from 'src/module/user/entity/user.entity';
import { Film } from 'src/module/film/entity/film.entity';
import { WatchHistoryEntity } from '../entity/watch-history.entity';
import {
  CreateWatchHistoryDto,
  WatchHistoryResponseDto,
  WatchHistoryListResponseDto,
} from '../dto/watch-history.dto';

/**
 * Watch History Service
 * Quản lý lịch sử xem phim của người dùng
 * Hỗ trợ soft delete với createdAt, updatedAt, deletedAt
 */
@Injectable()
export class WatchHistoryService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(Film)
    private readonly filmRepository: Repository<Film>,
    @InjectRepository(WatchHistoryEntity)
    private readonly watchHistoryRepository: Repository<WatchHistoryEntity>,
  ) {}

  /**
   * Ghi nhận/cập nhật lịch sử xem phim
   * Nếu phim chưa được xem, thêm mới
   * Nếu phim đã được xem, cập nhật thời gian xem
   *
   * @param userId - ID của người dùng
   * @param createDto - Thông tin phim và thời gian xem
   * @returns Thông tin lịch sử xem đã lưu
   * @throws BadRequestException nếu user hoặc film không tồn tại
   */
  async recordWatch(
    userId: string,
    createDto: CreateWatchHistoryDto,
  ): Promise<WatchHistoryResponseDto> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    const film = await this.filmRepository.findOne({
      where: { id: createDto.filmId },
    });

    if (!film) {
      throw new BadRequestException('Film not found');
    }

    // Kiểm tra xem phim đã trong lịch sử hay chưa (bao gồm soft deleted)
    const existingRecord = await this.watchHistoryRepository.findOne({
      where: { user: { id: userId }, film: { id: createDto.filmId } },
      withDeleted: true,
    });

    let watchRecord: WatchHistoryEntity | null;

    if (existingRecord) {
      if (existingRecord.deletedAt) {
        // Restore soft deleted record
        await this.watchHistoryRepository.restore(existingRecord.id);
      }
      // Update watched duration
      watchRecord = await this.watchHistoryRepository.findOne({
        where: { user: { id: userId }, film: { id: createDto.filmId } },
      });
      if (!watchRecord) {
        throw new BadRequestException('Watch history record not found');
      }
      watchRecord.watchedDuration = createDto.watchedDuration;
      watchRecord.totalDuration = createDto.totalDuration;
      watchRecord = await this.watchHistoryRepository.save(watchRecord);
    } else {
      // Create new record
      watchRecord = this.watchHistoryRepository.create({
        user,
        film,
        watchedDuration: createDto.watchedDuration,
        totalDuration: createDto.totalDuration,
      });
      watchRecord = await this.watchHistoryRepository.save(watchRecord);
    }

    const watchPercentage =
      (createDto.watchedDuration / createDto.totalDuration) * 100;

    const response = WatchHistoryResponseDto.fromEntity(watchRecord);
    response.watchPercentage = Math.round(watchPercentage * 100) / 100;

    return response;
  }

  /**
   * Lấy danh sách phim đã xem của người dùng (không bao gồm soft deleted)
   *
   * @param userId - ID của người dùng
   * @returns Danh sách lịch sử xem
   * @throws BadRequestException nếu user không tồn tại
   */
  async getUserWatchHistory(
    userId: string,
  ): Promise<WatchHistoryListResponseDto> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    const watchHistories = await this.watchHistoryRepository.find({
      where: { user: { id: userId } },
      relations: ['film'],
    });

    return WatchHistoryListResponseDto.fromEntities(watchHistories);
  }

  /**
   * Xóa một phim khỏi lịch sử xem (soft delete)
   *
   * @param userId - ID của người dùng
   * @param filmId - ID của phim cần xóa
   * @throws BadRequestException nếu bản ghi không tồn tại
   */
  async removeFromWatchHistory(userId: string, filmId: string): Promise<void> {
    const watchRecord = await this.watchHistoryRepository.findOne({
      where: { user: { id: userId }, film: { id: filmId } },
    });

    if (!watchRecord) {
      throw new BadRequestException('Watch history record not found');
    }

    // Soft delete
    await this.watchHistoryRepository.softDelete(watchRecord.id);
  }

  /**
   * Xóa toàn bộ lịch sử xem của người dùng (soft delete)
   *
   * @param userId - ID của người dùng
   * @throws BadRequestException nếu user không tồn tại
   */
  async clearWatchHistory(userId: string): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    // Soft delete all records for this user
    await this.watchHistoryRepository.softDelete({
      user: { id: userId },
    });
  }
}
