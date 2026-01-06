export enum BillingCycle {
  MONTHLY = 'MONTHLY',
  YEARLY = 'YEARLY',
  LIFETIME = 'LIFETIME',
}

export enum PlanType {
  FREE = 'FREE',
  BASIC = 'BASIC',
  PREMIUM = 'PREMIUM',
}

/**
 * Plan level hierarchy for upgrade/downgrade comparison
 * Higher number = higher tier plan
 */
export const PLAN_LEVEL: Record<PlanType, number> = {
  [PlanType.FREE]: 0,
  [PlanType.BASIC]: 1,
  [PlanType.PREMIUM]: 2,
};

/**
 * Compare two plan types and determine if it's an upgrade
 */
export function isUpgrade(
  currentPlanType: PlanType,
  newPlanType: PlanType,
): boolean {
  return PLAN_LEVEL[newPlanType] > PLAN_LEVEL[currentPlanType];
}

/**
 * Compare two plan types and determine if it's a downgrade
 */
export function isDowngrade(
  currentPlanType: PlanType,
  newPlanType: PlanType,
): boolean {
  return PLAN_LEVEL[newPlanType] < PLAN_LEVEL[currentPlanType];
}

/**
 * Get the level of a plan type
 */
export function getPlanLevel(planType: PlanType): number {
  return PLAN_LEVEL[planType];
}
