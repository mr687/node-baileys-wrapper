import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { FastifyReply, FastifyRequest } from 'fastify';

@Injectable()
export class BasicAuthGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const unAuthorized = new UnauthorizedException();

    try {
      const req = context.switchToHttp().getRequest<FastifyRequest>();

      const token = req.headers?.authorization;

      if (!token) {
        const res = context.switchToHttp().getResponse<FastifyReply>();
        res.header('www-authenticate', 'Basic realm=app');

        throw new UnauthorizedException();
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
