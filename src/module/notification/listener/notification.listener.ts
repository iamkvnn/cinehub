import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { NotificationService } from '../service/notification.service';
import { NotificationGateway } from '../gateway/notification.gateway';
import { AdminNotificationService } from '../service/admin-notification.service';
import { NOTIFICATION_EVENT_NAMES } from '../event/notification.events';
import { NotificationType } from '../const/notification.const';
import type {
  FilmCreatedPayload,
  FilmUpdatedPayload,
  EpisodeCreatedPayload,
  SeasonCreatedPayload,
  CommentRepliedPayload,
  SubscriptionEventPayload,
  PaymentEventPayload,
  AdminSubscriptionEventPayload,
  AdminPaymentEventPayload,
} from '../dto/event-payload.dto';

@Injectable()
export class NotificationListener {
  private readonly logger = new Logger(NotificationListener.name);

  constructor(
    private readonly notificationService: NotificationService,
    private readonly notificationGateway: NotificationGateway,
    private readonly adminNotificationService: AdminNotificationService,
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

  /**
   * Handle subscription.activated event
   * Sends notification to user when subscription is activated
   */
  @OnEvent(NOTIFICATION_EVENT_NAMES.SUBSCRIPTION_ACTIVATED, { async: true })
  async handleSubscriptionActivated(payload: SubscriptionEventPayload) {
    try {
      this.logger.log(
        `Handling subscription.activated event for user: ${payload.userId}`,
      );

      const endDateStr = payload.expiryDate
        ? new Date(payload.expiryDate).toLocaleDateString('vi-VN')
        : 'N/A';

      const notification = await this.notificationGateway.sendToUser(
        payload.userId,
        {
          title: `🎉 Đăng ký thành công!`,
          content: `Bạn đã đăng ký gói ${payload.planName} thành công. Thời hạn đến ${endDateStr}.`,
          type: NotificationType.SUBSCRIPTION,
          metadata: {
            subscriptionId: payload.subscriptionId,
            planId: payload.planId,
            planName: payload.planName,
            expiryDate: payload.expiryDate,
          },
        },
        payload.triggeredBy,
      );

      this.logger.log(
        `Subscription activated notification sent: ${notification.id}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send subscription.activated notification: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Handle subscription.cancelled event
   * Sends notification to user when subscription is cancelled
   */
  @OnEvent(NOTIFICATION_EVENT_NAMES.SUBSCRIPTION_CANCELLED, { async: true })
  async handleSubscriptionCancelled(payload: SubscriptionEventPayload) {
    try {
      this.logger.log(
        `Handling subscription.cancelled event for user: ${payload.userId}`,
      );

      const endDateStr = payload.expiryDate
        ? new Date(payload.expiryDate).toLocaleDateString('vi-VN')
        : 'N/A';

      const notification = await this.notificationGateway.sendToUser(
        payload.userId,
        {
          title: `Hủy đăng ký thành công`,
          content: `Bạn đã hủy gói ${payload.planName}. Bạn vẫn được sử dụng dịch vụ đến ${endDateStr}.`,
          type: NotificationType.SUBSCRIPTION,
          metadata: {
            subscriptionId: payload.subscriptionId,
            planId: payload.planId,
            planName: payload.planName,
            expiryDate: payload.expiryDate,
          },
        },
        payload.triggeredBy,
      );

      this.logger.log(
        `Subscription cancelled notification sent: ${notification.id}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send subscription.cancelled notification: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Handle subscription.expiring event
   * Sends reminder notification when subscription is about to expire
   */
  @OnEvent(NOTIFICATION_EVENT_NAMES.SUBSCRIPTION_EXPIRING, { async: true })
  async handleSubscriptionExpiring(payload: SubscriptionEventPayload) {
    try {
      this.logger.log(
        `Handling subscription.expiring event for user: ${payload.userId}`,
      );

      const endDateStr = payload.expiryDate
        ? new Date(payload.expiryDate).toLocaleDateString('vi-VN')
        : 'N/A';

      const notification = await this.notificationGateway.sendToUser(
        payload.userId,
        {
          title: `⏰ Gói đăng ký sắp hết hạn`,
          content: `Gói ${payload.planName} của bạn sẽ hết hạn vào ${endDateStr}. Gia hạn ngay để không bị gián đoạn!`,
          type: NotificationType.SUBSCRIPTION,
          metadata: {
            subscriptionId: payload.subscriptionId,
            planId: payload.planId,
            planName: payload.planName,
            expiryDate: payload.expiryDate,
            daysRemaining: payload.daysRemaining,
          },
        },
        payload.triggeredBy,
      );

      this.logger.log(
        `Subscription expiring notification sent: ${notification.id}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send subscription.expiring notification: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Handle subscription.expired event
   * Sends notification when subscription has expired
   */
  @OnEvent(NOTIFICATION_EVENT_NAMES.SUBSCRIPTION_EXPIRED, { async: true })
  async handleSubscriptionExpired(payload: SubscriptionEventPayload) {
    try {
      this.logger.log(
        `Handling subscription.expired event for user: ${payload.userId}`,
      );

      const notification = await this.notificationGateway.sendToUser(
        payload.userId,
        {
          title: `Gói đăng ký đã hết hạn`,
          content: `Gói ${payload.planName} của bạn đã hết hạn. Đăng ký lại để tiếp tục trải nghiệm!`,
          type: NotificationType.SUBSCRIPTION,
          metadata: {
            subscriptionId: payload.subscriptionId,
            planId: payload.planId,
            planName: payload.planName,
          },
        },
        payload.triggeredBy,
      );

      this.logger.log(
        `Subscription expired notification sent: ${notification.id}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send subscription.expired notification: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Handle payment.success event
   * Sends notification when payment is successful
   */
  @OnEvent(NOTIFICATION_EVENT_NAMES.PAYMENT_SUCCESS, { async: true })
  async handlePaymentSuccess(payload: PaymentEventPayload) {
    try {
      this.logger.log(
        `Handling payment.success event for user: ${payload.userId}`,
      );

      const amountStr = new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: payload.currency || 'VND',
      }).format(payload.amount);

      const notification = await this.notificationGateway.sendToUser(
        payload.userId,
        {
          title: `✓ Thanh toán thành công`,
          content: `Bạn đã thanh toán ${amountStr} cho gói ${payload.planName || 'subscription'}.`,
          type: NotificationType.PAYMENT,
          metadata: {
            paymentId: payload.paymentId,
            amount: payload.amount,
            currency: payload.currency,
            planName: payload.planName,
          },
        },
        payload.triggeredBy,
      );

      this.logger.log(`Payment success notification sent: ${notification.id}`);
    } catch (error) {
      this.logger.error(
        `Failed to send payment.success notification: ${error.message}`,
        error.stack,
      );
    }
  }

  // ============================================
  // ADMIN NOTIFICATION HANDLERS
  // Send real-time SSE notifications to admin panel
  // ============================================

  /**
   * Handle admin.user_subscribed event
   * Sends SSE notification to all connected admin users
   */
  @OnEvent(NOTIFICATION_EVENT_NAMES.ADMIN_USER_SUBSCRIBED, { async: true })
  async handleAdminUserSubscribed(payload: AdminSubscriptionEventPayload) {
    try {
      this.logger.log(
        `Handling admin.user_subscribed event for user: ${payload.userName}`,
      );

      const amountStr = payload.amount
        ? new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: payload.currency || 'VND',
          }).format(payload.amount)
        : '';

      // Broadcast to all admin SSE clients
      const sentCount = this.adminNotificationService.broadcast({
        title: `🎉 Đăng ký mới!`,
        message: `${payload.userName} (${payload.userEmail}) đã đăng ký gói ${payload.planName}${amountStr ? ` - ${amountStr}` : ''}`,
        type: NotificationType.ADMIN_USER_SUBSCRIBED as any,
        data: {
          userId: payload.userId,
          userName: payload.userName,
          userEmail: payload.userEmail,
          planId: payload.planId,
          planName: payload.planName,
          amount: payload.amount,
          currency: payload.currency,
          subscriptionId: payload.subscriptionId,
        },
      });

      this.logger.log(
        `Admin user subscribed notification sent to ${sentCount} clients`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send admin.user_subscribed notification: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Handle admin.user_unsubscribed event
   * Sends SSE notification when user cancels subscription
   */
  @OnEvent(NOTIFICATION_EVENT_NAMES.ADMIN_USER_UNSUBSCRIBED, { async: true })
  async handleAdminUserUnsubscribed(payload: AdminSubscriptionEventPayload) {
    try {
      this.logger.log(
        `Handling admin.user_unsubscribed event for user: ${payload.userName}`,
      );

      // Broadcast to all admin SSE clients
      const sentCount = this.adminNotificationService.broadcast({
        title: `⚠️ Hủy đăng ký`,
        message: `${payload.userName} (${payload.userEmail}) đã hủy gói ${payload.planName}`,
        type: NotificationType.ADMIN_USER_UNSUBSCRIBED as any,
        data: {
          userId: payload.userId,
          userName: payload.userName,
          userEmail: payload.userEmail,
          planId: payload.planId,
          planName: payload.planName,
          subscriptionId: payload.subscriptionId,
        },
      });

      this.logger.log(
        `Admin user unsubscribed notification sent to ${sentCount} clients`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send admin.user_unsubscribed notification: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Handle admin.payment_received event
   * Sends SSE notification when payment is successful
   */
  @OnEvent(NOTIFICATION_EVENT_NAMES.ADMIN_PAYMENT_RECEIVED, { async: true })
  async handleAdminPaymentReceived(payload: AdminPaymentEventPayload) {
    try {
      this.logger.log(
        `Handling admin.payment_received event for user: ${payload.userName}`,
      );

      const amountStr = new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: payload.currency || 'VND',
      }).format(payload.amount);

      // Broadcast to all admin SSE clients
      const sentCount = this.adminNotificationService.broadcast({
        title: `💰 Thanh toán mới!`,
        message: `${payload.userName} đã thanh toán ${amountStr}${payload.planName ? ` cho gói ${payload.planName}` : ''}`,
        type: NotificationType.ADMIN_PAYMENT_RECEIVED as any,
        data: {
          userId: payload.userId,
          userName: payload.userName,
          userEmail: payload.userEmail,
          amount: payload.amount,
          currency: payload.currency,
          planName: payload.planName,
          paymentId: payload.paymentId,
        },
      });

      this.logger.log(
        `Admin payment received notification sent to ${sentCount} clients`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send admin.payment_received notification: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Handle admin.payment_failed event
   * Sends SSE notification when payment fails
   */
  @OnEvent(NOTIFICATION_EVENT_NAMES.ADMIN_PAYMENT_FAILED, { async: true })
  async handleAdminPaymentFailed(payload: AdminPaymentEventPayload) {
    try {
      this.logger.log(
        `Handling admin.payment_failed event for user: ${payload.userName}`,
      );

      // Broadcast to all admin SSE clients
      const sentCount = this.adminNotificationService.broadcast({
        title: `❌ Thanh toán thất bại`,
        message: `Thanh toán của ${payload.userName} thất bại${payload.failureReason ? `: ${payload.failureReason}` : ''}`,
        type: NotificationType.ADMIN_PAYMENT_FAILED as any,
        data: {
          userId: payload.userId,
          userName: payload.userName,
          userEmail: payload.userEmail,
          amount: payload.amount,
          currency: payload.currency,
          failureReason: payload.failureReason,
        },
      });

      this.logger.log(
        `Admin payment failed notification sent to ${sentCount} clients`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send admin.payment_failed notification: ${error.message}`,
        error.stack,
      );
    }
  }
}
