import { BaseEntity } from 'src/core/base/base.entity';
import { Entity, Column, OneToMany, Unique } from 'typeorm';
import { Gender, UserRole } from '../const/user.const';
import { WhistlesEntity } from 'src/module/whistles/entity/whistles.entity';
import { WatchHistoryEntity } from 'src/module/watch-history/entity/watch-history.entity';
import { SubscriptionEntity } from 'src/module/subscription/entity/subscription.entity';
import { UserNotificationEntity } from 'src/module/notification/entity/user-notification.entity';

@Entity('users')
@Unique(['email', 'role'])
export class UserEntity extends BaseEntity {
  @Column()
  email: string;

  @Column()
  name: string;

  @Column({ type: 'enum', enum: Gender })
  gender: Gender;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.USER })
  role: UserRole;

  @Column()
  password: string;

  @Column({ default: false })
  isVerified: boolean;

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true })
  stripeCustomerId: string;

  @Column({ nullable: true })
  otp?: string;

  @Column({ nullable: true })
  otpExpiresAt?: Date;

  @Column({ nullable: true })
  refreshToken?: string;

  @OneToMany(() => WhistlesEntity, (whistle) => whistle.user)
  whistles: WhistlesEntity[];

  @OneToMany(() => WatchHistoryEntity, (history) => history.user)
  watchHistory: WatchHistoryEntity[];

  @OneToMany(() => SubscriptionEntity, (subscription) => subscription.user)
  subscriptions: SubscriptionEntity[];

  @OneToMany(
    () => UserNotificationEntity,
    (userNotification) => userNotification.user,
  )
  userNotifications: UserNotificationEntity[];
}
