import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import {
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';
import {
  createApiResponse,
  createPaginatedApiResponse,
} from 'src/common/utils';
import {
  createApiResponseDto,
  createPaginatedApiResponseDto,
  PaginatedApiQuery,
} from 'src/common/dto';
import { PlanService } from '../service/plan.service';
import { CreatePlanDto, PlanDto, UpdatePlanDto } from '../dto/plan.dto';

@ApiTags('Plans')
@Controller({
  path: 'plans',
  version: '1',
})
export class PlanController {
  constructor(private readonly planService: PlanService) {}

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách gói với phân trang' })
  @ApiResponse({
    status: 200,
    description: 'Lấy danh sách gói với phân trang',
    type: createPaginatedApiResponseDto(PlanDto),
  })
  async getAllPlans(@Query() query: PaginatedApiQuery) {
    const [plans, count] = await this.planService.findAll(query);
    return createPaginatedApiResponse(
      plainToInstance(PlanDto, plans, { excludeExtraneousValues: true }),
      count,
      query.page,
      query.limit,
    );
  }

  @Get('active')
  @ApiOperation({ summary: 'Lấy danh sách gói đang hoạt động và hiển thị' })
  @ApiResponse({
    status: 200,
    description: 'Lấy danh sách gói đang hoạt động và hiển thị',
    type: createApiResponseDto(PlanDto),
  })
  async getActivePlans() {
    const plans = await this.planService.findActivePlans();
    return createApiResponse(
      plainToInstance(PlanDto, plans, { excludeExtraneousValues: true }),
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy thông tin gói theo ID' })
  @ApiResponse({
    status: 200,
    description: 'Lấy thông tin gói theo ID',
    type: createApiResponseDto(PlanDto),
  })
  @ApiParam({ name: 'id', description: 'Plan ID' })
  async getPlanById(@Param('id') id: string) {
    const plan = await this.planService.findById(id);
    return createApiResponse(
      plainToInstance(PlanDto, plan, { excludeExtraneousValues: true }),
    );
  }

  @Post()
  @ApiOperation({ summary: 'Tạo gói mới' })
  @ApiResponse({
    status: 201,
    description: 'Tạo gói mới',
    type: createApiResponseDto(PlanDto),
  })
  @ApiBody({ type: CreatePlanDto })
  async createPlan(@Body() createDto: CreatePlanDto) {
    const plan = await this.planService.createPlan(createDto);
    return createApiResponse(
      plainToInstance(PlanDto, plan, { excludeExtraneousValues: true }),
    );
  }

  @Put(':id')
  @ApiOperation({ summary: 'Cập nhật thông tin gói' })
  @ApiResponse({
    status: 200,
    description: 'Cập nhật thông tin gói',
    type: createApiResponseDto(PlanDto),
  })
  @ApiParam({ name: 'id', description: 'Plan ID' })
  @ApiBody({ type: UpdatePlanDto })
  async updatePlan(@Param('id') id: string, @Body() updateDto: UpdatePlanDto) {
    const plan = await this.planService.updatePlan(id, updateDto);
    return createApiResponse(
      plainToInstance(PlanDto, plan, { excludeExtraneousValues: true }),
    );
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xóa gói (soft delete)' })
  @ApiResponse({
    status: 200,
    description: 'Xóa gói thành công',
  })
  @ApiParam({ name: 'id', description: 'Plan ID' })
  async deletePlan(@Param('id') id: string) {
    await this.planService.deletePlan(id);
    return createApiResponse({ message: 'Xóa gói thành công' });
  }

  @Patch(':id/toggle-active')
  @ApiOperation({ summary: 'Bật/tắt trạng thái hoạt động của gói' })
  @ApiResponse({
    status: 200,
    description: 'Cập nhật trạng thái hoạt động thành công',
    type: createApiResponseDto(PlanDto),
  })
  @ApiParam({ name: 'id', description: 'Plan ID' })
  async toggleActive(@Param('id') id: string) {
    const plan = await this.planService.toggleActive(id);
    return createApiResponse(
      plainToInstance(PlanDto, plan, { excludeExtraneousValues: true }),
    );
  }
}
