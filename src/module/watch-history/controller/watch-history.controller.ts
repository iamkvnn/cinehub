import {
  Controller,
  Post,
  Delete,
  Get,
  Param,
  Body,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiResponse,
  ApiBody,
  ApiOperation,
  ApiParam,
} from '@nestjs/swagger';
import { WatchHistoryService } from '../service/watch-history.service';
import { JwtAuthGuard } from 'src/common/guard/jwt.guard';
import { User } from 'src/common/decorator';
import { createPaginatedApiResponse } from 'src/common/utils';
import { createPaginatedApiResponseDto, PaginatedApiQuery } from 'src/common/dto';
import { plainToInstance } from 'class-transformer';
import { WatchHistoryDto } from '../dto/watch-history.dto';

@ApiTags('Watch History')
@Controller({ path: 'watch-history', version: '1' })
@ApiBearerAuth()
export class WatchHistoryController {
  constructor(private readonly watchHistoryService: WatchHistoryService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Lấy danh sách lịch sử xem',
    description: 'Trả về danh sách tất cả các phim đã xem của người dùng',
  })
  @ApiResponse({
    status: 200,
    description: 'Danh sách lịch sử xem',
    type: createPaginatedApiResponseDto(WatchHistoryDto),
  })
  async getUserWatchHistory(@User() user: any, @Query() query: PaginatedApiQuery) {
    const [data, total] = await this.watchHistoryService.getUserWatchHistory(user.id);
    return createPaginatedApiResponse(
      plainToInstance(WatchHistoryDto, data),
      total,
      query.page,
      query.limit,
    );
  }

  @Delete(':filmId')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Xóa một phim khỏi lịch sử xem',
    description: 'Xóa một phim cụ thể khỏi lịch sử xem của người dùng',
  })
  @ApiParam({
    name: 'filmId',
    description: 'ID của phim cần xóa',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Phim đã được xóa khỏi lịch sử xem',
  })
  async removeFromWatchHistory(
    @User() user: any,
    @Param('filmId') filmId: string,
  ) {
    return this.watchHistoryService.removeFromWatchHistory(user.id, filmId);
  }

  @Delete()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Xóa toàn bộ lịch sử xem',
    description: 'Xóa tất cả các phim khỏi lịch sử xem của người dùng',
  })
  @ApiResponse({
    status: 200,
    description: 'Lịch sử xem đã được xóa toàn bộ',
  })
  async clearWatchHistory(@User() user: any) {
    return this.watchHistoryService.clearWatchHistory(user.id);
  }
}
