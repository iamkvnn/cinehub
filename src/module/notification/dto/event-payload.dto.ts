import { FilmStatus, FilmType } from 'src/module/film/const/const';

/**
 * Base payload for all notification events
 */
export interface BaseEventPayload {
  timestamp: Date;
  triggeredBy?: string; // userId who triggered the action (admin or user)
}

/**
 * Payload for film.created and film.published events
 */
export interface FilmCreatedPayload extends BaseEventPayload {
  filmId: string;
  filmTitle: string;
  filmType: FilmType;
  status: FilmStatus;
  posterUrl?: string;
  genres?: string[];
  description?: string;
}

/**
 * Payload for film.updated event
 */
export interface FilmUpdatedPayload extends BaseEventPayload {
  filmId: string;
  filmTitle: string;
  filmType: FilmType;
  previousStatus?: FilmStatus;
  newStatus?: FilmStatus;
  posterUrl?: string;
}

/**
 * Payload for episode.created event
 */
export interface EpisodeCreatedPayload extends BaseEventPayload {
  filmId: string;
  filmTitle: string;
  seasonId: string;
  seasonNumber: number;
  episodeId: string;
  episodeNumber: number;
  episodeTitle?: string;
}

/**
 * Payload for season.created event
 */
export interface SeasonCreatedPayload extends BaseEventPayload {
  filmId: string;
  filmTitle: string;
  seasonId: string;
  seasonNumber: number;
  seasonTitle?: string;
}

/**
 * Payload for comment.replied event
 */
export interface CommentRepliedPayload extends BaseEventPayload {
  commentId: string;
  parentCommentId: string;
  parentCommentAuthorId: string;
  filmId: string;
  filmTitle: string;
  replyAuthorId: string;
  replyAuthorName: string;
  replyContent: string;
}

/**
 * Payload for subscription events
 */
export interface SubscriptionEventPayload extends BaseEventPayload {
  subscriptionId: string;
  userId: string;
  planId: string;
  planName: string;
  expiryDate?: Date;
  daysRemaining?: number;
  previousPlanName?: string; // For upgrade events
}

/**
 * Payload for payment events
 */
export interface PaymentEventPayload extends BaseEventPayload {
  paymentId?: string;
  userId: string;
  amount: number;
  currency: string;
  planName?: string;
  failureReason?: string;
}

/**
 * Payload for user.registered event
 */
export interface UserRegisteredPayload extends BaseEventPayload {
  userId: string;
  email: string;
  fullName?: string;
}

/**
 * Payload for user.password_changed event
 */
export interface UserPasswordChangedPayload extends BaseEventPayload {
  userId: string;
  email: string;
}
