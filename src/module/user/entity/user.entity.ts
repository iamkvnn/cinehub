import { BaseEntity } from 'src/core/base/base.entity';
import { Entity, Column, OneToMany } from 'typeorm';
import { Gender, UserRole } from '../const/user.const';
import { WhistlesEntity } from 'src/module/whistles/entity/whistles.entity';
import { WatchHistoryEntity } from 'src/module/watch-history/entity/watch-history.entity';
import { SubscriptionEntity } from 'src/module/subscription/entity/subscription.entity';

@Entity('users')
export class UserEntity extends BaseEntity {
  @Column({ unique: true })
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
}
