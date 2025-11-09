import { Controller, Get, Param } from '@nestjs/common';
import { UserService } from '../service/user.service';
import { createApiResponse } from 'src/common/utils';

@Controller({
  path: 'users',
  version: '1',
})
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  async getAllUsers() {
    const users = await this.userService.findAll();
    return createApiResponse(users);
  }

  @Get(':id')
  async getUserById(@Param('id') id: string) {
    const user = await this.userService.findById(id);
    return createApiResponse(user);
  }
}
