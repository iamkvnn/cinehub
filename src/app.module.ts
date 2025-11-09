import { Module } from '@nestjs/common';
import { AuthModule } from './module/auth/auth.module';
import { UserModule } from './module/user/user.module';
import { ConfigModule } from '@nestjs/config';
import config from './config/config';
import { DatabaseModule } from './core/database/database.module';
import { HealthcheckModule } from './core/health/healthcheck.module';

@Module({ 
  imports: [
    ConfigModule.forRoot({
      load: [config],
      isGlobal: true,
    }),
    DatabaseModule,
    HealthcheckModule,
    AuthModule,
    UserModule
  ],
})
export class AppModule {}
