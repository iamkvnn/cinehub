import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConsoleLogger, ValidationPipe, VersioningType } from '@nestjs/common';
import { validationPipeOptions } from './common/pipe';
import { HttpExceptionFilter } from './common/filter';
import { HttpLoggingInterceptor } from './common/interceptor';
import { JwtAuthGuard } from './common/guard';
declare const module: any;

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: new ConsoleLogger({
      json: false,
      prefix: 'CineHub',
    }),
  });
  app.enableCors();
  app.setGlobalPrefix('api');
  app.enableVersioning({
    type:  VersioningType.URI,
    defaultVersion: '1',
  });

  app.useGlobalPipes(new ValidationPipe(validationPipeOptions));
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new HttpLoggingInterceptor());

  // const jwtAuthGuard = app.get(JwtAuthGuard);
  // app.useGlobalGuards(jwtAuthGuard);

  app.enableShutdownHooks();
  await app.listen(process.env.PORT ?? 3000);

  if (module.hot) {
    module.hot.accept();
    module.hot.dispose(() => app.close());
  }
}
bootstrap();
