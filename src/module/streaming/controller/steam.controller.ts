import {
  Controller,
  Get,
  Param,
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

@ApiTags('Streaming')
@Controller({
  path: 'streaming',
  version: '1',
})
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class StreamController {
  constructor(private readonly streamService: StreamService) {}

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

  // @Get('authorize')
  // @UseGuards(JwtAuthGuard)
  // async authorizeStreaming(
  //   @Param('filmId') filmId: string,
  //   @User() user: any,
  //   @Res() res: Response,
  //   @Query('season') season?: number,
  //   @Query('episode') episode?: number,
  // ) {
  //   const cookies = this.streamService.authorizeVideoAccess(
  //     user.id,
  //     filmId,
  //     season,
  //     episode,
  //   );

  //   Object.entries(cookies).forEach(([name, value]) => {
  //     res.cookie(name, value, {
  //       httpOnly: true,
  //       secure: true,
  //       sameSite: 'none',
  //       maxAge: 3600000,
  //       domain: process.env.FRONTEND_URL,
  //     });
  //   });

  //   return res.json({
  //     success: true,
  //     manifestUrl: `https://${process.env.CLOUDFRONT_DOMAIN}/videos/${videoId}/master.m3u8`,
  //     expiresIn: 3600,
  //     allowedResolutions: video.sources.map(s => s.resolution),
  //   });
  // }
}
