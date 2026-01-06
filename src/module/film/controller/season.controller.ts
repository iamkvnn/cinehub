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
import { SeasonDto, CreateSeasonDto, UpdateSeasonDto } from '../dto/season.dto';
import {
  createApiResponse,
  createPaginatedApiResponse,
} from 'src/common/utils';
import { plainToInstance } from 'class-transformer';
import { SeasonService } from '../service/season.service';

@Controller('films/:filmId/seasons')
@ApiTags('Seasons')
export class SeasonController {
  constructor(private readonly seasonService: SeasonService) {}

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách mùa phim' })
  @ApiResponse({
    status: 200,
    description: 'Lấy danh sách mùa phim',
    type: createPaginatedApiResponseDto(SeasonDto),
  })
  async getAll(
    @Query() query: PaginatedApiQuery,
    @Param('filmId') filmId: string,
  ) {
    const [data, count] = await this.seasonService.find(filmId, query);
    return createPaginatedApiResponse(
      plainToInstance(SeasonDto, data, { excludeExtraneousValues: true }),
      count,
      query.page,
      query.limit,
    );
  }

  @ApiOperation({ summary: 'Lấy thông tin mùa phim theo số mùa' })
  @ApiResponse({
    status: 200,
    description: 'Lấy thông tin mùa phim theo số mùa',
    type: createApiResponseDto(SeasonDto),
  })
  @ApiParam({ name: 'season', description: 'Season number' })
  @Get('/:season')
  async getSeasonById(
    @Param('season') season: number,
    @Param('filmId') filmId: string,
  ) {
    const data = await this.seasonService.findOne(filmId, season);
    return createApiResponse(
      plainToInstance(SeasonDto, data, { excludeExtraneousValues: true }),
    );
  }

  @Post()
  @ApiResponse({
    status: 201,
    description: 'Tạo mùa phim mới',
    type: createApiResponseDto(SeasonDto),
  })
  async createSeason(
    @Body() createDto: CreateSeasonDto,
    @Param('filmId') filmId: string,
  ) {
    const data = await this.seasonService.create(filmId, createDto);
    return createApiResponse(
      plainToInstance(SeasonDto, data, { excludeExtraneousValues: true }),
    );
  }

  @Put(':season')
  @ApiOperation({ summary: 'Cập nhật thông tin mùa phim' })
  @ApiResponse({
    status: 200,
    description: 'Cập nhật thông tin mùa phim',
    type: createApiResponseDto(SeasonDto),
  })
  async updateSeason(
    @Param('filmId') filmId: string,
    @Param('season') season: number,
    @Body() updateDto: UpdateSeasonDto,
  ) {
    const data = await this.seasonService.update(filmId, season, updateDto);
    return createApiResponse(
      plainToInstance(SeasonDto, data, { excludeExtraneousValues: true }),
    );
  }

  @Delete(':season')
  @ApiOperation({ summary: 'Xóa mùa phim' })
  @ApiResponse({
    status: 200,
    description: 'Xóa mùa phim',
  })
  async deleteSeason(
    @Param('filmId') filmId: string,
    @Param('season') season: number,
  ) {
    await this.seasonService.delete(filmId, season);
  }
}
