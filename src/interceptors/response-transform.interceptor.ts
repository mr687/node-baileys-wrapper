import {
  CallHandler,
  ExecutionContext,
  Injectable,
  StreamableFile,
  type NestInterceptor,
} from '@nestjs/common';
import type { FastifyReply } from 'fastify';
import { Observable, map } from 'rxjs';

export type Response<T = any> = {
  data: T | null;
  metadata: {
    status: boolean;
    statusCode: number;
    message: string;
  };
};

const isNil = (content: any) => {
  return content === undefined || content === null;
};

@Injectable()
export class ResponseTransformInterceptor<T = any>
  implements NestInterceptor<T, Response<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<Response<T>> | Promise<Observable<Response<T>>> {
    return next.handle().pipe(
      map((data) => {
        if (data instanceof StreamableFile) {
          return data as any;
        }
        const response = context.switchToHttp().getResponse<FastifyReply>();
        const statusCode = response.statusCode;
        const message = (data as any)?.message;
        let paginator = undefined;
        let dataResponse = data;

        if (!isNil((data as any)?.message)) {
          delete (data as any).message;
        }

        if (!isNil((data as any)?.paginator)) {
          paginator = (data as any).paginator;
          delete (data as any).paginator;
        }

        if (!isNil((data as any)?.data)) {
          dataResponse = (data as any).data;
          delete (data as any).data;
        }

        return {
          data: dataResponse,
          metadata: {
            status: statusCode >= 200 && statusCode < 300,
            statusCode: statusCode,
            message: message ?? 'success',
            paginator,
          },
        };
      }),
    );
  }
}
