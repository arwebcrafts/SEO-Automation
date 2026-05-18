import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// Custom error class for auth failures — routes can catch this to return 401
export class AuthError extends Error {
  constructor(message = "Unauthorized: Please sign in") {
    super(message);
    this.name = "AuthError";
  }
}

export async function getCurrentUser() {
  const { userId: clerkUserId } = await auth();
  
  if (!clerkUserId) {
    return null;
  }

  let user = await prisma.user.findUnique({
    where: { clerkUserId },
  });

  // Create user if they don't exist in our database
  if (!user) {
    const clerkUser = await currentUser();
    
    try {
      user = await prisma.user.create({
        data: {
          clerkUserId,
          email: clerkUser?.emailAddresses[0]?.emailAddress || `${clerkUserId}@example.com`,
          name: `${clerkUser?.firstName || ''} ${clerkUser?.lastName || ''}`.trim() || undefined,
        },
      });
      console.log(`[Auth] Created new user: ${user.id} for Clerk user: ${clerkUserId}`);
    } catch (error) {
      console.error(`[Auth] Failed to create user for Clerk user: ${clerkUserId}`, error);
      throw error;
    }
  }

  return user;
}

export async function requireAuth() {
  const user = await getCurrentUser();
  
  if (!user) {
    throw new AuthError();
  }

  return user;
}

/**
 * Helper to handle errors in API route catch blocks.
 * Returns 401 for auth errors, 500 for everything else.
 */
export function handleApiError(error: unknown, fallbackMessage = "Internal server error") {
  if (error instanceof AuthError) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }
  console.error(`[API Error] ${fallbackMessage}:`, error);
  return NextResponse.json(
    { error: error instanceof Error ? error.message : fallbackMessage },
    { status: 500 }
  );
}

export async function getUserData(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      audits: {
        orderBy: { createdAt: "desc" },
        take: 20,
      },
    },
  });

  return user;
}

