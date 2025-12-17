import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ActorService } from '../service/actor.service';
import {
  createApiResponseDto,
  createPaginatedApiResponseDto,
  PaginatedApiQuery,
} from 'src/common/dto';
import { ActorDto, CreateActorDto, UpdateActorDto } from '../dto/actor.dto';
import {
  createApiResponse,
  createPaginatedApiResponse,
} from 'src/common/utils';
import { plainToInstance } from 'class-transformer';
import { RoleGuard } from 'src/common/guard';
import { HasRole } from 'src/common/decorator';
import { UserRole } from 'src/module/user/const/user.const';

@Controller('actors')
@ApiTags('Actors')
export class ActorController {
  constructor(private readonly actorService: ActorService) {}

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách diễn viên' })
  @ApiResponse({
    status: 200,
    description: 'Lấy danh sách diễn viên',
    type: createPaginatedApiResponseDto(ActorDto),
  })
  async getAll(@Query() query: PaginatedApiQuery) {
    const [data, count] = await this.actorService.find(query);
    return createPaginatedApiResponse(
      plainToInstance(ActorDto, data, { excludeExtraneousValues: true }),
      count,
      query.page,
      query.limit,
    );
  }

  @ApiOperation({ summary: 'Lấy thông tin diễn viên theo ID' })
  @ApiResponse({
    status: 200,
    description: 'Lấy thông tin diễn viên theo ID',
    type: createApiResponseDto(ActorDto),
  })
  @ApiParam({ name: 'id', description: 'Actor ID' })
  @Get(':id')
  async getActorById(@Param('id') id: string) {
    const data = await this.actorService.findOne(id);
    return createApiResponse(
      plainToInstance(ActorDto, data, { excludeExtraneousValues: true }),
    );
  }

  @Post()
  @ApiResponse({
    status: 201,
    description: 'Tạo diễn viên mới',
    type: createApiResponseDto(ActorDto),
  })
  // @UseGuards(RoleGuard)
  // @HasRole(UserRole.ADMIN)
  async createActor(@Body() createDto: CreateActorDto) {
    const data = await this.actorService.create(createDto);
    return createApiResponse(
      plainToInstance(ActorDto, data, { excludeExtraneousValues: true }),
    );
  }

  @Put(':id')
  @ApiOperation({ summary: 'Cập nhật thông tin diễn viên' })
  @ApiResponse({
    status: 200,
    description: 'Cập nhật thông tin diễn viên',
    type: createApiResponseDto(ActorDto),
  })
  // @UseGuards(RoleGuard)
  // @HasRole(UserRole.ADMIN)
  async updateActor(
    @Param('id') id: string,
    @Body() updateDto: UpdateActorDto,
  ) {
    const data = await this.actorService.update(id, updateDto);
    return createApiResponse(
      plainToInstance(ActorDto, data, { excludeExtraneousValues: true }),
    );
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xóa diễn viên' })
  @ApiResponse({
    status: 200,
    description: 'Xóa diễn viên',
  })
  // @UseGuards(RoleGuard)
  // @HasRole(UserRole.ADMIN)
  async deleteActor(@Param('id') id: string) {
    await this.actorService.delete(id);
  }
}
