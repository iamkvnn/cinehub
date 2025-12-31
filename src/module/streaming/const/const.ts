import { PlanType } from "src/module/plan/const/plan.const";

export const PLAN_QUALITY_MAP: Record<PlanType, string[]> = {
    [PlanType.FREE]: ['360', '480', '720'],
    [PlanType.BASIC]: ['360', '480', '720', '1080'],
    [PlanType.PREMIUM]: ['360', '480', '720', '1080', '1440', '2160'],
}