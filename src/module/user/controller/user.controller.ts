import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { UserService } from '../service/user.service';
import {
  createApiResponse,
  createPaginatedApiResponse,
} from 'src/common/utils';
import { ApiBody, ApiConsumes, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { CreateUserDto, UpdateUserDto, UserDto } from '../dto/user.dto';
import {
  createApiResponseDto,
  createPaginatedApiResponseDto,
  PaginatedApiQuery,
} from 'src/common/dto';
import { plainToInstance } from 'class-transformer';
import { FileInterceptor } from '@nestjs/platform-express';

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
    const [users, count] = await this.userService.findAllUser(query);
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
      plainToInstance(UserDto, user, { excludeExtraneousValues: true }),
    );
  }

  @Put(':id')
  @ApiOperation({ summary: 'Cập nhật thông tin người dùng' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        avatar: {
          type: 'string',
          format: 'binary',
        },
        name: { type: 'string' },
        gender: { type: 'string', enum: ['male', 'female'] },
      },
    },
  })
  @UseInterceptors(FileInterceptor('avatar'))
  @ApiConsumes('multipart/form-data')
  @ApiResponse({
    status: 200,
    description: 'Cập nhật thông tin người dùng',
    type: createApiResponseDto(UserDto),
  })
  async updateUser(
    @Param('id') id: string,
    @Body() updateDto: UpdateUserDto,
    @UploadedFile() avatar: Express.Multer.File,
  ) {
    const user = await this.userService.updateUser(id, updateDto, avatar);
    return createApiResponse(
      plainToInstance(UserDto, user, { excludeExtraneousValues: true }),
    );
  }

  @Put(':id/ban')
  @ApiOperation({ summary: 'Khóa người dùng' })
  @ApiResponse({
    status: 200,
    description: 'Khóa người dùng',
  })
  async banUser(@Param('id') id: string) {
    await this.userService.updateUser(id, { isActive: false });
  }

  @Put(':id/unban')
  @ApiOperation({ summary: 'Mở khóa người dùng' })
  @ApiResponse({
    status: 200,
    description: 'Mở khóa người dùng',
  })
  async unbanUser(@Param('id') id: string) {
    await this.userService.updateUser(id, { isActive: true });
  }
}
