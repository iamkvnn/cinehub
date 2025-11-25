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
import { CreateWatchHistoryDto } from '../dto/watch-history.dto';

/**
 * Watch History Controller
 * Quản lý lịch sử xem phim của người dùng
 *
 * Endpoints:
 * - POST /watch-history: Ghi nhận/cập nhật lịch sử xem
 * - GET /watch-history: Lấy danh sách phim đã xem
 * - DELETE /watch-history/:filmId: Xóa một phim khỏi lịch sử (soft delete)
 * - DELETE /watch-history: Xóa toàn bộ lịch sử (soft delete)
 */
@ApiTags('Watch History')
@Controller({ path: 'watch-history', version: '1' })
@ApiBearerAuth()
export class WatchHistoryController {
  constructor(private readonly watchHistoryService: WatchHistoryService) {}

  /**
   * Lấy userId từ JWT payload
   */
  private getUserIdFromRequest(req: any): string {
    return req.user?.userId || req.user?.sub || req.user?.id;
  }

  /**
   * Ghi nhận/cập nhật lịch sử xem phim
   * @param req - Express request object (chứa user từ JWT)
   * @param createDto - DTO chứa filmId, watchedDuration, totalDuration
   * @returns Thông tin lịch sử xem đã được lưu
   */
  @Post()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Ghi nhận/cập nhật lịch sử xem phim',
    description: 'Tạo mới hoặc cập nhật thời gian xem phim của người dùng',
  })
  @ApiBody({ type: CreateWatchHistoryDto })
  @ApiResponse({
    status: 201,
    description: 'Lịch sử xem được ghi nhận thành công',
    schema: {
      properties: {
        filmId: { type: 'string' },
        watchedDuration: { type: 'number' },
        totalDuration: { type: 'number' },
        watchPercentage: { type: 'number' },
      },
    },
  })
  async recordWatch(@Req() req: any, @Body() createDto: CreateWatchHistoryDto) {
    const userId = this.getUserIdFromRequest(req);
    return this.watchHistoryService.recordWatch(userId, createDto);
  }

  /**
   * Lấy danh sách phim đã xem của người dùng
   * @param req - Express request object (chứa user từ JWT)
   * @returns Danh sách phim đã xem
   */
  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Lấy danh sách lịch sử xem',
    description: 'Trả về danh sách tất cả các phim đã xem của người dùng',
  })
  @ApiResponse({
    status: 200,
    description: 'Danh sách lịch sử xem',
    schema: {
      properties: {
        id: { type: 'string' },
        createdAt: { type: 'string' },
        updatedAt: { type: 'string' },
        deletedAt: { type: 'string', nullable: true },
        watchedDuration: { type: 'number' },
        totalDuration: { type: 'number' },
        film: {
          properties: {
            id: { type: 'string' },
            title: { type: 'string' },
            rating: { type: 'number' },
          },
        },
      },
    },
  })
  async getUserWatchHistory(@Req() req: any) {
    const userId = this.getUserIdFromRequest(req);
    return this.watchHistoryService.getUserWatchHistory(userId);
  }

  /**
   * Xóa một phim khỏi lịch sử xem (soft delete)
   * @param req - Express request object (chứa user từ JWT)
   * @param filmId - ID của phim cần xóa
   */
  @Delete(':filmId')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
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
    status: 204,
    description: 'Phim đã được xóa khỏi lịch sử xem',
  })
  async removeFromWatchHistory(
    @Req() req: any,
    @Param('filmId') filmId: string,
  ) {
    const userId = this.getUserIdFromRequest(req);
    return this.watchHistoryService.removeFromWatchHistory(userId, filmId);
  }

  /**
   * Xóa toàn bộ lịch sử xem (soft delete)
   * @param req - Express request object (chứa user từ JWT)
   */
  @Delete()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Xóa toàn bộ lịch sử xem',
    description: 'Xóa tất cả các phim khỏi lịch sử xem của người dùng',
  })
  @ApiResponse({
    status: 204,
    description: 'Lịch sử xem đã được xóa toàn bộ',
  })
  async clearWatchHistory(@Req() req: any) {
    const userId = this.getUserIdFromRequest(req);
    return this.watchHistoryService.clearWatchHistory(userId);
  }
}
