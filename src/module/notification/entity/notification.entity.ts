import { BaseEntity } from 'src/core/base/base.entity';
import { UserEntity } from 'src/module/user/entity/user.entity';
import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import {
  NotificationTargetType,
  NotificationType,
} from '../const/notification.const';
import { UserNotificationEntity } from './user-notification.entity';

@Entity('notifications')
export class NotificationEntity extends BaseEntity {
  @Column()
  title: string;

  @Column({ type: 'text' })
  content: string;

  @Column({
    type: 'enum',
    enum: NotificationType,
    default: NotificationType.SYSTEM,
  })
  type: NotificationType;

  @Column({
    type: 'enum',
    enum: NotificationTargetType,
    default: NotificationTargetType.SINGLE,
  })
  targetType: NotificationTargetType;

  @Column({ type: 'json', nullable: true })
  metadata?: Record<string, any>;

  @Column({ type: 'varchar', length: 36, nullable: true })
  senderId?: string;

  @ManyToOne(() => UserEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'senderId' })
  sender?: UserEntity;

  @OneToMany(
    () => UserNotificationEntity,
    (userNotification) => userNotification.notification,
  )
  userNotifications: UserNotificationEntity[];
}
