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
  ApiParam,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { FilmService } from '../service/film.service';
import { CreateFilmDto } from '../dto/request/create-film.dto';
import { UpdateFilmDto } from '../dto/request/update-film.dto';
import { PaginatedApiQuery } from 'src/common/dto/paginated-query.dto';
import { FilmResponseDto } from '../dto/response/film.dto';
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
import { PaginatedFilmByReleaseQuery } from '../dto/request/paginated-film-query.dto';

@ApiTags('Film')
@Controller('films')
export class FilmController {
  constructor(private service: FilmService) {}

  // -----------------------
  // Create Film
  // -----------------------
  @Post()
  @ApiOperation({ summary: 'Tạo một film mới' })
  @ApiResponse({
    status: 201,
    description: 'Film được tạo thành công',
    type: createApiResponseDto(FilmResponseDto),
  })
  async create(@Body() dto: CreateFilmDto) {
    return createApiResponse(
      plainToInstance(FilmResponseDto, await this.service.create(dto), {
        excludeExtraneousValues: true,
      }),
    );
  }

  // -----------------------
  // Most viewed
  // -----------------------
  @Get('most-viewed')
  @ApiOperation({ summary: 'Lấy danh sách film xem nhiều nhất' })
  @ApiResponse({
    status: 200,
    description: 'Danh sách film xem nhiều nhất',
    type: createPaginatedApiResponseDto(FilmResponseDto),
  })
  async getMostViewed(@Query() query: PaginatedApiQuery) {
    const [films, count] = await this.service.findMostViewed(query);
    return createPaginatedApiResponse(
      plainToInstance(FilmResponseDto, films, {
        excludeExtraneousValues: true,
      }),
      count,
      query.page,
      query.limit,
    );
  }

  // -----------------------
  // Query by released day
  // -----------------------
  @Get('by-release')
  @ApiOperation({ summary: 'Lấy danh sách film theo ngày phát hành mới nhất' })
  @ApiResponse({
    status: 200,
    description: 'Danh sách phim theo ngày phát hành',
    type: createPaginatedApiResponseDto(FilmResponseDto),
  })
  async getByReleaseDate(@Query() query: PaginatedFilmByReleaseQuery) {
    const [films, count] = await this.service.findByReleaseDate(query);
    return createPaginatedApiResponse(
      plainToInstance(FilmResponseDto, films, {
        excludeExtraneousValues: true,
      }),
      count,
      query.page,
      query.limit,
    );
  }
  // -----------------------
  // Get film detail
  // -----------------------
  @Get(':id')
  @ApiOperation({ summary: 'Lấy chi tiết một film theo id' })
  @ApiParam({
    name: 'id',
    description: 'ID film (UUID)',
    example: '0bfa9b02-764a-4c1b-a2f7-1e98fa4b57ac',
  })
  @ApiResponse({
    status: 200,
    description: 'Chi tiết film',
    type: createApiResponseDto(FilmResponseDto),
  })
  @ApiResponse({ status: 404, description: 'Film không tồn tại' })
  async getOne(@Param('id') id: string) {
    return createApiResponse(
      plainToInstance(FilmResponseDto, await this.service.findOne(id), {
        excludeExtraneousValues: true,
      }),
    );
  }

  // -----------------------
  // Update
  // -----------------------
  @Put(':id')
  @ApiOperation({ summary: 'Cập nhật thông tin film' })
  @ApiParam({
    name: 'id',
    description: 'ID film',
  })
  @ApiResponse({
    status: 200,
    description: 'Film đã được cập nhật',
    type: createApiResponseDto(FilmResponseDto),
  })
  async update(@Param('id') id: string, @Body() dto: UpdateFilmDto) {
    return createApiResponse(
      plainToInstance(FilmResponseDto, await this.service.update(id, dto), {
        excludeExtraneousValues: true,
      }),
    );
  }

  // -----------------------
  // Delete
  // -----------------------
  @Delete(':id')
  @ApiOperation({ summary: 'Xoá một film theo id' })
  @ApiParam({
    name: 'id',
    description: 'ID film',
  })
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
  async uploadVideo(
    @Param('id') filmId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    await this.service.uploadVideo(filmId, file);
  }

  @Delete(':id/video')
  @ApiOperation({ summary: 'Xoá video của film' })
  @ApiResponse({
    status: 200,
    description: 'Video được xoá thành công',
  })
  async deleteVideo(@Param('id') filmId: string) {
    await this.service.deleteVideo(filmId);
  }
}
