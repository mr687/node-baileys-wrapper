import { Module } from '@nestjs/common';
import { WhatsappService } from './whatsapp.service';
import { WhatsappBaileys } from './whatsapp.baileys';
import { WhatsappGateway } from './whatsapp.gateway';
import { WsAuthGuard } from '@/guards/ws-auth.guard';
import { WhatsappController } from './whatsapp.controller';
import { WhatsappWebhook } from './whatsapp.webhook';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [
    HttpModule.register({
      maxRedirects: 3,
      headers: {
        'User-Agent': 'Baileys_Wrapper',
      },
      responseType: 'json',
    }),
  ],
  controllers: [WhatsappController],
  providers: [
    WhatsappBaileys,
    WhatsappService,
    WhatsappWebhook,
    WsAuthGuard,
    WhatsappGateway,
  ],
  exports: [WhatsappService],
})
export class WhatsappModule {}
