import { SetMetadata } from "@nestjs/common";
import { UserRole } from "src/module/user/const/user.const";

export const ROLE_KEY = 'role';
export const HasRole = (role: UserRole) => SetMetadata(ROLE_KEY, role);