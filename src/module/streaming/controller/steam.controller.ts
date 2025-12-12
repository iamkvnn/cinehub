import { Controller, Get, Param, Query, Req, UseGuards } from '@nestjs/common';
import {
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';
import { createApiResponse } from 'src/common/utils';
import { createApiResponseDto } from 'src/common/dto';
import { StreamService } from '../service/stream.service';
import { StreamingDto } from '../dto/stream.dto';

@ApiTags('Streaming')
@Controller({
  path: 'streaming',
  version: '1',
})
export class StreamController {
  constructor(private readonly streamService: StreamService) {}

  @Get()
  @ApiOperation({ summary: 'Lấy URL streaming của phim' })
  @ApiResponse({
    status: 200,
    description: 'Lấy URL streaming của phim',
    type: createApiResponseDto(StreamingDto),
  })
  @ApiQuery({ name: 'season', required: false, type: Number, description: 'Số mùa (nếu có)' })
  @ApiQuery({ name: 'episode', required: false, type: Number, description: 'Số tập (nếu có)' })
  async getSubscriptionByUserId(@Query('filmId') filmId: string, @Query('season') season?: number, @Query('episode') episode?: number) {
    const subscription =
      await this.streamService.getStreamingUrl(filmId, season, episode);
    return createApiResponse(
        plainToInstance(StreamingDto, subscription, {
            excludeExtraneousValues: true,
        })
    );
  }
}
