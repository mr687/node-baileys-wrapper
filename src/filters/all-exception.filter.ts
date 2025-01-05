import {
  type ArgumentsHost,
  Catch,
  HttpException,
  HttpStatus,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BaseExceptionFilter } from '@nestjs/core';
import type { FastifyReply } from 'fastify';

type ErrorResponse = {
  errors?: any;
  metadata: any;
};

@Catch()
export class AllExceptionFilter extends BaseExceptionFilter {
  private logger = new Logger(AllExceptionFilter.name);
  constructor(private readonly configService: ConfigService) {
    super();
  }

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<FastifyReply>();
    const { httpAdapter } = this.httpAdapterHost!;

    response.header('Content-Type', 'application/json');

    let errorResponse: ErrorResponse;

    if (exception instanceof HttpException) {
      errorResponse = this._handleHttpException(exception);
    } else {
      errorResponse = this._handleInternalException(exception);
    }

    httpAdapter.reply(
      response,
      errorResponse,
      errorResponse.metadata.statusCode,
    );
  }

  private _handleHttpException(exception: HttpException): ErrorResponse {
    const exceptionStatusCode = exception.getStatus();
    const exceptionResponse = exception.getResponse() as Record<string, any>;

    let errors = exceptionResponse?.errors ?? exceptionResponse?.error ?? null;
    const metadata = {
      status: false,
      statusCode: exceptionStatusCode,
      message: exceptionResponse.message,
    };

    errors = !errors
      ? [metadata.message]
      : Array.isArray(errors)
        ? errors
        : [errors];

    if (exception instanceof ServiceUnavailableException) {
      metadata.message = 'Service unavailable';
    }

    return { errors, metadata: metadata };
  }

  private _handleInternalException(exception: Error | any): ErrorResponse {
    const exceptionStatusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    const isProduction =
      this.configService.get<string>('NODE_ENV') === 'production';

    this.logger.error('[500] Internal server error', exception.stack);

    const metadata = {
      status: false,
      statusCode: exceptionStatusCode,
      message: isProduction ? 'Internal server error' : exception.message,
    };

    return { errors: [metadata.message], metadata: metadata };
  }
}
