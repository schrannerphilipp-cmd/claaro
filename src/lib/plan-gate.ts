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

/**
 * Prüft ob ein User Zugang zu einem Modul hat.
 *
 * Regeln:
 * - null (kein Plan / Trial → wird im Dashboard als isTrialState behandelt):
 *     Im Trial-Zustand gibt das Dashboard direkt `true` zurück, ohne canAccess aufzurufen.
 *     Ohne Trial → kein Zugang.
 * - starter: Nur die 3 selbst gewählten Module (starterModules). Kein Modul gewählt → kein Zugang.
 * - profi / team: Alle 6 Module freigeschaltet.
 */
export function canAccess(
  plan: Plan | null,
  moduleId: ModuleId,
  starterModules?: ModuleId[] | null,
): boolean {
  if (!plan) return false;
  if (plan === "starter") {
    // Starter: nur die 3 selbst gewählten Module
    if (!starterModules || starterModules.length === 0) return false;
    return starterModules.includes(moduleId);
  }
  // Profi + Team: alle Module
  return PLAN_RANK[plan] >= PLAN_RANK[MODULE_MIN_PLAN[moduleId]];
}

export function requiredPlan(moduleId: ModuleId): Plan {
  return MODULE_MIN_PLAN[moduleId];
}

/** localStorage-Key für die 3 gewählten Starter-Module */
export const STARTER_MODULES_LS_KEY = "claaro-starter-modules";
/** localStorage-Key → Modal wurde bereits gezeigt */
export const STARTER_ONBOARDING_DONE_KEY = "claaro-starter-onboarding-done";
