import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Determine which database to use based on environment
const isProduction = process.env.NODE_ENV === 'production';
const hasVercelDatabase = !!process.env.DATABASE_URL;

// Create Prisma client with appropriate configuration
export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL || 'file:./dev.db',
    },
  },
  // Vercel-specific optimizations for production
  ...(isProduction && hasVercelDatabase && {
    __internal: {
      engine: {
        enableEngineDebugMode: false,
        enableQueryLogging: false,
      },
    },
  }),
});

// Only create one instance in development
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// Database service class with unified interface
export class DatabaseService {
  // Helper method to check if database is available
  private static checkDatabase() {
    if (!prisma) {
      throw new Error('Database not available - DATABASE_URL not configured');
    }
    return prisma;
  }

  // Helper method to get database info
  static getDatabaseInfo() {
    return {
      isProduction,
      hasVercelDatabase,
      databaseUrl: process.env.DATABASE_URL ? 'Vercel PostgreSQL' : 'Local SQLite',
      environment: process.env.NODE_ENV || 'development'
    };
  }

  // Database connection health check
  static async checkConnection() {
    try {
      const db = this.checkDatabase();
      await db.$queryRaw`SELECT 1`;
      return { 
        status: 'connected', 
        timestamp: new Date().toISOString(),
        ...this.getDatabaseInfo()
      };
    } catch (error) {
      console.error('Database connection failed:', error);
      return { 
        status: 'failed', 
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
        ...this.getDatabaseInfo()
      };
    }
  }

  // Graceful shutdown
  static async disconnect() {
    if (prisma) {
      try {
        await prisma.$disconnect();
        console.log('Database connection closed gracefully');
      } catch (error) {
        console.error('Error closing database connection:', error);
      }
    }
  }

  // User operations
  static async createUser(userData: {
    email: string;
    name: string;
    role?: string;
    profilePicture?: string;
    password?: string;
    status?: string;
  }) {
    const db = this.checkDatabase();
    return await db.user.create({
      data: userData,
    });
  }

  static async getUserByEmail(email: string) {
    const db = this.checkDatabase();
    return await db.user.findUnique({
      where: { email },
    });
  }

  static async getUserById(id: string) {
    const db = this.checkDatabase();
    return await db.user.findUnique({
      where: { id },
      include: {
        quotes: true,
        clients: true,
      },
    });
  }

  static async updateUser(id: string, data: any) {
    const db = this.checkDatabase();
    return await db.user.update({
      where: { id },
      data,
    });
  }

  static async deleteUser(id: string) {
    const db = this.checkDatabase();
    return await db.user.delete({
      where: { id },
    });
  }

