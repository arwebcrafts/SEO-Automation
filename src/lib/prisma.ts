import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Use POSTGRES_PRISMA_URL from Vercel Neon integration (has connect_timeout)
// Fall back to DATABASE_URL for local development
const databaseUrl = process.env.POSTGRES_PRISMA_URL || process.env.DATABASE_URL;

// Add connection timeout for serverless environments
const connectionString = databaseUrl?.includes('?') 
  ? `${databaseUrl}&connection_limit=10&pool_timeout=20`
  : `${databaseUrl}?connection_limit=10&pool_timeout=20`;

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
    datasources: {
      db: {
        url: connectionString,
      },
    },
  });

// Handle connection errors in production with retry logic
if (process.env.NODE_ENV === "production") {
  const connectWithRetry = async (retries = 3): Promise<void> => {
    try {
      await prisma.$connect();
      console.log("[Prisma] Successfully connected to database");
    } catch (error) {
      console.error(`[Prisma] Connection attempt ${retries} failed:`, error);
      if (retries > 0) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        return connectWithRetry(retries - 1);
      }
      throw error;
    }
  };
  
  connectWithRetry().catch((error) => {
    console.error("[Prisma] Failed to connect to database after retries:", error);
  });
  
  // Graceful shutdown
  process.on("beforeExit", async () => {
    await prisma.$disconnect();
  });
}

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;
