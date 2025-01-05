import { BasicAuthGuard } from '@/guards/basic-auth.guard';
import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { WhatsappService } from './whatsapp.service';
import { SendFileRequestDto, SendMessageRequestDto } from './dto/request.dto';
import { ApiBasicAuth, ApiConsumes } from '@nestjs/swagger';
import {
  FileInterceptor,
  MemoryStorageFile,
  UploadedFile,
} from '@mr687/nest-file-fastify';

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

  @ApiConsumes('multipart/form-data')
  @Post('send-file')
  @UseInterceptors(FileInterceptor('file'))
  async sendFile(
    @UploadedFile() file: MemoryStorageFile,
    @Body() data: SendFileRequestDto,
  ) {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    data.file = file;
    return this.service.sendFileMessage(data);
  }
}
