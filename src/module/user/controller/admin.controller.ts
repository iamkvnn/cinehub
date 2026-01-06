import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { UserService } from '../service/user.service';
import {
  createApiResponse,
  createPaginatedApiResponse,
} from 'src/common/utils';
import { ApiBody, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { CreateUserDto, UpdateUserDto, UserDto } from '../dto/user.dto';
import {
  createApiResponseDto,
  createPaginatedApiResponseDto,
  PaginatedApiQuery,
} from 'src/common/dto';
import { plainToInstance } from 'class-transformer';

@Controller({
  path: 'admins',
  version: '1',
})
export class AdminController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách admin với phân trang' })
  @ApiResponse({
    status: 200,
    description: 'Lấy danh sách admin với phân trang',
    type: createPaginatedApiResponseDto(UserDto),
  })
  async getAllAdmins(@Query() query: PaginatedApiQuery) {
    const [users, count] = await this.userService.findAllAdmin(query);
    return createPaginatedApiResponse(
      plainToInstance(UserDto, users, { excludeExtraneousValues: true }),
      count,
      query.page,
      query.limit,
    );
  }

  @ApiOperation({ summary: 'Lấy thông tin admin theo ID' })
  @ApiResponse({
    status: 200,
    description: 'Lấy thông tin admin theo ID',
    type: createApiResponseDto(UserDto),
  })
  @ApiParam({ name: 'id', description: 'Admin ID' })
  @Get(':id')
  async getAdminById(@Param('id') id: string) {
    const user = await this.userService.findById(id);
    return createApiResponse(
      plainToInstance(UserDto, user, { excludeExtraneousValues: true }),
    );
  }

  @ApiOperation({ summary: 'Tạo admin mới' })
  @ApiBody({ type: CreateUserDto })
  @ApiResponse({
    status: 201,
    description: 'Tạo admin mới',
    type: createApiResponseDto(UserDto),
    })
  @Post()
  async createAdmin(@Body() createDto: CreateUserDto) {
    const user = await this.userService.createAdmin(createDto);
    return createApiResponse(
      plainToInstance(UserDto, user, { excludeExtraneousValues: true }),
    );
  }

  @Put(':id')
  @ApiOperation({ summary: 'Cập nhật thông tin admin' })
  @ApiResponse({
    status: 200,
    description: 'Cập nhật thông tin admin',
    type: createApiResponseDto(UserDto),
  })
  async updateAdmin(@Param('id') id: string, @Body() updateDto: UpdateUserDto) {
    const user = await this.userService.updateUser(id, updateDto);
    return createApiResponse(
      plainToInstance(UserDto, user, { excludeExtraneousValues: true }),
    );
  }

  @Put(':id/ban')
  @ApiOperation({ summary: 'Khóa admin' })
  @ApiResponse({
    status: 200,
    description: 'Khóa admin',
  })
  async banAdmin(@Param('id') id: string) {
    await this.userService.updateUser(id, { isActive: false });
  }

  @Put(':id/unban')
  @ApiOperation({ summary: 'Mở khóa admin' })
  @ApiResponse({
    status: 200,
    description: 'Mở khóa admin',
  })
  async unbanAdmin(@Param('id') id: string) {
    await this.userService.updateUser(id, { isActive: true });
  }
}
