import { BasicAuthGuard } from '@/guards/basic-auth.guard';
import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { WhatsappService } from './whatsapp.service';
import { SendMessageRequestDto } from './dto/request.dto';
import { ApiBasicAuth } from '@nestjs/swagger';

@UseGuards(BasicAuthGuard)
@ApiBasicAuth()
@Controller()
export class WhatsappController {
  constructor(private readonly service: WhatsappService) {}

  @Get('state')
  async getState() {
    return this.service.getState();
  }

  @Post('logout')
  async logout() {
    return this.service.logout();
  }

  @Post('send-message')
  async sendMessage(@Body() { phone, message }: SendMessageRequestDto) {
    return this.service.sendTextMessage(phone, message);
  }
}
