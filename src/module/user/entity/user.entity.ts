import { BaseEntity } from 'src/core/base/base.entity';
import { Entity, Column, OneToMany } from 'typeorm';
import { Gender, UserPlan, UserRole } from '../const/user.const';
import { WhistlesEntity } from 'src/module/whistles/entity/whistles.entity';
import { WatchHistoryEntity } from 'src/module/watch-history/entity/watch-history.entity';

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

  @Column({ type: 'enum', enum: UserPlan, default: UserPlan.FREE })
  plan: UserPlan;

  @Column()
  password: string;

  @Column({ default: false })
  isVerified: boolean;

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
}
