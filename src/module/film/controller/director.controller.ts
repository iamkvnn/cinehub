import { Body, Controller, Delete, Get, Param, Post, Put, Query } from "@nestjs/common";
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from "@nestjs/swagger";
import { createApiResponseDto, createPaginatedApiResponseDto, PaginatedApiQuery } from "src/common/dto";
import { DirectorDto, CreateDirectorDto, UpdateDirectorDto } from "../dto/director.dto";
import { createApiResponse, createPaginatedApiResponse } from "src/common/utils";
import { plainToInstance } from "class-transformer";
import { DirectorService } from "../service/director.service";

@Controller('directors')
@ApiTags('Directors')
export class DirectorController {
    constructor(
        private readonly directorService: DirectorService,
    ) { }

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách đạo diễn' })
  @ApiResponse({
    status: 200,
    description: 'Lấy danh sách đạo diễn',
    type: createPaginatedApiResponseDto(DirectorDto),
  })
  async getAll(@Query() query: PaginatedApiQuery) {
    const [data, count] = await this.directorService.find(query);
    return createPaginatedApiResponse(
      plainToInstance(DirectorDto, data, { excludeExtraneousValues: true }),
      count,
      query.page,
      query.limit,
    );
  }

  @ApiOperation({ summary: 'Lấy thông tin đạo diễn theo ID' })
  @ApiResponse({
    status: 200,
    description: 'Lấy thông tin đạo diễn theo ID',
    type: createApiResponseDto(DirectorDto),
  })
  @ApiParam({ name: 'id', description: 'Director ID' })
  @Get(':id')
  async getDirectorById(@Param('id') id: string) {
    const Director = await this.directorService.findOne(id);
    return createApiResponse(
      plainToInstance(DirectorDto, Director, { excludeExtraneousValues: true } ),
    );
  }

  @Post()
  @ApiResponse({
    status: 201, 
    description: 'Tạo đạo diễn mới',
    type: createApiResponseDto(DirectorDto),
  })
  async createDirector(@Body() createDto: CreateDirectorDto) {
    const data = await this.directorService.create(createDto);
    return createApiResponse(
      plainToInstance(DirectorDto, data, { excludeExtraneousValues: true }),
    );
  }

  @Put(':id')
  @ApiOperation({ summary: 'Cập nhật thông tin đạo diễn' })
  @ApiResponse({
    status: 200,
    description: 'Cập nhật thông tin đạo diễn',
    type: createApiResponseDto(DirectorDto),
  })
  async updateDirector(@Param('id') id: string, @Body() updateDto: UpdateDirectorDto) {
    const data = await this.directorService.update(id, updateDto);
    return createApiResponse(
      plainToInstance(DirectorDto, data, { excludeExtraneousValues: true }),
    );
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xóa đạo diễn' })
  @ApiResponse({
    status: 200,
    description: 'Xóa đạo diễn',
  })
  async deleteDirector(@Param('id') id: string) {
    await this.directorService.delete(id);
  }    
}