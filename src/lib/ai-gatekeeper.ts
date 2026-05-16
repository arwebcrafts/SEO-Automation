import { prisma } from "@/lib/prisma";
import { checkUsageLimit, type PlanType } from "@/lib/plan-limits";
import { logger } from "@/lib/logger";

const log = logger.child({ service: "ai-gatekeeper" });

export interface GatekeeperResult {
  allowed: boolean;
  reason?: string;
  remaining?: number;
  resetAt?: Date;
}

/**
 * Check if a user is allowed to make an AI call
 */
export async function checkAiAccess(
  userId: string,
  plan: PlanType
): Promise<GatekeeperResult> {
  try {
    const usage = await checkUsageLimit(userId, "aiCalls", plan);

    if (!usage.allowed) {
      const now = new Date();
      const resetAt = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

      log.warn("AI rate limit exceeded", {
        userId,
        plan,
        current: usage.current,
        limit: usage.limit,
      });

      return {
        allowed: false,
        reason: `Daily AI call limit reached (${usage.current}/${usage.limit}). Resets at midnight.`,
        remaining: 0,
        resetAt,
      };
    }

    return {
      allowed: true,
      remaining: usage.limit === Infinity ? Infinity : usage.limit - usage.current,
    };
  } catch (error) {
    log.error("AI gatekeeper check failed", error);
    // Fail open - allow the request if we can't check
    return { allowed: true };
  }
}

/**
 * Record an AI call for tracking
 */
export async function recordAiCall(
  userId: string,
  metadata?: {
    model?: string;
    tokens?: number;
    feature?: string;
  }
) {
  try {
    await prisma.userActivity.create({
      data: {
        userId,
        action: "ai_call",
        entityType: "ai",
        description: `AI call: ${metadata?.feature || "general"}`,
        metadata: metadata ? (metadata as Record<string, unknown>) : undefined,
      },
    });
  } catch (error) {
    log.error("Failed to record AI call", error);
  }
}

/**
 * Middleware-style AI gatekeeper that checks access and records usage
 */
export async function withAiGatekeeper<T>(
  userId: string,
  plan: PlanType,
  feature: string,
  fn: () => Promise<T>
): Promise<T> {
  const access = await checkAiAccess(userId, plan);

  if (!access.allowed) {
    throw new Error(access.reason || "AI rate limit exceeded");
  }

  const result = await fn();

  // Record the call after successful execution
  await recordAiCall(userId, { feature });

  return result;
}
