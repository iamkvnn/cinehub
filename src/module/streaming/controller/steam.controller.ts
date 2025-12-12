import {
  Controller,
  Get,
  Param,
  Query,
  Req,
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
import { plainToInstance } from 'class-transformer';
import { createApiResponse } from 'src/common/utils';
import { createApiResponseDto } from 'src/common/dto';
import { StreamService } from '../service/stream.service';
import { StreamingDto } from '../dto/stream.dto';
import { JwtAuthGuard } from 'src/common/guard';
import { User } from 'src/common/decorator/user.decorator';

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
    //@User() user: any,
    @Query('filmId') filmId: string,
    @Query('season') season?: number,
    @Query('episode') episode?: number,
  ) {
    const content = await this.streamService.getStreamingUrl(
      // user.id,
      filmId,
      season,
      episode,
    );
    return new StreamableFile(Buffer.from(content));
  }
}
