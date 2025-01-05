import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WsException } from '@nestjs/websockets';
import { Observable } from 'rxjs';
import type { Socket } from 'socket.io';

@Injectable()
export class WsAuthGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const unAuthorized = new WsException('unauthorized');

    try {
      const socket: Socket = context.switchToWs().getClient();

      const token = socket.handshake?.headers?.authorization;

      if (!token) {
        throw unAuthorized;
      }

      if (!token.includes('Basic')) {
        throw unAuthorized;
      }

      const parts = token.split('Basic');
      if (parts.length < 2) {
        throw unAuthorized;
      }

      const expectedUsername = this.config.get('AUTH_USERNAME');
      const expectedPassword = this.config.get('AUTH_PASSWORD');
      const expectedToken = Buffer.from(
        `${expectedUsername}:${expectedPassword}`,
      ).toString('base64');

      if (expectedToken != parts[1].trim()) {
        throw unAuthorized;
      }

      return true;
    } catch (error: any) {
      console.error(error);
      throw unAuthorized;
    }
  }
}
