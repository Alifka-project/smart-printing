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
      url: process.env.DATABASE_URL || 'file:./prisma/dev.db',
    },
  },
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
        amounts: true,
        // operational: true, // Removed due to linter errors
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
        amounts: true,
        // operational: true, // Removed due to linter errors
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
        amounts: true,
        QuoteOperational: true,
      },
    });
  }

  // Sales Person operations - using raw queries for now since the model might not be in schema yet
  static async createSalesPerson(salesPersonData: any) {
    const db = this.checkDatabase();
    // Use raw SQL for now
    const result = await db.$executeRaw`
      INSERT INTO "SalesPerson" (
        id, "salesPersonId", name, email, phone, "countryCode", 
        designation, department, "hireDate", status, "profilePicture",
        address, city, state, "postalCode", country, notes,
        "createdAt", "updatedAt"
      ) VALUES (
        ${salesPersonData.id || 'cuid()'}, ${salesPersonData.salesPersonId}, 
        ${salesPersonData.name}, ${salesPersonData.email}, ${salesPersonData.phone},
        ${salesPersonData.countryCode || '+971'}, ${salesPersonData.designation || 'Sales Representative'},
        ${salesPersonData.department || 'Sales'}, ${salesPersonData.hireDate || new Date()},
        ${salesPersonData.status || 'Active'}, ${salesPersonData.profilePicture || null},
        ${salesPersonData.address || null}, ${salesPersonData.city || 'Dubai'},
        ${salesPersonData.state || 'Dubai'}, ${salesPersonData.postalCode || null},
        ${salesPersonData.country || 'UAE'}, ${salesPersonData.notes || null},
        ${new Date()}, ${new Date()}
      )
    `;
    return result;
  }

  static async getSalesPersonById(id: string) {
    const db = this.checkDatabase();
    const result = await db.$queryRaw`SELECT * FROM "SalesPerson" WHERE id = ${id}`;
    return Array.isArray(result) ? result[0] : result;
  }

  static async getSalesPersonBySalesPersonId(salesPersonId: string) {
    const db = this.checkDatabase();
    const result = await db.$queryRaw`SELECT * FROM "SalesPerson" WHERE "salesPersonId" = ${salesPersonId}`;
    return Array.isArray(result) ? result[0] : result;
  }

  static async updateSalesPerson(id: string, data: any) {
    const db = this.checkDatabase();
    const result = await db.$executeRaw`
      UPDATE "SalesPerson" 
      SET name = ${data.name}, email = ${data.email}, phone = ${data.phone},
          "countryCode" = ${data.countryCode || '+971'}, designation = ${data.designation || 'Sales Representative'},
          department = ${data.department || 'Sales'}, status = ${data.status || 'Active'},
          "profilePicture" = ${data.profilePicture || null}, address = ${data.address || null},
          city = ${data.city || 'Dubai'}, state = ${data.state || 'Dubai'},
          "postalCode" = ${data.postalCode || null}, country = ${data.country || 'UAE'},
          notes = ${data.notes || null}, "updatedAt" = ${new Date()}
      WHERE id = ${id}
    `;
    return result;
  }

  static async deleteSalesPerson(id: string) {
    const db = this.checkDatabase();
    const result = await db.$executeRaw`DELETE FROM "SalesPerson" WHERE id = ${id}`;
    return result;
  }

  static async getAllSalesPersons() {
    const db = this.checkDatabase();
    const result = await db.$queryRaw`SELECT * FROM "SalesPerson" ORDER BY "createdAt" DESC`;
    return Array.isArray(result) ? result : [];
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

  // UAE Area operations - using raw queries for now
  static async createUAEArea(areaData: any) {
    const db = this.checkDatabase();
    const result = await db.$executeRaw`
      INSERT INTO "UAEArea" (id, name, state, country, "createdAt", "updatedAt")
      VALUES (${areaData.id || 'cuid()'}, ${areaData.name}, ${areaData.state}, 
              ${areaData.country || 'UAE'}, ${new Date()}, ${new Date()})
    `;
    return result;
  }

  static async getAllUAEAreas() {
    const db = this.checkDatabase();
    const result = await db.$queryRaw`SELECT * FROM "UAEArea" ORDER BY name ASC`;
    return Array.isArray(result) ? result : [];
  }

  // Search operations
  static async searchQuotes(query: string) {
    const db = this.checkDatabase();
    return await db.quote.findMany({
      where: {
        OR: [
          { quoteId: { contains: query } },
          { product: { contains: query } },
          { client: { contactPerson: { contains: query } } },
          { client: { companyName: { contains: query } } },
        ],
      },
      include: {
        client: true,
        user: true,
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
          { contactPerson: { contains: query } },
          { companyName: { contains: query } },
          { email: { contains: query } },
          { phone: { contains: query } },
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
          { name: { contains: query } },
          { contact: { contains: query } },
          { email: { contains: query } },
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
    const result = await db.$queryRaw`
      SELECT * FROM "SalesPerson" 
      WHERE name ILIKE ${`%${query}%`} 
         OR email ILIKE ${`%${query}%`} 
         OR "salesPersonId" ILIKE ${`%${query}%`}
      ORDER BY "createdAt" DESC 
      LIMIT 50
    `;
    return Array.isArray(result) ? result : [];
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
        totalMaterials
      ] = await Promise.all([
        db.user.count(),
        db.client.count(),
        db.quote.count(),
        db.supplier.count(),
        db.material.count(),
      ]);

      // Get sales person and UAE area counts using raw queries
      const salesPersonResult = await db.$queryRaw`SELECT COUNT(*) as count FROM "SalesPerson"`;
      const uaeAreaResult = await db.$queryRaw`SELECT COUNT(*) as count FROM "UAEArea"`;
      
      const totalSalesPersons = Array.isArray(salesPersonResult) ? salesPersonResult[0]?.count || 0 : 0;
      const totalUAEAreas = Array.isArray(uaeAreaResult) ? uaeAreaResult[0]?.count || 0 : 0;

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

// Export the main prisma instance and DatabaseService
export { prisma as default };
