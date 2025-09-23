import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Create Prisma client with PostgreSQL configuration only
export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  datasources: {
    db: {
      // Use DATABASE_URL for PostgreSQL/Prisma Accelerate only
      url: process.env.DATABASE_URL,
    },
  },
})

// Only create one instance in production
if (process.env.NODE_ENV === 'production') globalForPrisma.prisma = prisma

// Database service class with PostgreSQL interface only
export class DatabaseService {
  private prisma: PrismaClient

  constructor() {
    this.prisma = prisma
    console.log('DatabaseService initialized with PostgreSQL only')
  }

  // Database health check
  async checkHealth() {
    try {
      await this.prisma.$queryRaw`SELECT 1`
      return { status: 'healthy', timestamp: new Date().toISOString() }
    } catch (error) {
      return { 
        status: 'unhealthy', 
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString() 
      }
    }
  }

  // Get database info
  async getDatabaseInfo() {
    try {
      // PostgreSQL only
      const result = await this.prisma.$queryRaw`SELECT version() as version`
      return { 
        status: 'connected', 
        info: result,
        database: 'PostgreSQL',
        timestamp: new Date().toISOString() 
      }
    } catch (error) {
      return { 
        status: 'error', 
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString() 
      }
    }
  }

  // Get Prisma client
  getClient() {
    return this.prisma
  }

