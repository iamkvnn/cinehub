import {
  Controller,
  Get,
  Param,
  Post,
  Body,
  Query,
  Put,
  Delete,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { FilmService } from '../service/film.service';
import { CreateFilmDto } from '../dto/request/create-film.dto';
import { UpdateFilmDto } from '../dto/request/update-film.dto';
import { Film } from '../entity/film.entity';
import { PaginatedApiQuery } from 'src/common/dto/paginated-query.dto';
import { FilmResponseDto } from '../dto/response/film.dto';
import { createPaginatedApiResponse } from 'src/common/utils';
import { plainToInstance } from 'class-transformer';

@ApiTags('films')
@Controller('films')
export class FilmController {
  constructor(private service: FilmService) {}

  // -----------------------
  // Create Film
  // -----------------------
  @Post()
  @ApiOperation({ summary: 'Tạo một film mới' })
  @ApiBody({ type: CreateFilmDto })
  @ApiResponse({
    status: 201,
    description: 'Film được tạo thành công',
    type: Film,
  })
  async create(@Body() dto: CreateFilmDto): Promise<FilmResponseDto> {
    return await this.service.create(dto);
  }
  // -----------------------
  // Most viewed
  // -----------------------
  @Get('most-viewed')
  @ApiOperation({ summary: 'Lấy danh sách film xem nhiều nhất' })
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
    type: Film,
  })
  @ApiResponse({ status: 404, description: 'Film không tồn tại' })
  async getOne(@Param('id') id: string): Promise<FilmResponseDto> {
    return await this.service.findOne(id);
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
  @ApiBody({ type: UpdateFilmDto })
  @ApiResponse({
    status: 200,
    description: 'Film đã được cập nhật',
    type: Film,
  })
  update(@Param('id') id: string, @Body() dto: UpdateFilmDto) {
    return this.service.update(id, dto);
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
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
