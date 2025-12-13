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
  EpisodeDto,
  CreateEpisodeDto,
  UpdateEpisodeDto,
} from '../dto/episode.dto';
import {
  createApiResponse,
  createPaginatedApiResponse,
} from 'src/common/utils';
import { plainToInstance } from 'class-transformer';
import { EpisodeService } from '../service/episode.service';

@Controller('films/:filmId/seasons/:season/episodes')
@ApiTags('Episodes')
export class EpisodeController {
  constructor(private readonly episodeService: EpisodeService) {}

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách tập phim' })
  @ApiResponse({
    status: 200,
    description: 'Lấy danh sách tập phim',
    type: createPaginatedApiResponseDto(EpisodeDto),
  })
  async getAll(
    @Query() query: PaginatedApiQuery,
    @Param('filmId') filmId: string,
    @Param('season') season: number,
  ) {
    const [data, count] = await this.episodeService.find(filmId, season, query);
    return createPaginatedApiResponse(
      plainToInstance(EpisodeDto, data, { excludeExtraneousValues: true }),
      count,
      query.page,
      query.limit,
    );
  }

  @ApiOperation({ summary: 'Lấy thông tin tập phim theo số tập' })
  @ApiResponse({
    status: 200,
    description: 'Lấy thông tin tập phim theo số tập',
    type: createApiResponseDto(EpisodeDto),
  })
  @ApiParam({ name: 'number', description: 'Episode number' })
  @Get('/:number')
  async getEpisodeById(
    @Param('number') number: number,
    @Param('filmId') filmId: string,
    @Param('season') season: number,
  ) {
    const data = await this.episodeService.findOne(filmId, season, number);
    return createApiResponse(
      plainToInstance(EpisodeDto, data, { excludeExtraneousValues: true }),
    );
  }

  @Post()
  @ApiResponse({
    status: 201,
    description: 'Tạo tập phim mới',
    type: createApiResponseDto(EpisodeDto),
  })
  async createEpisode(
    @Body() createDto: CreateEpisodeDto,
    @Param('filmId') filmId: string,
    @Param('season') season: number,
  ) {
    const data = await this.episodeService.create(filmId, season, createDto);
    return createApiResponse(
      plainToInstance(EpisodeDto, data, { excludeExtraneousValues: true }),
    );
  }

  @Put(':number')
  @ApiOperation({ summary: 'Cập nhật thông tin tập phim' })
  @ApiResponse({
    status: 200,
    description: 'Cập nhật thông tin tập phim',
    type: createApiResponseDto(EpisodeDto),
  })
  async updateEpisode(
    @Param('filmId') filmId: string,
    @Param('season') season: number,
    @Param('number') number: number,
    @Body() updateDto: UpdateEpisodeDto,
  ) {
    const data = await this.episodeService.update(
      filmId,
      season,
      number,
      updateDto,
    );
    return createApiResponse(
      plainToInstance(EpisodeDto, data, { excludeExtraneousValues: true }),
    );
  }

  @Delete(':number')
  @ApiOperation({ summary: 'Xóa tập phim' })
  @ApiResponse({
    status: 200,
    description: 'Xóa tập phim',
  })
  async deleteEpisode(
    @Param('filmId') filmId: string,
    @Param('season') season: number,
    @Param('number') number: number,
  ) {
    await this.episodeService.delete(filmId, season, number);
  }
}
