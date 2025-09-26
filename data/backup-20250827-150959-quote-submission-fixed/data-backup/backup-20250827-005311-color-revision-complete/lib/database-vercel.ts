import { PrismaClient } from '@prisma/client';

// Vercel-optimized Prisma client configuration
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Create Prisma client with Vercel-optimized settings
// Only create if DATABASE_URL is available
export const prisma = globalForPrisma.prisma ?? (process.env.DATABASE_URL ? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  // Vercel-specific optimizations
  __internal: {
    engine: {
      // Optimize for serverless environment
      enableEngineDebugMode: false,
      // Reduce connection overhead
      enableQueryLogging: false,
    },
  },
}) : null);

// Only create one instance in development
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// Database connection health check
export async function checkDatabaseConnection() {
  // If no DATABASE_URL, return build mode status
  if (!process.env.DATABASE_URL) {
    return { 
      status: 'build_mode', 
      message: 'Database check skipped - no DATABASE_URL available',
      timestamp: new Date().toISOString() 
    };
  }
  
  // If prisma client is not available, return error
  if (!prisma) {
    return { 
      status: 'failed', 
      error: 'Prisma client not initialized - missing DATABASE_URL',
      timestamp: new Date().toISOString() 
    };
  }
  
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { status: 'connected', timestamp: new Date().toISOString() };
  } catch (error) {
    console.error('Database connection failed:', error);
    return { 
      status: 'failed', 
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString() 
    };
  }
}

// Graceful shutdown for Vercel
export async function closeDatabaseConnection() {
  if (prisma) {
    try {
      await prisma.$disconnect();
      console.log('Database connection closed gracefully');
    } catch (error) {
      console.error('Error closing database connection:', error);
    }
  }
}

// Export the main prisma instance
export { prisma as default };
