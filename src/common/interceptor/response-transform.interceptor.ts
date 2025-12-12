import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  StreamableFile,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { Request } from 'express';
import { ApiResponseDto, PaginatedApiResponseDto } from '../dto';

@Injectable()
export class ResponseTransformInterceptor<T>
  implements NestInterceptor<T, any>
{
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<Request>();

    if (request.url.includes('/health')) {
      return next.handle();
    }

    return next.handle().pipe(
      map((data) =>
        data instanceof ApiResponseDto ||
        data instanceof PaginatedApiResponseDto
          ? {
              success: true,
              ...data,
              path: request.url,
              timestamp: new Date().toISOString(),
            }
          : data instanceof StreamableFile
            ? data
            : {
                success: true,
                data,
                path: request.url,
                timestamp: new Date().toISOString(),
              },
      ),
    );
  }
}
