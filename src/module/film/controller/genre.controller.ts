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
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
  createApiResponseDto,
  createPaginatedApiResponseDto,
  PaginatedApiQuery,
} from 'src/common/dto';
import {
  GenreDto,
  CreateGenreDto,
  UpdateGenreDto,
} from '../dto/genre.dto';
import {
  createApiResponse,
  createPaginatedApiResponse,
} from 'src/common/utils';
import { plainToInstance } from 'class-transformer';
import { GenreService } from '../service/genre.service';

@Controller('genres')
@ApiTags('Genres')
export class GenreController {
  constructor(private readonly genreService: GenreService) {}

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách thể loại' })
  @ApiResponse({
    status: 200,
    description: 'Lấy danh sách thể loại',
    type: createPaginatedApiResponseDto(GenreDto),
  })
  async getAll(@Query() query: PaginatedApiQuery) {
    const [data, count] = await this.genreService.find(query);
    return createPaginatedApiResponse(
      plainToInstance(GenreDto, data, { excludeExtraneousValues: true }),
      count,
      query.page,
      query.limit,
    );
  }

  @ApiOperation({ summary: 'Lấy thông tin thể loại theo ID' })
  @ApiResponse({
    status: 200,
    description: 'Lấy thông tin thể loại theo ID',
    type: createApiResponseDto(GenreDto),
  })
  @ApiParam({ name: 'id', description: 'Genre ID' })
  @Get(':id')
  async getGenreById(@Param('id') id: string) {
    const genre = await this.genreService.findOne(id);
    return createApiResponse(
      plainToInstance(GenreDto, genre, { excludeExtraneousValues: true }),
    );
  }

  @Post()
  @ApiResponse({
    status: 201,
    description: 'Tạo thể loại mới',
    type: createApiResponseDto(GenreDto),
  })
  async createGenre(@Body() createDto: CreateGenreDto) {
    const data = await this.genreService.create(createDto);
    return createApiResponse(
      plainToInstance(GenreDto, data, { excludeExtraneousValues: true }),
    );
  }

  @Put(':id')
  @ApiOperation({ summary: 'Cập nhật thông tin thể loại' })
  @ApiResponse({
    status: 200,
    description: 'Cập nhật thông tin thể loại',
    type: createApiResponseDto(GenreDto),
  })
  async updateGenre(
    @Param('id') id: string,
    @Body() updateDto: UpdateGenreDto,
  ) {
    const data = await this.genreService.update(id, updateDto);
    return createApiResponse(
      plainToInstance(GenreDto, data, { excludeExtraneousValues: true }),
    );
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xóa thể loại' })
  @ApiResponse({
    status: 200,
    description: 'Xóa thể loại',
  })
  async deleteGenre(@Param('id') id: string) {
    await this.genreService.delete(id);
  }
}
