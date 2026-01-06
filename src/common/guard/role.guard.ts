import { CanActivate, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { ROLE_KEY } from "../decorator/has-role.decorator";
import { UserService } from "src/module/user/service/user.service";
import { UserRole } from "src/module/user/const/user.const";

@Injectable()
export class RoleGuard implements CanActivate {
    constructor(
        private readonly reflector: Reflector,
        private readonly userService: UserService,
    ) {}

    async canActivate(context): Promise<boolean> {
        const request = context.switchToHttp().getRequest();

        const role = this.reflector.getAllAndOverride<UserRole>(ROLE_KEY, [
          context.getHandler(),
          context.getClass(),
        ]);
        const user = await this.userService.findById(request.user.id);
        return user.role === role;
    }
}