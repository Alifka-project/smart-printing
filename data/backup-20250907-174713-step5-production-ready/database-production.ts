import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Production Prisma client for Vercel
export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: ['error'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

// Only create one instance
if (process.env.NODE_ENV === 'production') globalForPrisma.prisma = prisma;

// Production Database Service Class
export class DatabaseService {
  private prisma: PrismaClient

  constructor() {
    this.prisma = prisma
    console.log('Production DatabaseService initialized with PostgreSQL')
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
      const result = await this.prisma.$queryRaw`SELECT version() as version`
      return { 
        status: 'connected', 
        info: result,
        database: 'Vercel PostgreSQL',
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
          clients: true,
          quotes: true,
        },
      });
    } catch (error) {
      console.error('Error fetching user by ID:', error);
      throw error;
    }
  }

  async createUser(userData: any) {
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

  // ===== CLIENT OPERATIONS =====
  async getAllClients() {
    try {
      return await this.prisma.client.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          user: true,
          quotes: true,
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
      console.log('Creating client with data:', JSON.stringify(clientData, null, 2))
      
      // Validate required fields before creation
      const requiredFields = ['clientType', 'contactPerson', 'email', 'phone', 'countryCode']
      for (const field of requiredFields) {
        if (!clientData[field]) {
          throw new Error(`Missing required field: ${field}`)
        }
      }
      
      // Ensure only valid fields are sent to the production database
      const validClientData = {
        clientType: clientData.clientType,
        companyName: clientData.companyName || null,
        contactPerson: clientData.contactPerson,
        email: clientData.email,
        phone: clientData.phone,
        countryCode: clientData.countryCode,
        role: clientData.role || null,
        status: clientData.status || 'Active',
        userId: clientData.userId || null,
        address: clientData.address || null,
        city: clientData.city || null,
        state: clientData.state || null,
        postalCode: clientData.postalCode || null,
        country: clientData.country || null
      }
      
      console.log('Validated client data for production:', JSON.stringify(validClientData, null, 2))
      
      const client = await this.prisma.client.create({
        data: validClientData,
      });
      
      console.log('Client created successfully:', client.id)
      return client;
    } catch (error) {
      console.error('Error creating client:', error);
      console.error('Client data that failed:', JSON.stringify(clientData, null, 2));
      
      // Provide more specific error information
      if (error instanceof Error) {
        throw new Error(`Client creation failed: ${error.message}`);
      }
      throw new Error('Client creation failed with unknown error');
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
      const quotes = await this.prisma.quote.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          client: true,
          user: true,
          amounts: true,
          papers: true,
          finishing: true,
        },
      });
      
      // Add operational field for frontend compatibility
      return quotes.map(quote => ({
        ...quote,
        operational: null // Will be populated when needed
      }));
    } catch (error) {
      console.error('Error fetching quotes:', error);
      throw error;
    }
  }

  async getQuoteById(id: string) {
    try {
      const quote = await this.prisma.quote.findUnique({
        where: { id },
        include: {
          client: true,
          user: true,
          finishing: true,
          papers: true,
          amounts: true,
        },
      });
      
      if (quote) {
        // Add operational field for frontend compatibility
        return {
          ...quote,
          operational: null // Will be populated when needed
        };
      }
      
      return quote;
    } catch (error) {
      console.error('Error fetching quote by ID:', error);
      throw error;
    }
  }

  async createQuote(quoteData: any) {
    try {
      console.log('Creating quote with data:', JSON.stringify(quoteData, null, 2));
      
      // Extract nested data that needs to be created separately
      const { papers, finishing, amounts, operational, ...mainQuoteData } = quoteData;
      
      // Create the main quote first
      const quote = await this.prisma.quote.create({
        data: mainQuoteData,
        include: {
          client: true,
          user: true,
        },
      });
      
      console.log('Main quote created successfully:', quote.id);
      
      // Create papers if provided
      if (papers && Array.isArray(papers) && papers.length > 0) {
        console.log('Creating papers for quote:', papers.length);
        for (const paper of papers) {
          await this.prisma.paper.create({
            data: {
              ...paper,
              quoteId: quote.id
            }
          });
        }
        console.log('Papers created successfully');
      }
      
      // Create finishing if provided
      if (finishing && Array.isArray(finishing) && finishing.length > 0) {
        console.log('Creating finishing for quote:', finishing.length);
        for (const finish of finishing) {
          await this.prisma.finishing.create({
            data: {
              ...finish,
              quoteId: quote.id
            }
          });
        }
        console.log('Finishing created successfully');
      }
      
      // Create amounts if provided
      if (amounts) {
        console.log('Creating amounts for quote');
        await this.prisma.quoteAmount.create({
          data: {
            ...amounts,
            quoteId: quote.id
          }
        });
        console.log('Amounts created successfully');
      }
      
      // Create operational data if provided
      if (operational) {
        console.log('Creating operational data for quote');
        await this.prisma.quoteOperational.create({
          data: {
            id: quote.id, // Use the quote ID as the operational ID (1:1 relationship)
            plates: operational.plates || 0,
            units: operational.units || 0,
            quoteId: quote.id,
            updatedAt: new Date()
          }
        });
        console.log('Operational data created successfully');
      }
      
      // Fetch the complete quote with all relations
      const completeQuote = await this.prisma.quote.findUnique({
        where: { id: quote.id },
        include: {
          client: true,
          user: true,
          papers: true,
          finishing: true,
          amounts: true,
          QuoteOperational: true
        }
      });
      
      console.log('Quote creation completed successfully with all relations');
      return completeQuote;
      
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
          amounts: true
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

  // ===== QUOTE AMOUNT OPERATIONS =====
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

  async updateQuoteAmount(id: string, data: any) {
    try {
      return await this.prisma.quoteAmount.update({
        where: { id },
        data,
      });
    } catch (error) {
      console.error('Error updating quote amount:', error);
      throw error;
    }
  }

  async deleteQuoteAmount(id: string) {
    try {
      return await this.prisma.quoteAmount.delete({
        where: { id },
      });
    } catch (error) {
      console.error('Error deleting quote amount:', error);
      throw error;
    }
  }

  // ===== QUOTE OPERATIONAL OPERATIONS =====
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

  async updateQuoteOperational(id: string, data: any) {
    try {
      return await this.prisma.quoteOperational.update({
        where: { id },
        data,
      });
    } catch (error) {
      console.error('Error updating quote operational:', error);
      throw error;
    }
  }

  async deleteQuoteOperational(id: string) {
    try {
      return await this.prisma.quoteOperational.delete({
        where: { id },
      });
    } catch (error) {
      console.error('Error deleting quote operational:', error);
      throw error;
    }
  }

  // ===== PAPER OPERATIONS =====
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
}

// Database connection health check
export async function checkDatabaseConnection() {
  if (!process.env.DATABASE_URL) {
    return { 
      status: 'failed', 
      error: 'DATABASE_URL not configured',
      timestamp: new Date().toISOString() 
    };
  }
  
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { 
      status: 'connected', 
      timestamp: new Date().toISOString(),
      database: 'Vercel PostgreSQL'
    };
  } catch (error) {
    console.error('Database connection failed:', error);
    return { 
      status: 'failed', 
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString() 
    };
  }
}

// Graceful shutdown
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

export default prisma;
