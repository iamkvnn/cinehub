import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Res,
  StreamableFile,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { createApiResponseDto } from 'src/common/dto';
import { StreamService } from '../service/stream.service';
import { StreamingDto } from '../dto/stream.dto';
import { JwtAuthGuard } from 'src/common/guard';
import { User } from 'src/common/decorator/user.decorator';
import type { Response } from 'express';
import { WatchHistoryService } from 'src/module/watch-history/service/watch-history.service';
import { VideoService } from 'src/module/media/service/video.service';
import { HeartbeatDto } from '../dto/heartbeat.dto';

@ApiTags('Streaming')
@Controller({
  path: 'streaming',
  version: '1',
})
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class StreamController {
  constructor(
    private readonly streamService: StreamService,
    private readonly watchHistoryService: WatchHistoryService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Kiểm tra video có sẵn để streaming' })
  @ApiResponse({
    status: 201,
    description: 'Kiểm tra video có sẵn để streaming',
    type: createApiResponseDto(StreamingDto),
  })
  async checkVideoAvailability(
    @Query('filmId') filmId: string,
    @Query('season') season?: number,
    @Query('episode') episode?: number,
  ) {
    await this.streamService.checkVideoAvailability(
      filmId,
      season,
      episode,
    );
  }

  @Get()
  @ApiOperation({ summary: 'Lấy URL streaming của phim' })
  @ApiResponse({
    status: 200,
    description: 'Lấy URL streaming của phim',
    type: createApiResponseDto(StreamingDto),
  })
  @ApiQuery({
    name: 'season',
    required: false,
    type: Number,
    description: 'Số mùa (nếu có)',
  })
  @ApiQuery({
    name: 'episode',
    required: false,
    type: Number,
    description: 'Số tập (nếu có)',
  })
  async getStreamingFile(
    @Res() res: Response,
    @User() user: any,
    @Query('filmId') filmId: string,
    @Query('season') season?: number,
    @Query('episode') episode?: number,
  ) {
    const content = await this.streamService.getStreamingUrl(
      user.id,
      filmId,
      season,
      episode,
    );
    res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
    res.send(content);
  }

  @Post('heartbeat')
  @ApiOperation({ summary: 'Gửi tín hiệu heartbeat khi streaming' })
  @ApiResponse({
    status: 201,
    description: 'Gửi tín hiệu heartbeat khi streaming',
  })
  async heartbeat(
    @Body() dto: HeartbeatDto,
    @User() user: any,
    @Query('filmId') filmId: string,
    @Query('season') season?: number,
    @Query('episode') episode?: number,
  ) {
    return await this.watchHistoryService.recordHeartbeat(
      user.id,
      filmId,
      dto,
      season,
      episode,
    );
  }
}
