export type Plan = "starter" | "profi" | "team";
export type ModuleId =
  | "angebote"
  | "mahnungen"
  | "onboarding"
  | "bewertungen"
  | "compliance"
  | "dienstplan";

const PLAN_RANK: Record<Plan, number> = { starter: 1, profi: 2, team: 3 };

const MODULE_MIN_PLAN: Record<ModuleId, Plan> = {
  angebote:    "starter",
  mahnungen:   "profi",
  onboarding:  "profi",
  bewertungen: "profi",
  compliance:  "profi",
  dienstplan:  "profi",
};

export const PLAN_NAMES: Record<Plan, string> = {
  starter: "Starter",
  profi:   "Profi",
  team:    "Team",
};

export function canAccess(plan: Plan | null, moduleId: ModuleId): boolean {
  if (!plan) return false;
  return PLAN_RANK[plan] >= PLAN_RANK[MODULE_MIN_PLAN[moduleId]];
}

export function requiredPlan(moduleId: ModuleId): Plan {
  return MODULE_MIN_PLAN[moduleId];
}
