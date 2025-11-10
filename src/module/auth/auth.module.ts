import { Module } from '@nestjs/common';
import { AuthService } from './service/auth.service';
import { UserModule } from '../user/user.module';
import { AuthController } from './controller/auth.controller';
import { MailModule } from 'src/core/mail/mail.module';

@Module({
    imports: [UserModule, MailModule],
    providers: [AuthService],
    controllers: [AuthController],
})
export class AuthModule {}
