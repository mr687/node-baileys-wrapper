import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { WhatsappBaileys } from './whatsapp.baileys';
import { S_WHATSAPP_NET, type WASocket } from '@whiskeysockets/baileys';
import type { EventHandler } from './dto/event.dto';
import {
  GetStateResponseDto,
  SendMessageResponseDto,
} from './dto/response.dto';

@Injectable()
export class WhatsappService {
  constructor(private readonly client: WhatsappBaileys) {}

  async getState(): Promise<GetStateResponseDto> {
    const sock = this.getSocket();
    if (!sock || !sock.user) {
      return {
        status: 'disconnected',
      };
    }

    if (!sock.user.imgUrl) {
      const avatar = await this.getUserAvatarUrl(sock.user!.id);
      sock.user.imgUrl = avatar;
    }

    return {
      status: 'connected',
      user: {
        id: sock.user.id,
        name: sock.user.name ?? 'unknown',
        avatarUrl: sock.user.imgUrl ?? undefined,
      },
    };
  }

  async logout() {
    const sock = this.getSocket();
    if (!sock) throw new ForbiddenException('Your whatsapp is not connected.');
    await sock.logout();
    return;
  }

  async sendTextMessage(
    jid: string,
    text: string,
  ): Promise<SendMessageResponseDto> {
    if (!this.getSocket()) {
      throw new BadRequestException('Your whatsapp is not connected');
    }
    jid = this._toPersonalJID(jid);
    const res = await this.client.sendMessageWithTyping(jid, { text: text });
    return {
      messageId: res!.key.id!,
      messageTimetamp: new Date().getTime().toString(),
    };
  }

  async getUserAvatarUrl(jid: string): Promise<string | null> {
    const sock = this.getSocket();
    if (!sock) {
      return null;
    }

    const avatar = await sock
      .profilePictureUrl(jid, 'image', 3_000)
      .catch(() => null);
    return avatar ?? null;
  }

  private _toPersonalJID(jid: string): string {
    if (!jid) return '';
    if (jid.includes('@')) return jid;
    return `${jid}${S_WHATSAPP_NET}`;
  }

  addHandler(handler: EventHandler) {
    return this.client.addHandler(handler);
  }

  getSocket(): WASocket {
    return this.client.getSocket();
  }

  async connect() {
    return this.client.connect();
  }

  async close() {
    return this.client.close();
  }
}
