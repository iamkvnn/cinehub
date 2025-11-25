import { Module } from '@nestjs/common';
import { AuthModule } from './module/auth/auth.module';
import { UserModule } from './module/user/user.module';
import { ConfigModule } from '@nestjs/config';
import config from './config/config';
import { DatabaseModule } from './core/database/database.module';
import { HealthcheckModule } from './core/health/healthcheck.module';
import { FilmModule } from './module/film/film.module';
import { PosterModule } from './module/poster/poster.module';
import { AwsModule } from './module/aws/aws.module';
import { MediaModule } from './module/media/media.module';
import { WhistlesModule } from './module/whistles/whistles.module';
import { WatchHistoryModule } from './module/watch-history/watch-history.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [config],
      isGlobal: true,
    }),
    DatabaseModule,
    HealthcheckModule,
    FilmModule,
    AuthModule,
    UserModule,
    PosterModule,
    AwsModule,
    MediaModule,
    WhistlesModule,
    WatchHistoryModule,
  ],
})
export class AppModule {}
