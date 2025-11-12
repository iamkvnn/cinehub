import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common';
import { UserService } from '../service/user.service';
import { createApiResponse, createPaginatedApiResponse } from 'src/common/utils';
import { ApiBody, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { CreateUserDto, UpdateUserDto, UserDto } from '../dto/user.dto';
import { createApiResponseDto, createPaginatedApiResponseDto, PaginatedApiQuery } from 'src/common/dto';
import { plainToInstance } from 'class-transformer';

@Controller({
  path: 'users',
  version: '1',
})
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách người dùng với phân trang' })
  @ApiResponse({
    status: 200,
    description: 'Lấy danh sách người dùng với phân trang',
    type: createPaginatedApiResponseDto(UserDto),
  })
  async getAllUsers(@Query() query: PaginatedApiQuery) {
    const [users, count] = await this.userService.findAll(query);
    return createPaginatedApiResponse(
      plainToInstance(UserDto, users, { excludeExtraneousValues: true }),
      count,
      query.page,
      query.limit,
    );
  }

  @ApiOperation({ summary: 'Lấy thông tin người dùng theo ID' })
  @ApiResponse({
    status: 200,
    description: 'Lấy thông tin người dùng theo ID',
    type: createApiResponseDto(UserDto),
  })
  @ApiParam({ name: 'id', description: 'User ID' })
  @Get(':id')
  async getUserById(@Param('id') id: string) {
    const user = await this.userService.findById(id);
    return createApiResponse(
      plainToInstance(UserDto, user, { excludeExtraneousValues: true } ),
    );
  }

  // @Post()
  // @ApiResponse({
  //   status: 201, 
  //   description: 'Create a new user',
  //   type: createApiResponseDto(UserDto),
  // })
  // async createUser(@Body() createDto: CreateUserDto) {
  //   const user = await this.userService.createUser(createDto);
  //   return createApiResponse(
  //     plainToInstance(UserDto, user),
  //   );
  // }

  @Put(':id')
  @ApiOperation({ summary: 'Cập nhật thông tin người dùng' })
  @ApiResponse({
    status: 200,
    description: 'Cập nhật thông tin người dùng',
    type: createApiResponseDto(UserDto),
  })
  async updateUser(@Param('id') id: string, @Body() updateDto: UpdateUserDto) {
    const user = await this.userService.updateUser(id, updateDto);
    return createApiResponse(
      plainToInstance(UserDto, user, { excludeExtraneousValues: true }),
    );
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xóa người dùng' })
  @ApiResponse({
    status: 200,
    description: 'Xóa người dùng',
  })
  async deleteUser(@Param('id') id: string) {
    await this.userService.deleteUser(id);
  }
}
