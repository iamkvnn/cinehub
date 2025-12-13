import { ConflictException } from '@nestjs/common';
import { ERROR_MESSAGES } from '../const/const';

export function handleDbExceptions(error: any): never {
  if (error?.code === 'ER_DUP_ENTRY' || error?.errno === 1062) {
    throw new ConflictException(ERROR_MESSAGES.EXISTS);
  }
  throw error;
}
