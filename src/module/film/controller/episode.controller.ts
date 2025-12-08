import { Body, Controller, Delete, Get, Param, Post, Put, Query } from "@nestjs/common";
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from "@nestjs/swagger";
import { createApiResponseDto, createPaginatedApiResponseDto, PaginatedApiQuery } from "src/common/dto";
import { EpisodeDto, CreateEpisodeDto, UpdateEpisodeDto } from "../dto/episode.dto";
import { createApiResponse, createPaginatedApiResponse } from "src/common/utils";
import { plainToInstance } from "class-transformer";
import { EpisodeService } from "../service/episode.service";

@Controller('films/:filmId/seasons/:seasonId/episodes')
@ApiTags('Episodes')
export class EpisodeController {
    constructor(
        private readonly episodeService: EpisodeService,
    ) { }

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách tập phim' })
  @ApiResponse({
    status: 200,
    description: 'Lấy danh sách tập phim',
    type: createPaginatedApiResponseDto(EpisodeDto),
  })
  async getAll(@Query() query: PaginatedApiQuery, @Param('filmId') filmId: string, @Param('seasonId') seasonId: string) {
    const [data, count] = await this.episodeService.find(filmId, seasonId, query);
    return createPaginatedApiResponse(
      plainToInstance(EpisodeDto, data, { excludeExtraneousValues: true }),
      count,
      query.page,
      query.limit,
    );
  }

  @ApiOperation({ summary: 'Lấy thông tin tập phim theo ID' })
  @ApiResponse({
    status: 200,
    description: 'Lấy thông tin tập phim theo ID',
    type: createApiResponseDto(EpisodeDto),
  })
  @ApiParam({ name: 'id', description: 'Episode ID' })
  @Get('/:id')
  async getEpisodeById(@Param('id') id: string, @Param('filmId') filmId: string, @Param('seasonId') seasonId: string) {
    const data = await this.episodeService.findOne(filmId, seasonId, id);
    return createApiResponse(
      plainToInstance(EpisodeDto, data, { excludeExtraneousValues: true } ),
    );
  }

  @Post()
  @ApiResponse({
    status: 201, 
    description: 'Tạo tập phim mới',
    type: createApiResponseDto(EpisodeDto),
  })
  async createEpisode(@Body() createDto: CreateEpisodeDto, @Param('filmId') filmId: string, @Param('seasonId') seasonId: string) {
    const data = await this.episodeService.create(filmId, seasonId, createDto);
    return createApiResponse(
      plainToInstance(EpisodeDto, data),
    );
  }

  @Put(':id')
  @ApiOperation({ summary: 'Cập nhật thông tin tập phim' })
  @ApiResponse({
    status: 200,
    description: 'Cập nhật thông tin tập phim',
    type: createApiResponseDto(EpisodeDto),
  })
  async updateEpisode(@Param('filmId') filmId: string, @Param('seasonId') seasonId: string, @Param('id') id: string, @Body() updateDto: UpdateEpisodeDto) {
    const data = await this.episodeService.update(filmId, seasonId, id, updateDto);
    return createApiResponse(
      plainToInstance(EpisodeDto, data, { excludeExtraneousValues: true }),
    );
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xóa tập phim' })
  @ApiResponse({
    status: 200,
    description: 'Xóa tập phim',
  })
  async deleteEpisode(@Param('filmId') filmId: string, @Param('seasonId') seasonId: string, @Param('id') id: string) {
    await this.episodeService.delete(filmId, seasonId, id);
  }    
}