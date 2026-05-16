import { prisma } from "@/lib/prisma";

export type PlanType = "FREE" | "PRO" | "AGENCY" | "WHITE_LABEL";

export interface PlanLimits {
  auditsPerMonth: number;
  contentPerMonth: number;
  aiCallsPerDay: number;
  maxClients: number;
  maxTeamMembers: number;
  maxKeywords: number;
  maxSites: number;
  maxReviewRequestsPerMonth: number;
  chatbotEnabled: boolean;
  whiteLabel: boolean;
  geoAudit: boolean;
  dripCampaigns: boolean;
  rankTracking: boolean;
  weeklyReports: boolean;
  apiAccess: boolean;
  byokSupport: boolean;
  prioritySupport: boolean;
}

export const PLAN_LIMITS: Record<PlanType, PlanLimits> = {
  FREE: {
    auditsPerMonth: 5,
    contentPerMonth: 10,
    aiCallsPerDay: 20,
    maxClients: 0,
    maxTeamMembers: 0,
    maxKeywords: 10,
    maxSites: 1,
    maxReviewRequestsPerMonth: 0,
    chatbotEnabled: false,
    whiteLabel: false,
    geoAudit: false,
    dripCampaigns: false,
    rankTracking: false,
    weeklyReports: false,
    apiAccess: false,
    byokSupport: false,
    prioritySupport: false,
  },
  PRO: {
    auditsPerMonth: 50,
    contentPerMonth: 100,
    aiCallsPerDay: 100,
    maxClients: 0,
    maxTeamMembers: 0,
    maxKeywords: 100,
    maxSites: 5,
    maxReviewRequestsPerMonth: 100,
    chatbotEnabled: true,
    whiteLabel: false,
    geoAudit: true,
    dripCampaigns: true,
    rankTracking: true,
    weeklyReports: true,
    apiAccess: true,
    byokSupport: true,
    prioritySupport: false,
  },
  AGENCY: {
    auditsPerMonth: 500,
    contentPerMonth: 1000,
    aiCallsPerDay: 500,
    maxClients: 50,
    maxTeamMembers: 10,
    maxKeywords: 1000,
    maxSites: 50,
    maxReviewRequestsPerMonth: 1000,
    chatbotEnabled: true,
    whiteLabel: false,
    geoAudit: true,
    dripCampaigns: true,
    rankTracking: true,
    weeklyReports: true,
    apiAccess: true,
    byokSupport: true,
    prioritySupport: true,
  },
  WHITE_LABEL: {
    auditsPerMonth: -1, // unlimited
    contentPerMonth: -1,
    aiCallsPerDay: -1,
    maxClients: -1,
    maxTeamMembers: -1,
    maxKeywords: -1,
    maxSites: -1,
    maxReviewRequestsPerMonth: -1,
    chatbotEnabled: true,
    whiteLabel: true,
    geoAudit: true,
    dripCampaigns: true,
    rankTracking: true,
    weeklyReports: true,
    apiAccess: true,
    byokSupport: true,
    prioritySupport: true,
  },
};

export function getPlanLimits(plan: PlanType): PlanLimits {
  return PLAN_LIMITS[plan] || PLAN_LIMITS.FREE;
}

export function isFeatureEnabled(plan: PlanType, feature: keyof PlanLimits): boolean {
  const limits = getPlanLimits(plan);
  const value = limits[feature];
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  return false;
}

export async function checkUsageLimit(
  userId: string,
  limitType: "audits" | "content" | "aiCalls",
  plan: PlanType
): Promise<{ allowed: boolean; current: number; limit: number }> {
  const limits = getPlanLimits(plan);
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  let current = 0;
  let limit = 0;

  switch (limitType) {
    case "audits": {
      limit = limits.auditsPerMonth;
      current = await prisma.audit.count({
        where: { userId, createdAt: { gte: startOfMonth } },
      });
      break;
    }
    case "content": {
      limit = limits.contentPerMonth;
      current = await prisma.scheduledContent.count({
        where: { userId, createdAt: { gte: startOfMonth } },
      });
      break;
    }
    case "aiCalls": {
      limit = limits.aiCallsPerDay;
      // For AI calls, we track via activities
      current = await prisma.userActivity.count({
        where: {
          userId,
          action: "ai_call",
          createdAt: { gte: startOfDay },
        },
      });
      break;
    }
  }

  // -1 means unlimited
  const allowed = limit === -1 || current < limit;

  return { allowed, current, limit: limit === -1 ? Infinity : limit };
}

export function getUpgradePlan(currentPlan: PlanType): PlanType | null {
  const upgradePath: Record<PlanType, PlanType | null> = {
    FREE: "PRO",
    PRO: "AGENCY",
    AGENCY: "WHITE_LABEL",
    WHITE_LABEL: null,
  };
  return upgradePath[currentPlan];
}

export const PLAN_PRICES = {
  FREE: 0,
  PRO: 29,
  AGENCY: 99,
  WHITE_LABEL: 249,
} as const;
