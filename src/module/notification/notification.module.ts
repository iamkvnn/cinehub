import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationEntity } from './entity/notification.entity';
import { UserNotificationEntity } from './entity/user-notification.entity';
import { NotificationService } from './service/notification.service';
import { NotificationGateway } from './gateway/notification.gateway';
import { NotificationController } from './controller/notification.controller';
import { AdminNotificationController } from './controller/admin-notification.controller';
import { AdminNotificationService } from './service/admin-notification.service';
import { UserEntity } from '../user/entity/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      NotificationEntity,
      UserNotificationEntity,
      UserEntity,
    ]),
  ],
  controllers: [NotificationController, AdminNotificationController],
  providers: [
    NotificationService,
    NotificationGateway,
    AdminNotificationService,
  ],
  exports: [NotificationService, NotificationGateway, AdminNotificationService],
})
export class NotificationModule {}
