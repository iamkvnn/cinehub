import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PlanEntity } from '../entity/plan.entity';
import { PaginatedApiQuery } from 'src/common/dto/paginated-query.dto';
import { CreatePlanDto, UpdatePlanDto } from '../dto/plan.dto';

@Injectable()
export class PlanService {
  constructor(
    @InjectRepository(PlanEntity)
    private readonly planRepository: Repository<PlanEntity>,
  ) {}

  async findAll(query: PaginatedApiQuery): Promise<[PlanEntity[], number]> {
    const qb = this.planRepository.createQueryBuilder('plan');

    if (query.sort) {
      Object.entries(query.sort).forEach(([key, value]) => {
        if (value !== 'ASC' && value !== 'DESC') {
          throw new BadRequestException(
            `Thứ tự sắp xếp không hợp lệ cho ${key}: ${value}`,
          );
        }
        qb.addOrderBy(`plan.${key}`, value);
      });
    }

    const [plans, count] = await qb
      .skip((query.page - 1) * query.limit)
      .take(query.limit)
      .getManyAndCount();

    return [plans, count];
  }

  async findById(id: string): Promise<PlanEntity> {
    const plan = await this.planRepository.findOne({ where: { id } });
    if (!plan) {
      throw new NotFoundException('Gói không tồn tại');
    }
    return plan;
  }

  async findByStripeProductId(stripeProductId: string): Promise<PlanEntity> {
    const plan = await this.planRepository.findOne({
      where: { stripeProductId },
    });
    if (!plan) {
      throw new NotFoundException('Gói không tồn tại');
    }
    return plan;
  }

  async findActivePlans(): Promise<PlanEntity[]> {
    return this.planRepository.find({
      where: { isActive: true },
      order: { price: 'ASC' },
    });
  }

  async createPlan(createDto: CreatePlanDto): Promise<PlanEntity> {
    const existingPlan = await this.planRepository.findOne({
      where: [
        { stripeProductId: createDto.stripeProductId },
        { stripePriceId: createDto.stripePriceId },
      ],
    });

    if (existingPlan) {
      throw new BadRequestException(
        'Gói với Stripe Product ID hoặc Price ID này đã tồn tại',
      );
    }

    const plan = this.planRepository.create(createDto);
    return this.planRepository.save(plan);
  }

  async updatePlan(id: string, updateDto: UpdatePlanDto): Promise<PlanEntity> {
    const plan = await this.findById(id);

    if (updateDto.stripeProductId || updateDto.stripePriceId) {
      const existingPlan = await this.planRepository.findOne({
        where: [
          ...(updateDto.stripeProductId
            ? [{ stripeProductId: updateDto.stripeProductId }]
            : []),
          ...(updateDto.stripePriceId
            ? [{ stripePriceId: updateDto.stripePriceId }]
            : []),
        ],
      });

      if (existingPlan && existingPlan.id !== id) {
        throw new BadRequestException(
          'Gói với Stripe Product ID hoặc Price ID này đã tồn tại',
        );
      }
    }

    Object.assign(plan, updateDto);
    return this.planRepository.save(plan);
  }

  async deletePlan(id: string): Promise<void> {
    const plan = await this.findById(id);
    await this.planRepository.softDelete(plan.id);
  }

  async toggleActive(id: string): Promise<PlanEntity> {
    const plan = await this.findById(id);
    plan.isActive = !plan.isActive;
    return this.planRepository.save(plan);
  }
}
