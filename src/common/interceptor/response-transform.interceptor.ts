import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { Request } from 'express';
import { ApiResponse, PaginatedApiResponse } from '../dto';

@Injectable()
export class ResponseTransformInterceptor<T> implements NestInterceptor<T, any>{
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<Request>();

    if (request.url.includes('/health')) {
      return next.handle();
    }

    return next.handle().pipe(
      map((data) => (data instanceof ApiResponse || data instanceof PaginatedApiResponse ? {
        success: true,
        ...data,
        path: request.url,
        timestamp: new Date().toISOString(),
      } : {
        success: true,
        data: data,
        path: request.url,
        timestamp: new Date().toISOString(),
      })),
    );
  }
}
