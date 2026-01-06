import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlanEntity } from './entity/plan.entity';
import { PlanController } from './controller/plan.controller';
import { PlanService } from './service/plan.service';

@Module({
  imports: [TypeOrmModule.forFeature([PlanEntity])],
  controllers: [PlanController],
  providers: [PlanService],
  exports: [PlanService],
})
export class PlanModule {}
