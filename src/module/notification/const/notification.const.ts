export enum NotificationType {
  SYSTEM = 'SYSTEM',
  FILM_NEW = 'FILM_NEW',
  FILM_UPDATE = 'FILM_UPDATE',
  COMMENT_REPLY = 'COMMENT_REPLY',
  SUBSCRIPTION = 'SUBSCRIPTION',
  PAYMENT = 'PAYMENT',
  // Admin notification types (for real-time SSE notifications)
  INFO = 'info',
  SUCCESS = 'success',
  WARNING = 'warning',
  ERROR = 'error',
  // Admin subscription notification types
  ADMIN_USER_SUBSCRIBED = 'admin.user_subscribed',
  ADMIN_USER_UNSUBSCRIBED = 'admin.user_unsubscribed',
  ADMIN_PAYMENT_RECEIVED = 'admin.payment_received',
  ADMIN_PAYMENT_FAILED = 'admin.payment_failed',
}

export enum NotificationStatus {
  UNREAD = 'UNREAD',
  READ = 'READ',
}

export enum NotificationTargetType {
  SINGLE = 'single', // Gửi đến 1 user cụ thể
  GROUP = 'group', // Gửi đến một nhóm users
  BROADCAST = 'broadcast', // Gửi đến tất cả users
}

export const NOTIFICATION_EVENTS = {
  // Server -> Client events
  NOTIFICATION: 'notification',
  NOTIFICATION_BROADCAST: 'notification:broadcast',
  NOTIFICATION_READ: 'notification:read',

  // Client -> Server events
  JOIN_ROOM: 'join:room',
  LEAVE_ROOM: 'leave:room',
  MARK_AS_READ: 'mark:read',
};

export const NOTIFICATION_ROOMS = {
  ALL_USERS: 'all_users',
  PREMIUM_USERS: 'premium_users',
  userRoom: (userId: string) => `user_${userId}`,
  filmRoom: (filmId: string) => `film_${filmId}`,
};
