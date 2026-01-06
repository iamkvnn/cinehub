import { BaseEntity } from 'src/core/base/base.entity';
import { UserEntity } from 'src/module/user/entity/user.entity';
import { Column, Entity, Index, JoinColumn, ManyToOne, Unique } from 'typeorm';
import { NotificationStatus } from '../const/notification.const';
import { NotificationEntity } from './notification.entity';

@Entity('user_notifications')
@Unique(['userId', 'notificationId'])
@Index(['userId', 'status'])
export class UserNotificationEntity extends BaseEntity {
  @Column({ type: 'varchar', length: 36 })
  userId: string;

  @Column({ type: 'varchar', length: 36 })
  notificationId: string;

  @Column({
    type: 'enum',
    enum: NotificationStatus,
    default: NotificationStatus.UNREAD,
  })
  status: NotificationStatus;

  @Column({ type: 'datetime', nullable: true })
  readAt?: Date;

  @ManyToOne(() => UserEntity, (user) => user.userNotifications, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'userId' })
  user: UserEntity;

  @ManyToOne(
    () => NotificationEntity,
    (notification) => notification.userNotifications,
    { onDelete: 'CASCADE' },
  )
  @JoinColumn({ name: 'notificationId' })
  notification: NotificationEntity;
}
