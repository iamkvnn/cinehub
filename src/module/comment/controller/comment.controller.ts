import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import {
  createApiResponseDto,
  createPaginatedApiResponseDto,
  PaginatedApiQuery,
} from 'src/common/dto';
import {
  CommentDto,
  CreateCommentDto,
  UpdateCommentDto,
} from '../dto/comment.dto';
import {
  createApiResponse,
  createPaginatedApiResponse,
} from 'src/common/utils';
import { plainToInstance } from 'class-transformer';
import { CommentService } from '../service/comment.service';
import { CommentReactionService } from '../service/comment-reaction.service';
import { User } from 'src/common/decorator/user.decorator';
import { JwtAuthGuard } from 'src/common/guard';
import { CommentQueryDto } from '../dto/comment-query.dto';
import {
  CreateCommentReactionDto,
  CommentReactionResponseDto,
  CreateCommentReportDto,
  CommentReportDto,
} from '../dto/comment-reaction.dto';

@Controller('comments')
@ApiTags('Comments')
export class CommentController {
  constructor(
    private readonly commentService: CommentService,
    private readonly commentReactionService: CommentReactionService,
  ) {}

  @Get(':filmId')
  @ApiOperation({ summary: 'Lấy danh sách bình luận' })
  @ApiResponse({
    status: 200,
    description: 'Lấy danh sách bình luận',
    type: createPaginatedApiResponseDto(CommentDto),
  })
  async getAllByFilmId(@Param('filmId') filmId: string, @Query() query: CommentQueryDto) {
    const [data, count] = await this.commentService.findByFilmId(filmId, query);
    return createPaginatedApiResponse(
      plainToInstance(CommentDto, data, { excludeExtraneousValues: true }),
      count,
      query.page,
      query.limit,
    );
  }

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách bình luận' })
  @ApiResponse({
    status: 200,
    description: 'Lấy danh sách bình luận',
    type: createPaginatedApiResponseDto(CommentDto),
  })
  async getAll(@Query() query: PaginatedApiQuery) {
    const [data, count] = await this.commentService.find(query);
    return createPaginatedApiResponse(
      plainToInstance(CommentDto, data, { excludeExtraneousValues: true }),
      count,
      query.page,
      query.limit,
    );
  }

  @Post()
  @ApiResponse({
    status: 201,
    description: 'Tạo bình luận mới',
    type: createApiResponseDto(CommentDto),
  })
  @ApiOperation({ summary: 'Tạo bình luận mới' })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async create(@Body() createDto: CreateCommentDto, @User() user) {
    const data = await this.commentService.create(user.id, createDto);
    return createApiResponse(
      plainToInstance(CommentDto, data, { excludeExtraneousValues: true }),
    );
  }

  @Put(':id')
  @ApiOperation({ summary: 'Cập nhật thông tin bình luận' })
  @ApiResponse({
    status: 200,
    description: 'Cập nhật thông tin bình luận',
    type: createApiResponseDto(CommentDto),
  })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateCommentDto,
    @User() user,
  ) {
    const data = await this.commentService.update(user.id, id, updateDto);
    return createApiResponse(
      plainToInstance(CommentDto, data, { excludeExtraneousValues: true }),
    );
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xóa bình luận' })
  @ApiResponse({
    status: 200,
    description: 'Xóa bình luận',
  })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async delete(@Param('id') id: string, @User() user) {
    await this.commentService.delete(user.id, id);
  }

  @Post('reaction')
  @ApiOperation({ summary: 'Like hoặc Dislike một bình luận' })
  @ApiResponse({
    status: 200,
    description: 'Trả về trạng thái reaction sau khi thao tác',
    type: createApiResponseDto(CommentReactionResponseDto),
  })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async react(@Body() dto: CreateCommentReactionDto, @User() user) {
    const data = await this.commentReactionService.react(user.id, dto);
    return createApiResponse(data);
  }

  @Post('report')
  @ApiOperation({ summary: 'Báo cáo một bình luận vi phạm' })
  @ApiResponse({
    status: 201,
    description: 'Báo cáo bình luận thành công',
    type: createApiResponseDto(CommentReportDto),
  })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async report(@Body() dto: CreateCommentReportDto, @User() user) {
    const data = await this.commentReactionService.report(
      user.id,
      dto.commentId,
      dto.reason,
      dto.description,
    );
    return createApiResponse(
      plainToInstance(CommentReportDto, data, {
        excludeExtraneousValues: true,
      }),
    );
  }
}
