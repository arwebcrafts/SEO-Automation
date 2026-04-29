import type { User } from "@prisma/client";
import { getPlanLimits } from "@/lib/plan-limits";

export function assertReviewsPlan(user: User): void {
  const limits = getPlanLimits(user);
  if (!limits.reviewsEnabled) {
    throw new Error("Review reactivation is available on Pro, Agency, and White Label plans.");
  }
}
