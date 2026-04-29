import { Plan, type User } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { decryptSecret } from "@/lib/encryption";
import { getPlanLimits, hasActiveSubscription } from "@/lib/plan-limits";
import OpenAI from "openai";

export class AiGateDeniedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AiGateDeniedError";
  }
}

export function getOpenAiApiKeyForUser(user: User): string {
  if (user.plan === Plan.WHITE_LABEL && hasActiveSubscription(user)) {
    if (!user.openaiApiKeyEncrypted) {
      throw new AiGateDeniedError(
        "Add your OpenAI API key in settings to enable AI and reviews for your white-label plan."
      );
    }
    return decryptSecret(user.openaiApiKeyEncrypted);
  }

  if (user.openaiApiKeyEncrypted) {
    try {
      return decryptSecret(user.openaiApiKeyEncrypted);
    } catch {
      // fall through to platform
    }
  }

  const platform = process.env.OPENAI_API_KEY;
  if (!platform) {
    throw new AiGateDeniedError("Platform AI is not configured.");
  }
  return platform;
}

export function getOpenAiClientForUser(user: User): OpenAI {
  const key = getOpenAiApiKeyForUser(user);
  return new OpenAI({ apiKey: key });
}

export async function consumePlatformAiCall(user: User): Promise<void> {
  const limits = getPlanLimits(user);
  if (!limits.platformAiIncluded || limits.platformAiCallsPerMonth < 0) {
    return;
  }
  if (user.openaiApiKeyEncrypted) {
    return;
  }

  const now = new Date();
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth() + 1;

  const existing = await prisma.aiUsage.findUnique({
    where: { userId_year_month: { userId: user.id, year, month } },
  });
  const next = (existing?.callCount ?? 0) + 1;
  if (next > limits.platformAiCallsPerMonth) {
    throw new AiGateDeniedError(
      `Monthly AI limit reached (${limits.platformAiCallsPerMonth} calls). Upgrade your plan or add your own OpenAI key in settings.`
    );
  }

  await prisma.aiUsage.upsert({
    where: { userId_year_month: { userId: user.id, year, month } },
    create: { userId: user.id, year, month, callCount: 1 },
    update: { callCount: { increment: 1 } },
  });
}
