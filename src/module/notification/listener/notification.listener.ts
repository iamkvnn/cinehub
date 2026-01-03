import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { NotificationService } from '../service/notification.service';
import { NotificationGateway } from '../gateway/notification.gateway';
import { NOTIFICATION_EVENT_NAMES } from '../event/notification.events';
import { NotificationType } from '../const/notification.const';
import type {
  FilmCreatedPayload,
  FilmUpdatedPayload,
  EpisodeCreatedPayload,
  SeasonCreatedPayload,
  CommentRepliedPayload,
} from '../dto/event-payload.dto';

@Injectable()
export class NotificationListener {
  private readonly logger = new Logger(NotificationListener.name);

  constructor(
    private readonly notificationService: NotificationService,
    private readonly notificationGateway: NotificationGateway,
  ) {}

  /**
   * Handle film.created event
   * Broadcasts notification to all users when a new film is created
   */
  @OnEvent(NOTIFICATION_EVENT_NAMES.FILM_CREATED, { async: true })
  async handleFilmCreated(payload: FilmCreatedPayload) {
    try {
      this.logger.log(
        `Handling film.created event for film: ${payload.filmTitle}`,
      );

      const notification = await this.notificationGateway.broadcastToAll(
        {
          title: `🎬 Phim mới: ${payload.filmTitle}`,
          content: payload.description
            ? `${payload.description.slice(0, 150)}${payload.description.length > 150 ? '...' : ''}`
            : `${payload.filmTitle} đã được thêm vào CineHub. Xem ngay!`,
          type: NotificationType.FILM_NEW,
          metadata: {
            filmId: payload.filmId,
            filmTitle: payload.filmTitle,
            filmType: payload.filmType,
            posterUrl: payload.posterUrl,
            genres: payload.genres,
          },
        },
        payload.triggeredBy,
      );

      this.logger.log(`Film created notification sent: ${notification.id}`);
    } catch (error) {
      this.logger.error(
        `Failed to send film.created notification: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Handle film.published event
   * Broadcasts notification when a film status changes to published/releasing
   */
  @OnEvent(NOTIFICATION_EVENT_NAMES.FILM_PUBLISHED, { async: true })
  async handleFilmPublished(payload: FilmUpdatedPayload) {
    try {
      this.logger.log(
        `Handling film.published event for film: ${payload.filmTitle}`,
      );

      const notification = await this.notificationGateway.broadcastToAll(
        {
          title: `🎬 Phim đã phát hành: ${payload.filmTitle}`,
          content: `${payload.filmTitle} hiện đã có sẵn trên CineHub. Xem ngay!`,
          type: NotificationType.FILM_NEW,
          metadata: {
            filmId: payload.filmId,
            filmTitle: payload.filmTitle,
            filmType: payload.filmType,
            posterUrl: payload.posterUrl,
            previousStatus: payload.previousStatus,
            newStatus: payload.newStatus,
          },
        },
        payload.triggeredBy,
      );

      this.logger.log(`Film published notification sent: ${notification.id}`);
    } catch (error) {
      this.logger.error(
        `Failed to send film.published notification: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Handle episode.created event
   * Sends notification to users who have watched this series
   */
  @OnEvent(NOTIFICATION_EVENT_NAMES.EPISODE_CREATED, { async: true })
  async handleEpisodeCreated(payload: EpisodeCreatedPayload) {
    try {
      this.logger.log(
        `Handling episode.created event: ${payload.filmTitle} S${payload.seasonNumber}E${payload.episodeNumber}`,
      );

      // For now, broadcast to all users
      // TODO: In future, get users who have watched this series from WatchHistoryService
      const notification = await this.notificationGateway.broadcastToAll(
        {
          title: `📺 Tập mới: ${payload.filmTitle}`,
          content: `Tập ${payload.episodeNumber}${payload.episodeTitle ? ` - ${payload.episodeTitle}` : ''} (Season ${payload.seasonNumber}) đã có sẵn!`,
          type: NotificationType.FILM_UPDATE,
          metadata: {
            filmId: payload.filmId,
            filmTitle: payload.filmTitle,
            seasonId: payload.seasonId,
            seasonNumber: payload.seasonNumber,
            episodeId: payload.episodeId,
            episodeNumber: payload.episodeNumber,
            episodeTitle: payload.episodeTitle,
          },
        },
        payload.triggeredBy,
      );

      this.logger.log(`Episode created notification sent: ${notification.id}`);
    } catch (error) {
      this.logger.error(
        `Failed to send episode.created notification: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Handle season.created event
   * Sends notification to users who have watched this series
   */
  @OnEvent(NOTIFICATION_EVENT_NAMES.SEASON_CREATED, { async: true })
  async handleSeasonCreated(payload: SeasonCreatedPayload) {
    try {
      this.logger.log(
        `Handling season.created event: ${payload.filmTitle} Season ${payload.seasonNumber}`,
      );

      // Broadcast to all users
      const notification = await this.notificationGateway.broadcastToAll(
        {
          title: `🎬 Season mới: ${payload.filmTitle}`,
          content: `Season ${payload.seasonNumber}${payload.seasonTitle ? ` - ${payload.seasonTitle}` : ''} đã có sẵn trên CineHub!`,
          type: NotificationType.FILM_UPDATE,
          metadata: {
            filmId: payload.filmId,
            filmTitle: payload.filmTitle,
            seasonId: payload.seasonId,
            seasonNumber: payload.seasonNumber,
            seasonTitle: payload.seasonTitle,
          },
        },
        payload.triggeredBy,
      );

      this.logger.log(`Season created notification sent: ${notification.id}`);
    } catch (error) {
      this.logger.error(
        `Failed to send season.created notification: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Handle comment.replied event
   * Sends notification to parent comment author when someone replies
   */
  @OnEvent(NOTIFICATION_EVENT_NAMES.COMMENT_REPLIED, { async: true })
  async handleCommentReplied(payload: CommentRepliedPayload) {
    try {
      this.logger.log(
        `Handling comment.replied event: ${payload.replyAuthorName} replied to comment ${payload.parentCommentId}`,
      );

      // Don't notify if user replies to their own comment (already checked in service, but double-check)
      if (payload.replyAuthorId === payload.parentCommentAuthorId) {
        this.logger.log('Skipping notification: user replied to own comment');
        return;
      }

      // Truncate reply content for notification
      const truncatedContent =
        payload.replyContent.length > 100
          ? `${payload.replyContent.slice(0, 100)}...`
          : payload.replyContent;

      const notification = await this.notificationGateway.sendToUser(
        payload.parentCommentAuthorId,
        {
          title: `💬 ${payload.replyAuthorName} đã trả lời bình luận của bạn`,
          content: truncatedContent,
          type: NotificationType.COMMENT_REPLY,
          metadata: {
            commentId: payload.commentId,
            parentCommentId: payload.parentCommentId,
            filmId: payload.filmId,
            filmTitle: payload.filmTitle,
            replyAuthorId: payload.replyAuthorId,
            replyAuthorName: payload.replyAuthorName,
          },
        },
        payload.replyAuthorId,
      );

      this.logger.log(
        `Comment reply notification sent to user ${payload.parentCommentAuthorId}: ${notification.id}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send comment.replied notification: ${error.message}`,
        error.stack,
      );
    }
  }
}
