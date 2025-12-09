import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from "@nestjs/swagger";
import { createApiResponseDto, createPaginatedApiResponseDto, PaginatedApiQuery } from "src/common/dto";
import { ReviewDto, CreateReviewDto, UpdateReviewDto } from "../dto/review.dto";
import { createApiResponse, createPaginatedApiResponse } from "src/common/utils";
import { plainToInstance } from "class-transformer";
import { ReviewService } from "../service/review.service";
import { User } from "src/common/decorator/user.decorator";
import { JwtAuthGuard } from "src/common/guard";

@Controller('reviews')
@ApiTags('Reviews')
export class ReviewController {
    constructor(
        private readonly reviewService: ReviewService,
    ) { }

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách đánh giá' })
  @ApiResponse({
    status: 200,
    description: 'Lấy danh sách đánh giá',
    type: createPaginatedApiResponseDto(ReviewDto),
  })
  async getAll(@Query() query: PaginatedApiQuery, @Query('filmId') filmId: string) {
    const [data, count] = await this.reviewService.find(filmId, query);
    return createPaginatedApiResponse(
      plainToInstance(ReviewDto, data, { excludeExtraneousValues: true }),
      count,
      query.page,
      query.limit,
    );
  }

  @Post()
  @ApiResponse({
    status: 201, 
    description: 'Tạo bình đánh giá mới',
    type: createApiResponseDto(ReviewDto),
  })
  @ApiOperation({ summary: 'Tạo bình đánh giá mới' })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async create(@Body() createDto: CreateReviewDto, @User() user) {
    const data = await this.reviewService.create(user.id, createDto);
    return createApiResponse(
      plainToInstance(ReviewDto, data, { excludeExtraneousValues: true }),
    );
  }

  @Put(':id')
  @ApiOperation({ summary: 'Cập nhật thông tin đánh giá' })
  @ApiResponse({
    status: 200,
    description: 'Cập nhật thông tin đánh giá',
    type: createApiResponseDto(ReviewDto),
  })
    @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async update(@Param('id') id: string, @Body() updateDto: UpdateReviewDto, @User() user) {
    const data = await this.reviewService.update(user.id, id, updateDto);
    return createApiResponse(
      plainToInstance(ReviewDto, data, { excludeExtraneousValues: true }),
    );
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xóa đánh giá' })
  @ApiResponse({
    status: 200,
    description: 'Xóa đánh giá',
  })
    @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async delete(@Param('id') id: string, @User() user) {
    await this.reviewService.delete(user.id, id);
  }    
}