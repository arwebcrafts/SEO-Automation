import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Use POSTGRES_PRISMA_URL from Vercel Neon integration (has connect_timeout)
// Fall back to DATABASE_URL for local development
const databaseUrl = process.env.POSTGRES_PRISMA_URL || process.env.DATABASE_URL;

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
    datasources: {
      db: {
        url: databaseUrl,
      },
    },
  });

// Handle connection errors in production
if (process.env.NODE_ENV === "production") {
  prisma.$connect().catch((error) => {
    console.error("[Prisma] Failed to connect to database:", error);
  });
  
  // Graceful shutdown
  process.on("beforeExit", async () => {
    await prisma.$disconnect();
  });
}

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;
