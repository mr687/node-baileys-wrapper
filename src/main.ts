import { NestFactory } from '@nestjs/core';
import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { AppModule } from './app.module';
import { registerFastify } from './config/fastify.config';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';
import compression from '@fastify/compress';
import helmet from '@fastify/helmet';
import { join } from 'node:path';
import { BodyValidationPipe } from './pipes/body-validation.pipe';
import { registerSwaggerModule } from './config/swagger';
import FastifyMultipart from '@fastify/multipart';

async function bootstrap() {
  const logger = new Logger(bootstrap.name);

  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    registerFastify(),
    { rawBody: true },
  );

  app.useGlobalPipes(new BodyValidationPipe());
  app.enableCors();
  await app.register(compression);
  await app.register(helmet, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", 'cdn.socket.io'],
        imgSrc: ["'self'", 'data:', 'pps.whatsapp.net'],
      },
    },
  });

  app.useStaticAssets({
    root: join(__dirname, '..', 'public'),
    prefix: '/public/',
  });
  app.setViewEngine({
    engine: {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      handlebars: require('handlebars'),
    },
    templates: join(__dirname, '..', 'views'),
  });

  app.register(FastifyMultipart);

  const configService = app.get(ConfigService);

  await registerSwaggerModule(app, configService);

  const httpHost = configService.get('HTTP_HOST');
  const httpPort = +configService.get('HTTP_PORT');

  await app.listen(httpPort, httpHost);
  logger.log(`App is listening on ${await app.getUrl()}`);
}

bootstrap();
