import { Plan, type User } from "@prisma/client";

export type PlanLimits = {
  maxSites: number;
  maxPostsPerMonth: number;
  platformAiCallsPerMonth: number;
  requiresByok: boolean;
  platformAiIncluded: boolean;
  reviewsEnabled: boolean;
  chatbotEnabled: boolean;
};

export function hasActiveSubscription(user: Pick<User, "stripeSubscriptionId" | "stripeCurrentPeriodEnd">): boolean {
  if (!user.stripeSubscriptionId || !user.stripeCurrentPeriodEnd) return false;
  return user.stripeCurrentPeriodEnd.getTime() > Date.now();
}

export function getPlanLimits(user: User): PlanLimits {
  const plan = user.plan;
  const subActive = hasActiveSubscription(user);
  const wlSites = user.wlMaxSites ?? 3;

  if (plan === Plan.WHITE_LABEL && subActive) {
    return {
      maxSites: wlSites,
      maxPostsPerMonth: -1,
      platformAiCallsPerMonth: -1,
      requiresByok: true,
      platformAiIncluded: false,
      reviewsEnabled: true,
      chatbotEnabled: true,
    };
  }

  if (!subActive || plan === Plan.FREE) {
    return {
      maxSites: 0,
      maxPostsPerMonth: 0,
      platformAiCallsPerMonth: 0,
      requiresByok: false,
      platformAiIncluded: false,
      reviewsEnabled: false,
      chatbotEnabled: false,
    };
  }

  switch (plan) {
    case Plan.STARTER:
      return {
        maxSites: 1,
        maxPostsPerMonth: 5,
        platformAiCallsPerMonth: 40,
        requiresByok: false,
        platformAiIncluded: true,
        reviewsEnabled: false,
        chatbotEnabled: false,
      };
    case Plan.PRO:
      return {
        maxSites: 3,
        maxPostsPerMonth: 15,
        platformAiCallsPerMonth: 200,
        requiresByok: false,
        platformAiIncluded: true,
        reviewsEnabled: true,
        chatbotEnabled: false,
      };
    case Plan.AGENCY:
      return {
        maxSites: 15,
        maxPostsPerMonth: 30,
        platformAiCallsPerMonth: 1500,
        requiresByok: false,
        platformAiIncluded: true,
        reviewsEnabled: true,
        chatbotEnabled: true,
      };
    default:
      return {
        maxSites: 0,
        maxPostsPerMonth: 0,
        platformAiCallsPerMonth: 0,
        requiresByok: false,
        platformAiIncluded: false,
        reviewsEnabled: false,
        chatbotEnabled: false,
      };
  }
}

export function parseWlMaxSites(planKey: string): number | undefined {
  const k = planKey.toUpperCase();
  if (k === "WL_10") return 10;
  if (k === "WL_50") return 50;
  if (k === "WL_3" || k === "WHITE_LABEL") return 3;
  return undefined;
}