  static async getAllUsers() {
    const db = this.checkDatabase();
    return await db.user.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  // Client operations
  static async createClient(clientData: {
    clientType: string;
    companyName?: string;
    firstName?: string;
    lastName?: string;
    designation?: string;
    contactPerson: string;
    email: string;
    emails?: string;
    phone: string;
    countryCode: string;
    role?: string;
    trn?: string;
    hasNoTrn?: number;
    address?: string;
    city?: string;
    area?: string;
    state?: string;
    postalCode?: string;
    country?: string;
    userId?: string;
  }) {
    const db = this.checkDatabase();
    
    try {
      return await db.client.create({
        data: clientData,
      });
    } catch (error) {
      console.error('Error creating client:', error);
      throw error;
    }
  }

  static async getClientById(id: string) {
    const db = this.checkDatabase();
    return await db.client.findUnique({
      where: { id },
      include: {
        user: true,
        quotes: true,
      },
    });
  }

  static async updateClient(id: string, data: any) {
    const db = this.checkDatabase();
    return await db.client.update({
      where: { id },
      data,
    });
  }

  static async deleteClient(id: string) {
    const db = this.checkDatabase();
    return await db.client.delete({
      where: { id },
    });
  }

  static async getAllClients() {
    const db = this.checkDatabase();
    return await db.client.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        user: true,
      },
    });
  }

  // Quote operations
  static async createQuote(quoteData: any) {
    const db = this.checkDatabase();
    return await db.quote.create({
      data: quoteData,
      include: {
        client: true,
        user: true,
        salesPerson: true,
        amounts: true,
        QuoteOperational: true,
        papers: true,
        finishing: true,
      },
    });
  }

  static async getQuoteById(id: string) {
    const db = this.checkDatabase();
    return await db.quote.findUnique({
      where: { id },
      include: {
        client: true,
        user: true,
        salesPerson: true,
        amounts: true,
        QuoteOperational: true,
        papers: true,
        finishing: true,
      },
    });
  }

  static async updateQuote(id: string, data: any) {
    const db = this.checkDatabase();
    return await db.quote.update({
      where: { id },
      data,
      include: {
        client: true,
        user: true,
        salesPerson: true,
        amounts: true,
        QuoteOperational: true,
        papers: true,
        finishing: true,
      },
    });
  }

  static async deleteQuote(id: string) {
    const db = this.checkDatabase();
    return await db.quote.delete({
      where: { id },
    });
  }

  static async getAllQuotes() {
    const db = this.checkDatabase();
    return await db.quote.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        client: true,
        user: true,
        salesPerson: true,
        amounts: true,
        QuoteOperational: true,
      },
    });
  }

  // Sales Person operations
  static async createSalesPerson(salesPersonData: any) {
    const db = this.checkDatabase();
    return await db.salesPerson.create({
      data: salesPersonData,
    });
  }

  static async getSalesPersonById(id: string) {
    const db = this.checkDatabase();
    return await db.salesPerson.findUnique({
      where: { id },
      include: {
        quotes: true,
      },
    });
  }

  static async getSalesPersonBySalesPersonId(salesPersonId: string) {
    const db = this.checkDatabase();
    return await db.salesPerson.findUnique({
      where: { salesPersonId },
      include: {
        quotes: true,
      },
    });
  }

  static async updateSalesPerson(id: string, data: any) {
    const db = this.checkDatabase();
    return await db.salesPerson.update({
      where: { id },
      data,
    });
  }

  static async deleteSalesPerson(id: string) {
    const db = this.checkDatabase();
    return await db.salesPerson.delete({
      where: { id },
    });
  }

  static async getAllSalesPersons() {
    const db = this.checkDatabase();
    return await db.salesPerson.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        quotes: true,
      },
    });
  }

  // Supplier operations
  static async createSupplier(supplierData: any) {
    const db = this.checkDatabase();
    return await db.supplier.create({
      data: supplierData,
    });
  }

  static async getSupplierById(id: string) {
    const db = this.checkDatabase();
    return await db.supplier.findUnique({
      where: { id },
      include: {
        materials: true,
      },
    });
  }

  static async updateSupplier(id: string, data: any) {
    const db = this.checkDatabase();
    return await db.supplier.update({
      where: { id },
      data,
    });
  }

  static async deleteSupplier(id: string) {
    const db = this.checkDatabase();
    return await db.supplier.delete({
      where: { id },
    });
  }

  static async getAllSuppliers() {
    const db = this.checkDatabase();
    return await db.supplier.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        materials: true,
      },
    });
  }

  // Material operations
  static async createMaterial(materialData: any) {
    const db = this.checkDatabase();
    return await db.material.create({
      data: materialData,
    });
  }

  static async getMaterialById(id: string) {
    const db = this.checkDatabase();
    return await db.material.findUnique({
      where: { id },
      include: {
        supplier: true,
      },
    });
  }

  static async updateMaterial(id: string, data: any) {
    const db = this.checkDatabase();
    return await db.material.update({
      where: { id },
      data,
    });
  }

  static async deleteMaterial(id: string) {
    const db = this.checkDatabase();
    return await db.material.delete({
      where: { id },
    });
  }

  static async getAllMaterials() {
    const db = this.checkDatabase();
    return await db.material.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        supplier: true,
      },
    });
  }

  // UAE Area operations
  static async createUAEArea(areaData: any) {
    const db = this.checkDatabase();
    return await db.uAEArea.create({
      data: areaData,
    });
  }

  static async getAllUAEAreas() {
    const db = this.checkDatabase();
    return await db.uAEArea.findMany({
      orderBy: { name: 'asc' },
    });
  }

  // Search operations
  static async searchQuotes(query: string) {
    const db = this.checkDatabase();
    return await db.quote.findMany({
      where: {
        OR: [
          { quoteId: { contains: query, mode: 'insensitive' } },
          { product: { contains: query, mode: 'insensitive' } },
          { client: { contactPerson: { contains: query, mode: 'insensitive' } } },
          { client: { companyName: { contains: query, mode: 'insensitive' } } },
        ],
      },
      include: {
        client: true,
        user: true,
        salesPerson: true,
        amounts: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  static async searchClients(query: string) {
    const db = this.checkDatabase();
    return await db.client.findMany({
      where: {
        OR: [
          { contactPerson: { contains: query, mode: 'insensitive' } },
          { companyName: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } },
          { phone: { contains: query, mode: 'insensitive' } },
        ],
      },
      include: {
        user: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  static async searchSuppliers(query: string) {
    const db = this.checkDatabase();
    return await db.supplier.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { contact: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } },
        ],
      },
      include: {
        materials: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  static async searchSalesPersons(query: string) {
    const db = this.checkDatabase();
    return await db.salesPerson.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } },
          { salesPersonId: { contains: query, mode: 'insensitive' } },
        ],
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  // QuoteAmount operations
  static async createQuoteAmount(amountData: {
    quoteId: string;
    base: number;
    vat: number;
    total: number;
  }) {
    const db = this.checkDatabase();
    return await db.quoteAmount.create({
      data: amountData,
    });
  }

  static async getQuoteAmounts(quoteId: string) {
    const db = this.checkDatabase();
    return await db.quoteAmount.findMany({
      where: { quoteId },
    });
  }

  static async updateQuoteAmount(id: string, amountData: {
    base?: number;
    vat?: number;
    total?: number;
  }) {
    const db = this.checkDatabase();
    return await db.quoteAmount.update({
      where: { id },
      data: amountData,
    });
  }

  static async deleteQuoteAmount(id: string) {
    const db = this.checkDatabase();
    return await db.quoteAmount.delete({
      where: { id },
    });
  }

  // Amount calculation logic
  static async calculateQuoteAmounts(quoteId: string) {
    const db = this.checkDatabase();
    
    try {
      // Get the quote with all related data
      const quote = await db.quote.findUnique({
        where: { id: quoteId },
        include: {
          papers: true,
          finishing: true,
          operational: true,
        },
      });

      if (!quote) {
        throw new Error('Quote not found');
      }

      let baseAmount = 0;
      let vatAmount = 0;
      let totalAmount = 0;

      // Calculate base amount from papers
      if (quote.papers && quote.papers.length > 0) {
        for (const paper of quote.papers) {
          if (paper.pricePerSheet && paper.enteredSheets) {
            baseAmount += paper.pricePerSheet * paper.enteredSheets;
          }
        }
      }

      // Add finishing costs
      if (quote.finishing && quote.finishing.length > 0) {
        for (const finish of quote.finishing) {
          if (finish.cost) {
            baseAmount += finish.cost;
          }
        }
      }

      // Add operational costs (if any) - commented out for now
      // if (quote.operational && quote.operational.length > 0) {
      //   for (const op of quote.operational) {
      //     // Add any operational costs here if needed
      //   }
      // }

      // Calculate VAT (5% for UAE)
      vatAmount = baseAmount * 0.05;
      
      // Calculate total
      totalAmount = baseAmount + vatAmount;

      // Check if QuoteAmount record already exists
      const existingAmount = await db.quoteAmount.findFirst({
        where: { quoteId },
      });

      if (existingAmount) {
        // Update existing record
        await this.updateQuoteAmount(existingAmount.id, {
          base: baseAmount,
          vat: vatAmount,
          total: totalAmount,
        });
      } else {
        // Create new record
        await this.createQuoteAmount({
          quoteId,
          base: baseAmount,
          vat: vatAmount,
          total: totalAmount,
        });
      }

      return {
        base: baseAmount,
        vat: vatAmount,
        total: totalAmount,
      };
    } catch (error) {
      console.error('Error calculating quote amounts:', error);
      throw error;
    }
  }

  // System metrics
  static async getSystemMetrics() {
    const db = this.checkDatabase();
    
    try {
      const [
        totalUsers,
        totalClients,
        totalQuotes,
        totalSuppliers,
        totalMaterials,
        totalSalesPersons,
        totalUAEAreas
      ] = await Promise.all([
        db.user.count(),
        db.client.count(),
        db.quote.count(),
        db.supplier.count(),
        db.material.count(),
        db.salesPerson.count(),
        db.uAEArea.count(),
      ]);

      return {
        totalUsers,
        totalClients,
        totalQuotes,
        totalSuppliers,
        totalMaterials,
        totalSalesPersons,
        totalUAEAreas,
        timestamp: new Date().toISOString(),
        ...this.getDatabaseInfo()
      };
    } catch (error) {
      console.error('Error getting system metrics:', error);
      return {
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
        ...this.getDatabaseInfo()
      };
    }
  }
}

// Export the main prisma instance
export { prisma as default };
