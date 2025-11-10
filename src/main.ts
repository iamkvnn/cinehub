import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConsoleLogger, ValidationPipe, VersioningType } from '@nestjs/common';
import { validationPipeOptions } from './common/pipe';
import { HttpExceptionFilter } from './common/filter';
import {
  HttpLoggingInterceptor,
  ResponseTransformInterceptor,
} from './common/interceptor';
import { DocumentBuilder } from '@nestjs/swagger/dist/document-builder';
import { SwaggerModule } from '@nestjs/swagger/dist/swagger-module';
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
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  app.useGlobalPipes(new ValidationPipe(validationPipeOptions));
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(
    new HttpLoggingInterceptor(),
    new ResponseTransformInterceptor(),
  );

  // const jwtAuthGuard = app.get(JwtAuthGuard);
  // app.useGlobalGuards(jwtAuthGuard);

  const config = new DocumentBuilder()
    .setTitle('CineHub API')
    .setDescription('The CineHub API description')
    .addBearerAuth()
    .setVersion('1.0')
    .addTag('cinehub')
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/v1/api-docs', app, documentFactory);

  app.enableShutdownHooks();
  await app.listen(process.env.PORT ?? 3000);

  if (module.hot) {
    module.hot.accept();
    module.hot.dispose(() => app.close());
  }
}
bootstrap();
