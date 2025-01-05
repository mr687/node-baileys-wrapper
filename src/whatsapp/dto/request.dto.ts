import IsValidPhone from '@/validators/is-valid-phone.decorator';
import type { MemoryStorageFile } from '@mr687/nest-file-fastify';
import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class SendMessageRequestDto {
  @ApiProperty()
  @IsString()
  @IsValidPhone()
  phone: string;

  @ApiProperty()
  @IsString()
  message: string;
}

export class SendFileRequestDto {
  @ApiProperty({ required: true })
  @IsString()
  @IsValidPhone()
  phone: string;

  @ApiProperty({ required: false })
  @IsOptional()
  caption?: string;

  @ApiProperty({ type: 'string', format: 'binary', required: true })
  file: MemoryStorageFile;
}
