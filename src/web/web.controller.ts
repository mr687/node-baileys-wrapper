import { BasicAuthGuard } from '@/guards/basic-auth.guard';
import { Controller, Get, Render, UseGuards } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';

@ApiExcludeController()
@UseGuards(BasicAuthGuard)
@Controller()
export class WebController {
  @Get()
  @Render('index.html')
  root() {
    return;
  }
}
