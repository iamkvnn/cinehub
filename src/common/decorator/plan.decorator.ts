import { SetMetadata } from '@nestjs/common';
import { PlanType } from 'src/module/plan/const/plan.const';

export const REQUIRED_PLANS_KEY = 'requiredPlans';

/**
 * Decorator để chỉ định các plan được phép truy cập
 * @example @RequiredPlans(PlanType.PRO, PlanType.PREMIUM)
 */
export const RequiredPlans = (...plans: PlanType[]) =>
  SetMetadata(REQUIRED_PLANS_KEY, plans);

/**
 * Decorator cho phép tất cả user có subscription (bao gồm Free)
 */
export const AllPlans = () =>
  SetMetadata(REQUIRED_PLANS_KEY, [
    PlanType.FREE,
    PlanType.BASIC,
    PlanType.PREMIUM,
  ]);

/**
 * Decorator chỉ cho phép user trả phí (Pro trở lên)
 */
export const PaidPlansOnly = () =>
  SetMetadata(REQUIRED_PLANS_KEY, [PlanType.BASIC, PlanType.PREMIUM]);

/**
 * Decorator chỉ cho phép Premium
 */
export const PremiumOnly = () =>
  SetMetadata(REQUIRED_PLANS_KEY, [PlanType.PREMIUM]);
