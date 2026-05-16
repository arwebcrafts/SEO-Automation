import { prisma } from "@/lib/prisma";
import { getPlanLimits, type PlanType } from "@/lib/plan-limits";
import { logger } from "@/lib/logger";

const log = logger.child({ service: "reviews-guard" });

export interface ReviewGuardResult {
  allowed: boolean;
  reason?: string;
  dailySent: number;
  monthlySent: number;
  monthlyLimit: number;
}

/**
 * Check if a user can send review requests
 */
export async function canSendReviewRequest(
  userId: string,
  plan: PlanType,
  count: number = 1
): Promise<ReviewGuardResult> {
  const limits = getPlanLimits(plan);
  const monthlyLimit = limits.maxReviewRequestsPerMonth;

  if (monthlyLimit === 0) {
    return {
      allowed: false,
      reason: "Review requests are not available on the Free plan. Upgrade to Pro.",
      dailySent: 0,
      monthlySent: 0,
      monthlyLimit: 0,
    };
  }

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // Count sent review requests this month
  const monthlySent = await prisma.userActivity.count({
    where: {
      userId,
      action: "review_request_sent",
      createdAt: { gte: startOfMonth },
    },
  });

  // Count sent today (daily limit = 20% of monthly)
  const dailySent = await prisma.userActivity.count({
    where: {
      userId,
      action: "review_request_sent",
      createdAt: { gte: startOfDay },
    },
  });

  const dailyLimit = monthlyLimit === -1 ? Infinity : Math.ceil(monthlyLimit * 0.2);

  if (monthlyLimit !== -1 && monthlySent + count > monthlyLimit) {
    log.warn("Monthly review limit exceeded", { userId, monthlySent, monthlyLimit });
    return {
      allowed: false,
      reason: `Monthly review request limit reached (${monthlySent}/${monthlyLimit}).`,
      dailySent,
      monthlySent,
      monthlyLimit,
    };
  }

  if (dailySent + count > dailyLimit) {
    log.warn("Daily review limit exceeded", { userId, dailySent, dailyLimit });
    return {
      allowed: false,
      reason: `Daily review request limit reached (${dailySent}/${dailyLimit}). Try again tomorrow.`,
      dailySent,
      monthlySent,
      monthlyLimit: monthlyLimit === -1 ? Infinity : monthlyLimit,
    };
  }

  return {
    allowed: true,
    dailySent,
    monthlySent,
    monthlyLimit: monthlyLimit === -1 ? Infinity : monthlyLimit,
  };
}

/**
 * Record a sent review request
 */
export async function recordReviewRequest(
  userId: string,
  contactEmail: string,
  metadata?: Record<string, unknown>
) {
  await prisma.userActivity.create({
    data: {
      userId,
      action: "review_request_sent",
      entityType: "review",
      description: `Review request sent to ${contactEmail}`,
      metadata: metadata as Record<string, unknown>,
    },
  });
}
