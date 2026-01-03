import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';
import { UserService } from 'src/module/user/service/user.service';
import { UserRole } from 'src/module/user/const/user.const';

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private readonly userService: UserService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const userId =
      request.user?.userId || request.user?.sub || request.user?.id;

    if (!userId) {
      throw new ForbiddenException('Không có quyền truy cập');
    }

    const user = await this.userService.findById(userId);

    if (user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Chỉ Admin mới có quyền truy cập');
    }

    return true;
  }
}
