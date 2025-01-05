import { Module } from '@nestjs/common';
import { WebController } from './web.controller';
import { WebService } from './web.service';
import { BasicAuthGuard } from '@/guards/basic-auth.guard';

@Module({
  controllers: [WebController],
  providers: [BasicAuthGuard, WebService],
})
export class WebModule {}
