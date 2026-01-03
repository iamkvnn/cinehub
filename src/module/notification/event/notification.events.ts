/**
 * Event names for the notification system
 * Used with @nestjs/event-emitter for event-driven notifications
 */
export const NOTIFICATION_EVENT_NAMES = {
  // Film events
  FILM_CREATED: 'film.created',
  FILM_PUBLISHED: 'film.published',
  FILM_UPDATED: 'film.updated',
  EPISODE_CREATED: 'episode.created',
  SEASON_CREATED: 'season.created',

  // Comment events
  COMMENT_REPLIED: 'comment.replied',
  COMMENT_MENTIONED: 'comment.mentioned',

  // Subscription events
  SUBSCRIPTION_ACTIVATED: 'subscription.activated',
  SUBSCRIPTION_CANCELLED: 'subscription.cancelled',
  SUBSCRIPTION_EXPIRING: 'subscription.expiring',
  SUBSCRIPTION_EXPIRED: 'subscription.expired',
  SUBSCRIPTION_RENEWED: 'subscription.renewed',
  SUBSCRIPTION_UPGRADED: 'subscription.upgraded',

  // Payment events
  PAYMENT_SUCCESS: 'payment.success',
  PAYMENT_FAILED: 'payment.failed',
  PAYMENT_REFUNDED: 'payment.refunded',

  // User/System events
  USER_REGISTERED: 'user.registered',
  USER_VERIFIED: 'user.verified',
  USER_PASSWORD_CHANGED: 'user.password_changed',

  // Admin-specific events (for real-time admin panel notifications)
  ADMIN_USER_SUBSCRIBED: 'admin.user_subscribed',
  ADMIN_USER_UNSUBSCRIBED: 'admin.user_unsubscribed',
  ADMIN_PAYMENT_RECEIVED: 'admin.payment_received',
  ADMIN_PAYMENT_FAILED: 'admin.payment_failed',
} as const;

export type NotificationEventName =
  (typeof NOTIFICATION_EVENT_NAMES)[keyof typeof NOTIFICATION_EVENT_NAMES];
