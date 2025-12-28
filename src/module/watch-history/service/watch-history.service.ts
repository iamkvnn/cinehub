import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, W } from 'typeorm';
import { WatchHistoryEntity } from '../entity/watch-history.entity';
import { UserService } from 'src/module/user/service/user.service';
import { FilmService } from 'src/module/film/service/film.service';
import { ERROR_MESSAGES } from 'src/common/const/const';
import { EpisodeService } from 'src/module/film/service/episode.service';

@Injectable()
export class WatchHistoryService {
  constructor(
    private readonly userService: UserService,
    private readonly filmService: FilmService,
    private readonly episodeService: EpisodeService,
    @InjectRepository(WatchHistoryEntity)
    private readonly watchHistoryRepository: Repository<WatchHistoryEntity>,
  ) {}

  async recordHeartbeat(
    userId: string,
    filmId: string,
    season?: number,
    episode?: number,
  ): Promise<void> {
    const user = await this.userService.findById(userId);
    const film = await this.filmService.findOne(filmId);
    if (season !== undefined && episode !== undefined) {
      await this.episodeService.findOne(filmId, season, episode);
    }

    let watchRecord = await this.watchHistoryRepository.findOne({
      where: { userId, filmId, season, episode },
      relations: ['user', 'film'],
    });

    if (!watchRecord) {
      watchRecord = this.watchHistoryRepository.create({
        user,
        film,
        season,
        episode,
      });
    }
    else {
      watchRecord.updatedAt = new Date();
      watchRecord.watchedDuration = (watchRecord.updatedAt.getTime() - watchRecord.createdAt.getTime()) / 1000;
    }
    await this.watchHistoryRepository.save(watchRecord);
  }

  async getUserWatchHistory(
    userId: string,
  ): Promise<[WatchHistoryEntity[], number]> {
    const user = await this.userService.findById(userId);
    return await this.watchHistoryRepository.findAndCount({
      where: { user: user},
      relations: ['film', 'user'],
    });
  }

  async removeFromWatchHistory(userId: string, filmId: string): Promise<void> {
    const watchRecord = await this.watchHistoryRepository.findOne({
      where: { user: { id: userId }, film: { id: filmId } },
    });

    if (!watchRecord) {
      throw new BadRequestException(ERROR_MESSAGES.NOT_FOUND);
    }
    await this.watchHistoryRepository.remove(watchRecord);
  }

  async clearWatchHistory(userId: string): Promise<void> {
    const user = await this.userService.findById(userId);
    await this.watchHistoryRepository.delete({ user: { id: userId } });
  }
}
