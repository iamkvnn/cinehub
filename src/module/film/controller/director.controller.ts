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
import { ApiOperation, ApiParam, ApiResponse, ApiTags, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  createApiResponseDto,
  createPaginatedApiResponseDto,
  PaginatedApiQuery,
} from 'src/common/dto';
import {
  DirectorDto,
  CreateDirectorDto,
  UpdateDirectorDto,
} from '../dto/director.dto';
import {
  createApiResponse,
  createPaginatedApiResponse,
} from 'src/common/utils';
import { plainToInstance } from 'class-transformer';
import { DirectorService } from '../service/director.service';
import { Gender } from 'src/module/user/const/user.const';

@Controller('directors')
@ApiTags('Directors')
export class DirectorController {
  constructor(private readonly directorService: DirectorService) {}

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách đạo diễn' })
  @ApiResponse({
    status: 200,
    description: 'Lấy danh sách đạo diễn',
    type: createPaginatedApiResponseDto(DirectorDto),
  })
  async getAll(@Query() query: PaginatedApiQuery) {
    const [data, count] = await this.directorService.find(query);
    return createPaginatedApiResponse(
      plainToInstance(DirectorDto, data, { excludeExtraneousValues: true }),
      count,
      query.page,
      query.limit,
    );
  }

  @ApiOperation({ summary: 'Lấy thông tin đạo diễn theo ID' })
  @ApiResponse({
    status: 200,
    description: 'Lấy thông tin đạo diễn theo ID',
    type: createApiResponseDto(DirectorDto),
  })
  @ApiParam({ name: 'id', description: 'Director ID' })
  @Get(':id')
  async getDirectorById(@Param('id') id: string) {
    const Director = await this.directorService.findOne(id);
    return createApiResponse(
      plainToInstance(DirectorDto, Director, { excludeExtraneousValues: true }),
    );
  }

  @Post()
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        photo: {
          type: 'string',
          format: 'binary',
        },
        name: { type: 'string' },
        birthDate: { type: 'string', format: 'date' },
        bio: { type: 'string' },
        gender: { type: 'string', enum: Object.values(Gender) },
        nationality: { type: 'string' },
      },
      required: ['name']
    },
  })
  @ApiOperation({ summary: 'Tạo đạo diễn mới' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('photo'))
  @ApiResponse({
    status: 201,
    description: 'Tạo đạo diễn mới',
    type: createApiResponseDto(DirectorDto),
  })
  async createDirector(
    @Body() createDto: CreateDirectorDto,
    @UploadedFile() photo: Express.Multer.File,
  ) {
    const data = await this.directorService.create(createDto, photo);
    return createApiResponse(
      plainToInstance(DirectorDto, data, { excludeExtraneousValues: true }),
    );
  }

  @Put(':id')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        photo: {
          type: 'string',
          format: 'binary',
        },
        name: { type: 'string' },
        birthDate: { type: 'string', format: 'date' },
        bio: { type: 'string' },
        gender: { type: 'string', enum: Object.values(Gender) },
        nationality: { type: 'string' },
      },
      required: ['name']
    },
  })
  @ApiOperation({ summary: 'Cập nhật thông tin đạo diễn' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('photo'))
  @ApiResponse({
    status: 200,
    description: 'Cập nhật thông tin đạo diễn',
    type: createApiResponseDto(DirectorDto),
  })
  async updateDirector(
    @Param('id') id: string,
    @Body() updateDto: UpdateDirectorDto,
    @UploadedFile() photo: Express.Multer.File,
  ) {
    const data = await this.directorService.update(id, updateDto, photo);
    return createApiResponse(
      plainToInstance(DirectorDto, data, { excludeExtraneousValues: true }),
    );
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xóa đạo diễn' })
  @ApiResponse({
    status: 200,
    description: 'Xóa đạo diễn',
  })
  async deleteDirector(@Param('id') id: string) {
    await this.directorService.delete(id);
  }
}
