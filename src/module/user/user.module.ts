import { forwardRef, Module } from '@nestjs/common';
import { UserController } from './controller/user.controller';
import { UserService } from './service/user.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from './entity/user.entity';
import { StripeModule } from '../stripe/stripe.module';
import { AdminController } from './controller/admin.controller';
import { MediaModule } from '../media/media.module';
import { SubscriptionModule } from '../subscription/subscription.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserEntity]),
    StripeModule,
    MediaModule,
    forwardRef(() => SubscriptionModule),
  ],
  controllers: [UserController, AdminController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
