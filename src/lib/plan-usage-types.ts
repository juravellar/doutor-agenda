import type { PlanLimits } from "@/lib/plans";

export interface Usage {
  used: number;
  limit: number | null; // null means unlimited
}

export type PlanUsage = Record<keyof PlanLimits, Usage>;

export const isAtLimit = ({ used, limit }: Usage) =>
  limit !== null && used >= limit;
