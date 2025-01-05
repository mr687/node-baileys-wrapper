import {
  BaseWsExceptionFilter,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import type { WASocket } from '@whiskeysockets/baileys';
import type { Server } from 'socket.io';
import { WhatsappService } from './whatsapp.service';
import QRCode from 'qrcode';
import { promisify } from 'node:util';
import { BaileysEventMap, DisconnectReason } from '@whiskeysockets/baileys';
import { UseFilters, UseGuards } from '@nestjs/common';
import { WsAuthGuard } from '@/guards/ws-auth.guard';

const qrCodeToUri = promisify(QRCode.toDataURL);

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class WhatsappGateway {
  @WebSocketServer()
  private server: Server;

  private _qrRetry: number = 0;
  private _lastQr: string | undefined = undefined;

  constructor(private readonly service: WhatsappService) {
    service.addHandler((sock, e) => this._handler(sock, e));
  }

  @UseGuards(WsAuthGuard)
  @UseFilters(new BaseWsExceptionFilter())
  @SubscribeMessage('events')
  async handleEvents(@MessageBody() data: { action: string }) {
    if (!data?.action?.length) {
      return;
    }

    const { action } = data;

    switch (action) {
      case 'register':
        await this._handleRegister();
        break;
      case 'login':
        await this._handleLogin();
        break;
      case 'logout':
        await this._handleLogout();
        break;
      default:
        return;
    }
  }

  private async _handleLogin() {
    this._qrRetry = 0;
    await this.service.connect();
  }

  private async _handleLogout() {
    await this.service.connect();
    await this.service.getSocket().logout();
  }

  private async _handleRegister() {
    if (this._lastQr) {
      this.server.emit('events', {
        status: 'unauthenticated',
        qr: this.service.getSocket() ? this._lastQr : 'timeout',
      });
      return;
    }

    this._qrRetry = 0;

    const sock = this.service.getSocket();

    if (sock) {
      const jid = sock.user?.id ?? '6282325441718@s.whatsapp.net';
      const avatar = await sock
        .profilePictureUrl(jid, 'image', 3_000)
        .catch(() => null);

      if (avatar) {
        Object.assign(sock.user!, { imgUrl: avatar });
      }

      if (sock.user?.id) {
        this.server.emit('events', {
          status: 'authenticated',
          user: sock.user,
        });
        return;
      }
    }

    await this.service.connect();
  }

  private async _handler(sock: WASocket, e: Partial<BaileysEventMap>) {
    const event = 'events';

    if (e['connection.update']) {
      const { connection, qr, lastDisconnect } = e['connection.update'];

      if (connection === 'open') {
        this._qrRetry = 0;
        this._lastQr = undefined;

        if (!sock.user?.imgUrl) {
          const jid = sock.user?.id;
          const avatar = await sock
            .profilePictureUrl(jid!, 'image', 3_000)
            .catch(() => null);

          if (avatar) {
            Object.assign(sock.user!, { imgUrl: avatar });
          }
        }

        this.server.emit(event, {
          status: 'authenticated',
          user: sock.user,
        });
      } else if (connection === 'connecting') {
        this._lastQr = undefined;
        this.server.emit(event, { status: 'connecting' });
      } else if (connection === 'close') {
        this._lastQr = undefined;
        const isLoggedOut =
          (lastDisconnect?.error as any)?.output?.statusCode ===
          DisconnectReason.loggedOut;
        if (isLoggedOut) {
          this.server.emit(event, {
            status: 'unauthenticated',
            qr: 'timeout',
          });
        }
      }

      if (qr) {
        if (this._qrRetry >= 3) {
          sock.logger.info('qr code timeout');
          await this.service.close();
          this.server.emit(event, {
            status: 'unauthenticated',
            qr: 'timeout',
          });
          return;
        }

        sock.logger.info('generating qr code...');

        const qrURI = await qrCodeToUri(qr);
        this._qrRetry += 1;

        this._lastQr = qrURI as string;
        this.server.emit(event, {
          status: 'unauthenticated',
          qr: qrURI,
        });
      }
    }
  }
}
