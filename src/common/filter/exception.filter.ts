import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ERROR_CODE } from '../const/const';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Unknown error occurred';
    let errors: any = null;
    let code: ERROR_CODE | null = null;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();

      if (typeof res === 'string') {
        message = res;
      } else if (typeof res === 'object') {
        const obj = res as Record<string, any>;
        message = obj.message || message;
        errors = obj.errors ?? null;
        code = obj.code ?? null;
      }
    }

    this.logger.error(
      `${request.method} ${request.url} → ${status} | ${message}`,
      status === HttpStatus.INTERNAL_SERVER_ERROR
        ? (exception as Error).stack
        : '',
    );

    response.status(status).json({
      success: false,
      message,
      errors: errors ?? undefined,
      code: code ?? undefined,
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }
}