  // ===== USER OPERATIONS =====
  async getAllUsers() {
    try {
      return await this.prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  }

  async getUserByEmail(email: string) {
    try {
      return await this.prisma.user.findUnique({
        where: { email },
      });
    } catch (error) {
      console.error('Error fetching user by email:', error);
      throw error;
    }
  }

  async getUserById(id: string) {
    try {
      return await this.prisma.user.findUnique({
        where: { id },
        include: {
          quotes: true,
          clients: true,
        },
      });
    } catch (error) {
      console.error('Error fetching user by ID:', error);
      throw error;
    }
  }

  async createUser(userData: {
    email: string;
    name: string;
    role?: string;
    profilePicture?: string;
    password?: string;
    status?: string;
  }) {
    try {
      return await this.prisma.user.create({
        data: userData,
      });
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  async updateUser(id: string, data: any) {
    try {
      return await this.prisma.user.update({
        where: { id },
        data,
      });
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  async deleteUser(id: string) {
    try {
      return await this.prisma.user.delete({
        where: { id },
      });
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }

  // ===== SALES PERSON OPERATIONS =====
  async getAllSalesPersons() {
    try {
      return await this.prisma.salesPerson.findMany({
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      console.error('Error fetching sales persons:', error);
      throw error;
    }
  }

  async getSalesPersonById(id: string) {
    try {
      return await this.prisma.salesPerson.findUnique({
        where: { id },
      });
    } catch (error) {
      console.error('Error fetching sales person by ID:', error);
      throw error;
    }
  }

  async getSalesPersonBySalesPersonId(salesPersonId: string) {
    try {
      return await this.prisma.salesPerson.findUnique({
        where: { salesPersonId },
      });
    } catch (error) {
      console.error('Error fetching sales person by sales person ID:', error);
      throw error;
    }
  }

  async createSalesPerson(salesPersonData: any) {
    try {
      // Auto-generate salesPersonId if not provided
      if (!salesPersonData.salesPersonId) {
        const allSalesPersons = await this.getAllSalesPersons();
        const nextId = allSalesPersons.length + 1;
        salesPersonData.salesPersonId = `SL-${nextId.toString().padStart(3, '0')}`;
        console.log('Auto-generated salesPersonId:', salesPersonData.salesPersonId);
      }
      
      return await this.prisma.salesPerson.create({
        data: salesPersonData,
      });
    } catch (error) {
      console.error('Error creating sales person:', error);
      throw error;
    }
  }

  async updateSalesPerson(id: string, data: any) {
    try {
      return await this.prisma.salesPerson.update({
        where: { id },
        data,
      });
    } catch (error) {
      console.error('Error updating sales person:', error);
      throw error;
    }
  }

  async deleteSalesPerson(id: string) {
    try {
      return await this.prisma.salesPerson.delete({
        where: { id },
      });
    } catch (error) {
      console.error('Error deleting sales person:', error);
      throw error;
    }
  }

  // ===== CLIENT OPERATIONS =====
  async getAllClients() {
    try {
      return await this.prisma.client.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          user: true,
        },
      });
    } catch (error) {
      console.error('Error fetching clients:', error);
      throw error;
    }
  }

  async getClientById(id: string) {
    try {
      return await this.prisma.client.findUnique({
        where: { id },
        include: {
          user: true,
          quotes: true,
        },
      });
    } catch (error) {
      console.error('Error fetching client by ID:', error);
      throw error;
    }
  }

  async createClient(clientData: any) {
    try {
      return await this.prisma.client.create({
        data: clientData,
      });
    } catch (error) {
      console.error('Error creating client:', error);
      throw error;
    }
  }

  async updateClient(id: string, data: any) {
    try {
      return await this.prisma.client.update({
        where: { id },
        data,
      });
    } catch (error) {
      console.error('Error updating client:', error);
      throw error;
    }
  }

  async deleteClient(id: string) {
    try {
      return await this.prisma.client.delete({
        where: { id },
      });
    } catch (error) {
      console.error('Error deleting client:', error);
      throw error;
    }
  }

  // ===== QUOTE OPERATIONS =====
  async getAllQuotes() {
    try {
      return await this.prisma.quote.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          client: true,
          user: true,
          amounts: true,
          papers: true,
          finishing: true,
          operational: true,
        },
      });
    } catch (error) {
      console.error('Error fetching quotes:', error);
      throw error;
    }
  }

  async getQuoteById(id: string) {
    try {
      return await this.prisma.quote.findUnique({
        where: { id },
        include: {
          client: true,
          user: true,
          finishing: true,
          papers: true,
          amounts: true,
          operational: true,
        },
      });
    } catch (error) {
      console.error('Error fetching quote by ID:', error);
      throw error;
    }
  }

  async createQuote(quoteData: any) {
    try {
      return await this.prisma.quote.create({
        data: quoteData,
        include: {
          client: true,
          user: true,
        },
      });
    } catch (error) {
      console.error('Error creating quote:', error);
      throw error;
    }
  }

  async updateQuote(id: string, data: any) {
    try {
      return await this.prisma.quote.update({
        where: { id },
        data,
        include: {
          client: true,
          user: true,
        },
      });
    } catch (error) {
      console.error('Error updating quote:', error);
      throw error;
    }
  }

  async updateQuoteStatus(id: string, status: string) {
    try {
      return await this.prisma.quote.update({
        where: { id },
        data: {
          status,
          updatedAt: new Date()
        },
        include: {
          client: true,
          user: true,
        },
      });
    } catch (error) {
      console.error('Error updating quote status:', error);
      throw error;
    }
  }

  async updateQuoteWithDetails(id: string, data: any) {
    try {
      return await this.prisma.quote.update({
        where: { id },
        data: {
          ...data,
          updatedAt: new Date()
        },
        include: {
          client: true,
          user: true,
          papers: true,
          finishing: true,
          amounts: true,
          operational: true
        },
      });
    } catch (error) {
      console.error('Error updating quote with details:', error);
      throw error;
    }
  }

  async deleteQuote(id: string) {
    try {
      return await this.prisma.quote.delete({
        where: { id },
      });
    } catch (error) {
      console.error('Error deleting quote:', error);
      throw error;
    }
  }

  // ===== SUPPLIER OPERATIONS =====
  async getAllSuppliers() {
    try {
      return await this.prisma.supplier.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          materials: true,
        },
      });
    } catch (error) {
      console.error('Error fetching suppliers:', error);
      throw error;
    }
  }

  async getSupplierById(id: string) {
    try {
      return await this.prisma.supplier.findUnique({
        where: { id },
        include: {
          materials: true,
        },
      });
    } catch (error) {
      console.error('Error fetching supplier by ID:', error);
      throw error;
    }
  }

  async createSupplier(supplierData: any) {
    try {
      return await this.prisma.supplier.create({
        data: supplierData,
      });
    } catch (error) {
      console.error('Error creating supplier:', error);
      throw error;
    }
  }

  async updateSupplier(id: string, data: any) {
    try {
      return await this.prisma.supplier.update({
        where: { id },
        data,
      });
    } catch (error) {
      console.error('Error updating supplier:', error);
      throw error;
    }
  }

  async deleteSupplier(id: string) {
    try {
      return await this.prisma.supplier.delete({
        where: { id },
      });
    } catch (error) {
      console.error('Error deleting supplier:', error);
      throw error;
    }
  }

  // ===== MATERIAL OPERATIONS =====
  async getAllMaterials() {
    try {
      return await this.prisma.material.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          supplier: true,
        },
      });
    } catch (error) {
      console.error('Error fetching materials:', error);
      throw error;
    }
  }

  async getMaterialById(id: string) {
    try {
      return await this.prisma.material.findUnique({
        where: { id },
        include: {
          supplier: true,
        },
      });
    } catch (error) {
      console.error('Error fetching material by ID:', error);
      throw error;
    }
  }

  async createMaterial(materialData: any) {
    try {
      return await this.prisma.material.create({
        data: materialData,
      });
    } catch (error) {
      console.error('Error creating material:', error);
      throw error;
    }
  }

  async updateMaterial(id: string, data: any) {
    try {
      return await this.prisma.material.update({
        where: { id },
        data,
      });
    } catch (error) {
      console.error('Error updating material:', error);
      throw error;
    }
  }

  async deleteMaterial(id: string) {
    try {
      return await this.prisma.material.delete({
        where: { id },
      });
    } catch (error) {
      console.error('Error deleting material:', error);
      throw error;
    }
  }

  // ===== PAPER OPERATIONS =====
  async getAllPapers() {
    try {
      return await this.prisma.paper.findMany({
        orderBy: { id: 'desc' },
        include: {
          quote: true,
        },
      });
    } catch (error) {
      console.error('Error fetching papers:', error);
      throw error;
    }
  }

  async getPaperById(id: string) {
    try {
      return await this.prisma.paper.findUnique({
        where: { id },
        include: {
          quote: true,
        },
      });
    } catch (error) {
      console.error('Error fetching paper by ID:', error);
      throw error;
    }
  }

  async createPaper(paperData: any) {
    try {
      return await this.prisma.paper.create({
        data: paperData,
      });
    } catch (error) {
      console.error('Error creating paper:', error);
      throw error;
    }
  }

  async updatePaper(id: string, data: any) {
    try {
      return await this.prisma.paper.update({
        where: { id },
        data,
      });
    } catch (error) {
      console.error('Error updating paper:', error);
      throw error;
    }
  }

  async deletePaper(id: string) {
    try {
      return await this.prisma.paper.delete({
        where: { id },
      });
    } catch (error) {
      console.error('Error deleting paper:', error);
      throw error;
    }
  }

  // ===== FINISHING OPERATIONS =====
  async getAllFinishings() {
    try {
      return await this.prisma.finishing.findMany({
        orderBy: { id: 'desc' },
        include: {
          quote: true,
        },
      });
    } catch (error) {
      console.error('Error fetching finishings:', error);
      throw error;
    }
  }

  async getFinishingById(id: string) {
    try {
      return await this.prisma.finishing.findUnique({
        where: { id },
        include: {
          quote: true,
        },
      });
    } catch (error) {
      console.error('Error fetching finishing by ID:', error);
      throw error;
    }
  }

  async createFinishing(finishingData: any) {
    try {
      return await this.prisma.finishing.create({
        data: finishingData,
      });
    } catch (error) {
      console.error('Error creating finishing:', error);
      throw error;
    }
  }

  async updateFinishing(id: string, data: any) {
    try {
      return await this.prisma.finishing.update({
        where: { id },
        data,
      });
    } catch (error) {
      console.error('Error updating finishing:', error);
      throw error;
    }
  }

  async deleteFinishing(id: string) {
    try {
      return await this.prisma.finishing.delete({
        where: { id },
      });
    } catch (error) {
      console.error('Error deleting finishing:', error);
      throw error;
    }
  }

  // ===== QUOTE AMOUNT OPERATIONS =====
  async getQuoteAmountByQuoteId(quoteId: string) {
    try {
      return await this.prisma.quoteAmount.findUnique({
        where: { quoteId },
        include: {
          quote: true,
        },
      });
    } catch (error) {
      console.error('Error fetching quote amount:', error);
      throw error;
    }
  }

  async createQuoteAmount(amountData: any) {
    try {
      return await this.prisma.quoteAmount.create({
        data: amountData,
      });
    } catch (error) {
      console.error('Error creating quote amount:', error);
      throw error;
    }
  }

  async updateQuoteAmount(quoteId: string, data: any) {
    try {
      return await this.prisma.quoteAmount.update({
        where: { quoteId },
        data,
      });
    } catch (error) {
      console.error('Error updating quote amount:', error);
      throw error;
    }
  }

  async deleteQuoteAmount(quoteId: string) {
    try {
      return await this.prisma.quoteAmount.delete({
        where: { quoteId },
      });
    } catch (error) {
      console.error('Error deleting quote amount:', error);
      throw error;
    }
  }

  // ===== QUOTE OPERATIONAL OPERATIONS =====
  async getQuoteOperationalByQuoteId(quoteId: string) {
    try {
      return await this.prisma.quoteOperational.findUnique({
        where: { quoteId },
        include: {
          quote: true,
        },
      });
    } catch (error) {
      console.error('Error fetching quote operational:', error);
      throw error;
    }
  }

  async createQuoteOperational(operationalData: any) {
    try {
      return await this.prisma.quoteOperational.create({
        data: operationalData,
      });
    } catch (error) {
      console.error('Error creating quote operational:', error);
      throw error;
    }
  }

  async updateQuoteOperational(quoteId: string, data: any) {
    try {
      return await this.prisma.quoteOperational.update({
        where: { quoteId },
        data,
      });
    } catch (error) {
      console.error('Error updating quote operational:', error);
      throw error;
    }
  }

  async deleteQuoteOperational(quoteId: string) {
    try {
      return await this.prisma.quoteOperational.delete({
        where: { quoteId },
      });
    } catch (error) {
      console.error('Error deleting quote operational:', error);
      throw error;
    }
  }

  // ===== UAE AREA OPERATIONS =====
  async getAllUAEAreas() {
    try {
      return await this.prisma.uAEArea.findMany({
        orderBy: { name: 'asc' },
      });
    } catch (error) {
      console.error('Error fetching UAE areas:', error);
      throw error;
    }
  }

  async getUAEAreaById(id: string) {
    try {
      return await this.prisma.uAEArea.findUnique({
        where: { id },
      });
    } catch (error) {
      console.error('Error fetching UAE area by ID:', error);
      throw error;
    }
  }

  async createUAEArea(areaData: any) {
    try {
      return await this.prisma.uAEArea.create({
        data: areaData,
      });
    } catch (error) {
      console.error('Error creating UAE area:', error);
      throw error;
    }
  }

  async updateUAEArea(id: string, data: any) {
    try {
      return await this.prisma.uAEArea.update({
        where: { id },
        data,
      });
    } catch (error) {
      console.error('Error updating UAE area:', error);
      throw error;
    }
  }

  async deleteUAEArea(id: string) {
    try {
      return await this.prisma.uAEArea.delete({
        where: { id },
      });
    } catch (error) {
      console.error('Error deleting UAE area:', error);
      throw error;
    }
  }

  // ===== SEARCH HISTORY OPERATIONS =====
  async getAllSearchHistory(userId?: string) {
    try {
      return await this.prisma.searchHistory.findMany({
        where: userId ? { userId } : {},
        orderBy: { timestamp: 'desc' },
        include: {
          user: true,
        },
      });
    } catch (error) {
      console.error('Error fetching search history:', error);
      throw error;
    }
  }

  async createSearchHistory(searchData: any) {
    try {
      return await this.prisma.searchHistory.create({
        data: searchData,
      });
    } catch (error) {
      console.error('Error creating search history:', error);
      throw error;
    }
  }

  async deleteSearchHistory(id: string) {
    try {
      return await this.prisma.searchHistory.delete({
        where: { id },
      });
    } catch (error) {
      console.error('Error deleting search history:', error);
      throw error;
    }
  }

  // ===== SEARCH ANALYTICS OPERATIONS =====
  async getAllSearchAnalytics(userId?: string) {
    try {
      return await this.prisma.searchAnalytics.findMany({
        where: userId ? { userId } : {},
        orderBy: { timestamp: 'desc' },
        include: {
          user: true,
        },
      });
    } catch (error) {
      console.error('Error fetching search analytics:', error);
      throw error;
    }
  }

  async createSearchAnalytics(analyticsData: any) {
    try {
      return await this.prisma.searchAnalytics.create({
        data: analyticsData,
      });
    } catch (error) {
      console.error('Error creating search analytics:', error);
      throw error;
    }
  }

  async deleteSearchAnalytics(id: string) {
    try {
      return await this.prisma.searchAnalytics.delete({
        where: { id },
      });
    } catch (error) {
      console.error('Error deleting search analytics:', error);
      throw error;
    }
  }

  // ===== SEARCH OPERATIONS =====
  async searchQuotes(query: string) {
    try {
      return await this.prisma.quote.findMany({
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
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });
    } catch (error) {
      console.error('Error searching quotes:', error);
      throw error;
    }
  }

  async searchClients(query: string) {
    try {
      return await this.prisma.client.findMany({
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
    } catch (error) {
      console.error('Error searching clients:', error);
      throw error;
    }
  }

  async searchSuppliers(query: string) {
    try {
      return await this.prisma.supplier.findMany({
        where: {
          OR: [
            { name: { contains: query } },
            { email: { contains: query } },
            { phone: { contains: query } },
          ],
        },
        include: {
          materials: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });
    } catch (error) {
      console.error('Error searching suppliers:', error);
      throw error;
    }
  }

  async searchMaterials(query: string) {
    try {
      return await this.prisma.material.findMany({
        where: {
          OR: [
            { name: { contains: query } },
            { materialId: { contains: query } },
          ],
        },
        include: {
          supplier: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });
    } catch (error) {
      console.error('Error searching materials:', error);
      throw error;
    }
  }

  // ===== DASHBOARD OPERATIONS =====
  async getDashboardCounts() {
    try {
      const [quotes, clients, users, suppliers, materials] = await Promise.all([
        this.prisma.quote.count(),
        this.prisma.client.count(),
        this.prisma.user.count(),
        this.prisma.supplier.count(),
        this.prisma.material.count(),
      ]);

      return {
        quotes,
        clients,
        users,
        suppliers,
        materials,
      };
    } catch (error) {
      console.error('Error getting dashboard counts:', error);
      throw error;
    }
  }

  async getRecentQuotes(limit: number = 10) {
    try {
      return await this.prisma.quote.findMany({
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          client: {
            select: {
              id: true,
              contactPerson: true,
              companyName: true,
              email: true,
            },
          },
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });
    } catch (error) {
      console.error('Error getting recent quotes:', error);
      throw error;
    }
  }

  // ===== SYSTEM METRICS =====
  async getSystemMetrics() {
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
        this.prisma.user.count(),
        this.prisma.client.count(),
        this.prisma.quote.count(),
        this.prisma.supplier.count(),
        this.prisma.material.count(),
        this.prisma.salesPerson.count(),
        this.prisma.uAEArea.count(),
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
        database: 'PostgreSQL',
        environment: process.env.NODE_ENV || 'development'
      };
    } catch (error) {
      console.error('Error getting system metrics:', error);
      throw error;
    }
  }
}

export default prisma
