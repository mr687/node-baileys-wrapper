import IsValidPhone from '@/validators/is-valid-phone.decorator';
import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class SendMessageRequestDto {
  @ApiProperty()
  @IsString()
  @IsValidPhone()
  phone: string;

  @ApiProperty()
  @IsString()
  message: string;
}
