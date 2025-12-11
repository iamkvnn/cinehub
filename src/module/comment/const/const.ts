export enum ReactionType {
    LIKE = 'like',
    DISLIKE = 'dislike',
}

export enum ReportReason {
    SPAM = 'spam',
    HARASSMENT = 'harassment',
    HATE_SPEECH = 'hate_speech',
    MISINFORMATION = 'misinformation',
    INAPPROPRIATE = 'inappropriate',
    OTHER = 'other',
}

export enum ReportStatus {
    PENDING = 'pending',
    REVIEWED = 'reviewed',
    RESOLVED = 'resolved',
    DISMISSED = 'dismissed',
}