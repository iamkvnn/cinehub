import {
  Controller,
  Post,
  Delete,
  Get,
  Param,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiResponse,
  ApiOperation,
  ApiParam,
} from '@nestjs/swagger';
import { WhistlesService } from '../service/whistles.service';
import { JwtAuthGuard } from 'src/common/guard/jwt.guard';

/**
 * Whistles Controller
 * Quản lý danh sách phim yêu thích của người dùng
 *
 * Endpoints:
 * - POST /whistles/:filmId: Thêm phim vào danh sách yêu thích
 * - DELETE /whistles/:filmId: Xóa phim khỏi danh sách yêu thích (soft delete)
 * - GET /whistles: Lấy danh sách phim yêu thích
 * - GET /whistles/check/:filmId: Kiểm tra phim có trong danh sách hay không
 */
@ApiTags('Whistles')
@Controller({ path: 'whistles', version: '1' })
@ApiBearerAuth()
export class WhistlesController {
  constructor(private readonly whistlesService: WhistlesService) {}

  /**
   * Lấy userId từ JWT payload
   */
  private getUserIdFromRequest(req: any): string {
    return req.user?.userId || req.user?.sub || req.user?.id;
  }

  /**
   * Thêm phim vào danh sách yêu thích
   * @param req - Express request object (chứa user từ JWT)
   * @param filmId - ID của phim
   */
  @Post(':filmId')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Thêm phim vào danh sách yêu thích',
    description: 'Thêm một phim vào danh sách yêu thích của người dùng',
  })
  @ApiParam({
    name: 'filmId',
    description: 'ID của phim cần thêm',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 201,
    description: 'Phim đã được thêm vào danh sách yêu thích',
  })
  async addToWhistles(@Req() req: any, @Param('filmId') filmId: string) {
    const userId = this.getUserIdFromRequest(req);
    return this.whistlesService.addToWhistles(userId, filmId);
  }

  /**
   * Xóa phim khỏi danh sách yêu thích (soft delete)
   * @param req - Express request object (chứa user từ JWT)
   * @param filmId - ID của phim
   */
  @Delete(':filmId')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Xóa phim khỏi danh sách yêu thích',
    description: 'Xóa một phim khỏi danh sách yêu thích của người dùng',
  })
  @ApiParam({
    name: 'filmId',
    description: 'ID của phim cần xóa',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 204,
    description: 'Phim đã được xóa khỏi danh sách yêu thích',
  })
  async removeFromWhistles(@Req() req: any, @Param('filmId') filmId: string) {
    const userId = this.getUserIdFromRequest(req);
    return this.whistlesService.removeFromWhistles(userId, filmId);
  }

  /**
   * Lấy danh sách phim yêu thích của người dùng
   * @param req - Express request object (chứa user từ JWT)
   */
  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Lấy danh sách phim yêu thích',
    description: 'Trả về danh sách tất cả các phim yêu thích của người dùng',
  })
  @ApiResponse({
    status: 200,
    description: 'Danh sách phim yêu thích',
    schema: {
      properties: {
        id: { type: 'string' },
        createdAt: { type: 'string' },
        updatedAt: { type: 'string' },
        deletedAt: { type: 'string', nullable: true },
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
  async getUserWhistles(@Req() req: any) {
    const userId = this.getUserIdFromRequest(req);
    return this.whistlesService.getUserWhistles(userId);
  }

  /**
   * Kiểm tra phim có trong danh sách yêu thích hay không
   * @param req - Express request object (chứa user từ JWT)
   * @param filmId - ID của phim
   */
  @Get('check/:filmId')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Kiểm tra phim có trong danh sách yêu thích',
    description:
      'Kiểm tra xem một phim cụ thể có trong danh sách yêu thích hay không',
  })
  @ApiParam({
    name: 'filmId',
    description: 'ID của phim cần kiểm tra',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Kết quả kiểm tra',
    schema: {
      properties: {
        inWhistles: { type: 'boolean' },
      },
    },
  })
  async isInWhistles(@Req() req: any, @Param('filmId') filmId: string) {
    const userId = this.getUserIdFromRequest(req);
    const inWhistles = await this.whistlesService.isInWhistles(userId, filmId);
    return { inWhistles };
  }
}
