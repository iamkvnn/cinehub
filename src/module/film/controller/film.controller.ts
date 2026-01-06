import {
  Controller,
  Get,
  Param,
  Post,
  Body,
  Query,
  Put,
  Delete,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
  ApiBody,
  ApiQuery,
} from '@nestjs/swagger';
import { FilmService } from '../service/film.service';
import {
  createApiResponse,
  createPaginatedApiResponse,
} from 'src/common/utils';
import { plainToInstance } from 'class-transformer';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  createApiResponseDto,
  createPaginatedApiResponseDto,
} from 'src/common/dto';
import { CreateFilmDto, FilmDto, UpdateFilmDto } from '../dto/film.dto';
import { FilmQueryDto } from '../dto/film-query.dto';

@ApiTags('Film')
@Controller('films')
export class FilmController {
  constructor(private service: FilmService) {}

  @Post()
  @ApiOperation({ summary: 'Tạo một film mới' })
  @ApiResponse({
    status: 201,
    description: 'Film được tạo thành công',
    type: createApiResponseDto(FilmDto),
  })
  @ApiBody({ type: CreateFilmDto })
  async create(@Body() dto: CreateFilmDto) {
    return createApiResponse(
      plainToInstance(FilmDto, await this.service.create(dto), {
        excludeExtraneousValues: true,
      }),
    );
  }

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách film' })
  @ApiResponse({
    status: 200,
    description: 'Danh sách film',
    type: createPaginatedApiResponseDto(FilmDto),
  })
  async getByReleaseDate(@Query() query: FilmQueryDto) {
    const [films, count] = await this.service.find(query);
    return createPaginatedApiResponse(
      plainToInstance(FilmDto, films, {
        excludeExtraneousValues: true,
      }),
      count,
      query.page,
      query.limit,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy chi tiết một film theo id' })
  @ApiResponse({
    status: 200,
    description: 'Chi tiết film',
    type: createApiResponseDto(FilmDto),
  })
  @ApiResponse({ status: 404, description: 'Film không tồn tại' })
  async getOne(@Param('id') id: string) {
    return createApiResponse(
      plainToInstance(FilmDto, await this.service.findOne(id), {
        excludeExtraneousValues: true,
      }),
    );
  }

  @Put(':id')
  @ApiOperation({ summary: 'Cập nhật thông tin film' })
  @ApiResponse({
    status: 200,
    description: 'Film đã được cập nhật',
    type: createApiResponseDto(FilmDto),
  })
  @ApiBody({ type: UpdateFilmDto })
  @ApiResponse({ status: 404, description: 'Film không tồn tại' })
  async update(@Param('id') id: string, @Body() dto: UpdateFilmDto) {
    return createApiResponse(
      plainToInstance(FilmDto, await this.service.update(id, dto), {
        excludeExtraneousValues: true,
      }),
    );
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xoá một film theo id' })
  @ApiResponse({
    status: 200,
    description: 'Xoá thành công',
  })
  @ApiResponse({ status: 404, description: 'Film không tồn tại' })
  async remove(@Param('id') id: string) {
    await this.service.remove(id);
  }

  @Post(':id/video')
  @ApiOperation({ summary: 'Upload video cho film' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
      required: ['file'],
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  @ApiResponse({
    status: 200,
    description: 'Video được upload thành công',
  })
  @ApiQuery({ name: 'season', required: false, type: Number })
  @ApiQuery({ name: 'episode', required: false, type: Number })
  async uploadVideo(
    @Param('id') filmId: string,
    @UploadedFile() file: Express.Multer.File,
    @Query('season') season?: number,
    @Query('episode') episode?: number,
  ) {
    await this.service.uploadVideo(filmId, file, season, episode);
  }

  @Delete(':id/video')
  @ApiOperation({ summary: 'Xoá video của film' })
  @ApiResponse({
    status: 200,
    description: 'Video được xoá thành công',
  })
  @ApiQuery({ name: 'season', required: false, type: Number })
  @ApiQuery({ name: 'episode', required: false, type: Number })
  async deleteVideo(
    @Param('id') filmId: string,
    @Query('season') season?: number,
    @Query('episode') episode?: number,
  ) {
    await this.service.deleteVideo(filmId, season, episode);
  }
}
