import { Module } from '@nestjs/common';
import { registerConfig } from './config/config.config';
import { WhatsappModule } from './whatsapp/whatsapp.module';
import { WebModule } from './web/web.module';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { AllExceptionFilter } from './filters/all-exception.filter';
import { ResponseTransformInterceptor } from './interceptors/response-transform.interceptor';

@Module({
  imports: [registerConfig(), WhatsappModule, WebModule],
  providers: [
    { provide: APP_FILTER, useClass: AllExceptionFilter },
    { provide: APP_INTERCEPTOR, useClass: ResponseTransformInterceptor },
  ],
})
export class AppModule {}
