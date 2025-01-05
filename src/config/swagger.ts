import { INestApplication, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  DocumentBuilder,
  SwaggerModule,
  type SwaggerDocumentOptions,
} from '@nestjs/swagger';
import type { FastifyReply, FastifyRequest } from 'fastify';

function setupSwaggerMiddleware(
  app: INestApplication,
  configService: ConfigService,
) {
  const swaggerUsername = configService.get<string>('SWAGGER_USERNAME', '');
  const swaggerPassword = configService.get<string>(
    'SWAGGER_PASSWORD',
    'secret',
  );
  const expectedToken = Buffer.from(
    `${swaggerUsername}:${swaggerPassword}`,
    'utf8',
  ).toString('base64');
  const credentialsRE = /^(?:basic) ([\w.~+-]+=*)$/i;

  async function swaggerAuthMiddleware(
    req: FastifyRequest['raw'],
    res: FastifyReply['raw'],
    next: (...args: any[]) => void,
  ) {
    const credentials = req.headers['authorization'] || null;
    const done = (err: any) => {
      res.setHeader('WWW-Authenticate', 'Basic realm=app');
      next(err);
    };
    if (typeof credentials !== 'string') {
      done(new UnauthorizedException());
      return;
    }
    const match = credentialsRE.exec(credentials);
    if (match === null) {
      done(new UnauthorizedException());
      return;
    }
    if (match[1].trim() !== expectedToken) {
      done(new UnauthorizedException());
      return;
    }

    next();
  }
  app.use('/swagger', swaggerAuthMiddleware);
}

export async function registerSwaggerModule(
  app: INestApplication,
  config: ConfigService,
) {
  const swaggerConfig = new DocumentBuilder()
    .setTitle('API Docs')
    .setDescription('The API documentation')
    .setVersion('1.0.0')
    .addBasicAuth()
    .build();

  const options: SwaggerDocumentOptions = {
    operationIdFactory: (_controllerKey: string, methodKey: string) =>
      methodKey,
  };

  const documentFactory = () =>
    SwaggerModule.createDocument(app, swaggerConfig, options);
  SwaggerModule.setup('swagger', app, documentFactory, {
    jsonDocumentUrl: '/swagger/api.json',
    swaggerUiEnabled:
      config.get<string>('ENABLE_SWAGGER_UI', 'true') === 'true',
  });

  setupSwaggerMiddleware(app, config);
}
