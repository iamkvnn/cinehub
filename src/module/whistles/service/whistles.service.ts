import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from 'src/module/user/entity/user.entity';
import { Film } from 'src/module/film/entity/film.entity';
import { WhistlesEntity } from '../entity/whistles.entity';
import {
  WhistlesResponseDto,
  WhistlesListResponseDto,
} from '../dto/whistles.dto';

/**
 * Whistles Service
 * Quản lý danh sách phim yêu thích của người dùng
 * Hỗ trợ soft delete với createdAt, updatedAt, deletedAt
 */
@Injectable()
export class WhistlesService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(Film)
    private readonly filmRepository: Repository<Film>,
    @InjectRepository(WhistlesEntity)
    private readonly whistlesRepository: Repository<WhistlesEntity>,
  ) {}

  /**
   * Thêm phim vào danh sách yêu thích
   * @param userId - ID của người dùng
   * @param filmId - ID của phim
   * @throws BadRequestException nếu user, film không tồn tại hoặc phim đã trong danh sách
   */
  async addToWhistles(
    userId: string,
    filmId: string,
  ): Promise<WhistlesResponseDto> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    const film = await this.filmRepository.findOne({
      where: { id: filmId },
    });

    if (!film) {
      throw new BadRequestException('Film not found');
    }

    // Kiểm tra xem phim đã trong danh sách chưa (bao gồm soft deleted)
    const existingWhistle = await this.whistlesRepository.findOne({
      where: { user: { id: userId }, film: { id: filmId } },
      withDeleted: true,
    });

    if (existingWhistle) {
      if (existingWhistle.deletedAt) {
        // Restore soft deleted record
        await this.whistlesRepository.restore({
          user: { id: userId },
          film: { id: filmId },
        });
        const restored = await this.whistlesRepository.findOne({
          where: { user: { id: userId }, film: { id: filmId } },
          relations: ['film'],
        });
        if (!restored) {
          throw new BadRequestException('Failed to restore whistle');
        }
        return WhistlesResponseDto.fromEntity(restored);
      }
      throw new BadRequestException('Film already in whistles');
    }

    const whistle = this.whistlesRepository.create({
      user,
      film,
    });

    const saved = await this.whistlesRepository.save(whistle);
    return WhistlesResponseDto.fromEntity(saved);
  }

  /**
   * Xóa phim khỏi danh sách yêu thích (soft delete)
   * @param userId - ID của người dùng
   * @param filmId - ID của phim
   */
  async removeFromWhistles(userId: string, filmId: string): Promise<void> {
    const whistle = await this.whistlesRepository.findOne({
      where: { user: { id: userId }, film: { id: filmId } },
    });

    if (!whistle) {
      throw new BadRequestException('Film not found in whistles');
    }

    // Soft delete
    await this.whistlesRepository.softDelete(whistle.id);
  }
  /**
   * Lấy danh sách phim yêu thích của người dùng (không bao gồm soft deleted)
   * @param userId - ID của người dùng
   * @returns Danh sách phim yêu thích
   */
  async getUserWhistles(userId: string): Promise<WhistlesListResponseDto> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    const whistles = await this.whistlesRepository.find({
      where: { user: { id: userId } },
      relations: ['film'],
    });

    return WhistlesListResponseDto.fromEntities(whistles);
  }

  /**
   * Kiểm tra xem phim có trong danh sách yêu thích hay không
   * @param userId - ID của người dùng
   * @param filmId - ID của phim
   * @returns true nếu phim trong danh sách, false nếu không
   */
  async isInWhistles(userId: string, filmId: string): Promise<boolean> {
    const whistle = await this.whistlesRepository.findOne({
      where: { user: { id: userId }, film: { id: filmId } },
    });

    return !!whistle;
  }
}
