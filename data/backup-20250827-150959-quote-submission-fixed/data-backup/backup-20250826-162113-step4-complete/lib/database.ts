import { PrismaClient } from '@prisma/client';
import cuid from 'cuid';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// Database service class
export class DatabaseService {
  // Helper method to check if database is available
  private static checkDatabase() {
    if (!prisma) {
      throw new Error('Database not available - DATABASE_URL not configured');
    }
    return prisma;
  }

  // User operations
  static async createUser(userData: {
    email: string;
    name: string;
    role?: string;
    profilePicture?: string;
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
    emails?: string; // JSON array of emails
    phone: string;
    countryCode: string;
    role?: string;
    trn?: string;
    hasNoTrn?: boolean;
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
      // Use raw SQL with proper CUID generation
      const clientId = cuid();
      const result = await db.$executeRaw`
        INSERT INTO "Client" (
          id, "clientType", "companyName", "firstName", "lastName", "designation", 
          "contactPerson", email, emails, phone, "countryCode", role, trn, "hasNoTrn",
          address, city, area, state, "postalCode", country, "userId", 
          "createdAt", "updatedAt", status
        ) VALUES (
          ${clientId},
          ${clientData.clientType},
          ${clientData.companyName || ''},
          ${clientData.firstName || ''},
          ${clientData.lastName || ''},
          ${clientData.designation || ''},
          ${clientData.contactPerson},
          ${clientData.email},
          ${clientData.emails || JSON.stringify([clientData.email])},
          ${clientData.phone || ''},
          ${clientData.countryCode || '+971'},
          ${clientData.role || ''},
          ${clientData.trn || ''},
          ${clientData.hasNoTrn ? 1 : 0},
          ${clientData.address || ''},
          ${clientData.city || ''},
          ${clientData.area || ''},
          ${clientData.state || 'Dubai'},
          ${clientData.postalCode || ''},
          ${clientData.country || 'UAE'},
          ${clientData.userId || null},
          ${new Date()},
          ${new Date()},
          'Active'
        )
      `;
      
      // Get the ID of the newly created client
      const newClient = await db.$queryRaw`
        SELECT * FROM "Client" WHERE id = ${clientId}
      `;
      
      return (newClient as any[])[0];
      
    } catch (error) {
      console.error('Error in createClient:', error);
      throw error;
    }
  }

  static async getClientById(id: string) {
    const db = this.checkDatabase();
    return await db.client.findUnique({
      where: { id },
      include: {
        quotes: true,
        user: true,
      },
    });
  }

  static async getClientByEmail(email: string) {
    const db = this.checkDatabase();
    return await db.client.findFirst({
      where: { email },
      include: {
        quotes: true,
        user: true,
      },
    });
  }

  static async getAllClients() {
    const db = this.checkDatabase();
    try {
      // Use raw SQL to get ALL client data including address fields
      let clients;
      try {
        const rawClients = await db.$queryRaw`
          SELECT 
            id,
            "clientType",
            "companyName",
            "firstName",
            "lastName",
            "designation",
            "contactPerson",
            email,
            emails,
            phone,
            "countryCode",
            role,
            trn,
            "hasNoTrn",
            address,
            city,
            area,
            state,
            "postalCode",
            country,
            status,
            "createdAt",
            "updatedAt",
            "userId"
          FROM "Client"
          ORDER BY "createdAt" DESC
        `;
        
        clients = (rawClients as any[]).map(client => ({
          ...client,
          // Ensure all fields have proper values
          firstName: client.firstName || '',
          lastName: client.lastName || '',
          designation: client.designation || '',
          emails: client.emails || JSON.stringify([client.email]),
          trn: client.trn || '',
          hasNoTrn: client.hasNoTrn === 1,
          address: client.address || '',
          city: client.city || '',
          area: client.area || '',
          state: client.state || 'Dubai',
          postalCode: client.postalCode || '',
          country: client.country || 'UAE',
        }));
        
        console.log('Successfully fetched clients with raw SQL:', clients.length);
      } catch (sqlError: any) {
        console.error('Raw SQL query failed:', sqlError?.message || 'Unknown error');
        throw sqlError;
      }
      
      // Get quote counts for each client
      const clientsWithQuotes = await Promise.all(
        clients.map(async (client) => {
          try {
            const quoteCount = await db.quote.count({
              where: { clientId: client.id }
            });
            
            return {
              ...client,
              _count: { quotes: quoteCount },
              quotes: []
            };
          } catch (quoteError: any) {
            console.log(`Error getting quote count for client ${client.id}:`, quoteError?.message || 'Unknown error');
            return {
              ...client,
              _count: { quotes: 0 },
              quotes: []
            };
          }
        })
      );
      
      return clientsWithQuotes;
      
    } catch (error) {
      console.error('Error in getAllClients:', error);
      // Return empty array instead of throwing to prevent infinite loops
      return [];
    }
  }

  static async updateClient(id: string, data: any) {
    const db = this.checkDatabase();
    
    try {
      // Use raw SQL to update client with all new fields
      const result = await db.$executeRaw`
        UPDATE "Client" 
        SET 
          "clientType" = ${data.clientType},
          "companyName" = ${data.companyName || ''},
          "firstName" = ${data.firstName || ''},
          "lastName" = ${data.lastName || ''},
          "designation" = ${data.designation || ''},
          "contactPerson" = ${data.contactPerson || ''},
          email = ${data.email},
          emails = ${data.emails || JSON.stringify([data.email])},
          phone = ${data.phone || ''},
          "countryCode" = ${data.countryCode || '+971'},
          role = ${data.role || ''},
          trn = ${data.trn || ''},
          "hasNoTrn" = ${data.hasNoTrn ? 1 : 0},
          address = ${data.address || ''},
          city = ${data.city || ''},
          area = ${data.area || ''},
          state = ${data.state || 'Dubai'},
          "postalCode" = ${data.postalCode || ''},
          country = ${data.country || 'UAE'},
          "updatedAt" = ${new Date()}
        WHERE id = ${id}
      `;
      
      // Fetch the updated client to return
      const updatedClient = await db.client.findUnique({
        where: { id },
        select: {
          id: true,
          clientType: true,
          companyName: true,
          firstName: true,
          lastName: true,
          designation: true,
          contactPerson: true,
          email: true,
          emails: true,
          phone: true,
          countryCode: true,
          role: true,
          trn: true,
          hasNoTrn: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          userId: true,
          address: true,
          city: true,
          area: true,
          state: true,
          postalCode: true,
          country: true,
        }
      });
      
      return updatedClient;
      
    } catch (error) {
      console.error('Error in updateClient:', error);
      throw error;
    }
  }

  static async deleteClient(id: string) {
    const db = this.checkDatabase();
    return await db.client.delete({
      where: { id },
    });
  }

  // Quote operations
  static async createQuote(quoteData: {
    quoteId: string;
    date: Date;
    status: string;
    clientId: string;
    userId?: string;
    product: string;
    quantity: number;
    sides: string;
    printing: string;
  }) {
    const db = this.checkDatabase();
    return await db.quote.create({
      data: quoteData,
      include: {
        client: true,
        user: true,
        amounts: true,
      },
    });
  }

  // Create quote with complete details including papers, finishing, amounts, colors, and operational data
  static async createQuoteWithDetails(quoteData: {
    quoteId: string;
    date: Date;
    status: string;
    clientId: string;
    userId?: string;
    product: string;
    quantity: number;
    sides: string;
    printing: string;
    colors?: { front?: string; back?: string };
    
    // New Step 3 fields for product specifications
    productName?: string;
    printingSelection?: string;
    flatSizeWidth?: number;
    flatSizeHeight?: number;
    flatSizeSpine?: number;
    closeSizeWidth?: number;
    closeSizeHeight?: number;
    closeSizeSpine?: number;
    useSameAsFlat?: boolean;
    finishingComments?: string;  // Comments for finishing details (e.g., "gold foil", "silver foil")
    
    papers?: { 
      name: string; 
      gsm: string;
      inputWidth?: number;
      inputHeight?: number;
      pricePerPacket?: number;
      pricePerSheet?: number;
      sheetsPerPacket?: number;
      recommendedSheets?: number;
      enteredSheets?: number;
      outputWidth?: number;
      outputHeight?: number;
      selectedColors?: string[];  // Array of selected color values
    }[];
    finishing?: { name: string; cost?: number }[];
    amounts?: { base: number; vat: number; total: number };
    operational?: { plates?: number; units?: number };
  }) {
    const { papers, finishing, amounts, operational, colors, userId, ...basicQuoteData } = quoteData;
    
    // Only include userId if it's provided and valid
    const quoteDataToCreate: any = {
      ...basicQuoteData,
      colors: colors ? JSON.stringify(colors) : null,
      papers: papers ? {
        create: papers.map(paper => ({
          name: paper.name,
          gsm: paper.gsm,
          inputWidth: paper.inputWidth || null,
          inputHeight: paper.inputHeight || null,
          pricePerPacket: paper.pricePerPacket || null,
          pricePerSheet: paper.pricePerSheet || null,
          sheetsPerPacket: paper.sheetsPerPacket || null,
          recommendedSheets: paper.recommendedSheets || null,
          enteredSheets: paper.enteredSheets || null,
          outputWidth: paper.outputWidth || null,
          outputHeight: paper.outputHeight || null,
          selectedColors: paper.selectedColors ? JSON.stringify(paper.selectedColors) : null,
        }))
      } : undefined,
      finishing: finishing ? {
        create: finishing.map(finish => ({
          name: finish.name,
          cost: finish.cost || null,
        }))
      } : undefined,
      amounts: amounts ? {
        create: amounts
      } : undefined,
      operational: operational ? {
        create: operational
      } : undefined,
    };
    
    // Only add userId if it's provided and not empty
    if (userId && userId.trim() !== '') {
      quoteDataToCreate.userId = userId;
    }
    
    const db = this.checkDatabase();
    return await db.quote.create({
      data: quoteDataToCreate,
              include: {
          client: true,
          user: true,
          papers: true,
          finishing: true,
          amounts: true,
          QuoteOperational: true,
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
        papers: true,
        finishing: true,
        amounts: true,
        QuoteOperational: true,
      },
    });
  }

  static async getQuoteByQuoteId(quoteId: string) {
    const db = this.checkDatabase();
    return await db.quote.findUnique({
      where: { quoteId },
      include: {
        client: true,
        user: true,
        papers: true,
        finishing: true,
        amounts: true,
        QuoteOperational: true,
      },
    });
  }

  static async getAllQuotes() {
    const db = this.checkDatabase();
    try {
      // Use include instead of select to avoid field validation issues
      return await db.quote.findMany({
        include: {
          client: {
            select: {
              id: true,
              companyName: true,
              contactPerson: true,
              email: true,
              firstName: true,
              lastName: true,
              designation: true,
              emails: true,
              trn: true,
              hasNoTrn: true,
              area: true,
              state: true,
              country: true,
            }
          },
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            }
          },
          amounts: true,
          papers: true,
          finishing: true,
        },
        orderBy: { date: 'desc' },
      });
    } catch (error) {
      console.error('Error in getAllQuotes:', error);
      // Return empty array instead of throwing to prevent infinite loops
      return [];
    }
  }

  static async getQuotesByStatus(status: string) {
    const db = this.checkDatabase();
    return await db.quote.findMany({
      where: { status },
      include: {
        client: true,
        user: true,
        papers: true,
        finishing: true,
        amounts: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Get quotes by client ID for autofill functionality
  static async getQuotesByClientId(clientId: string) {
    const db = this.checkDatabase();
    try {
      return await db.quote.findMany({
        where: { clientId },
        include: {
          papers: true,
          finishing: true,
          amounts: true,
          QuoteOperational: true,
        },
        orderBy: { updatedAt: 'desc' }, // Get most recent first
      });
    } catch (error) {
      console.error('Error in getQuotesByClientId:', error);
      return [];
    }
  }

  static async updateQuoteStatus(id: string, status: string) {
    const db = this.checkDatabase();
    return await db.quote.update({
      where: { id },
      data: { status },
      include: {
        client: true,
        user: true,
        papers: true,
        finishing: true,
        amounts: true,
      },
    });
  }

  static async updateQuote(id: string, data: any) {
    try {
      const { amount, clientId, ...quoteData } = data;
      
      console.log('DatabaseService.updateQuote called with:', { id, data });
      
      // First, verify the quote exists
      const existingQuote = await this.getQuoteById(id);
      
      if (!existingQuote) {
        throw new Error('Quote not found in database');
      }
      
      console.log('Found existing quote:', existingQuote.id);
      
      // Start a transaction to update both Quote and QuoteAmount
      return await this.checkDatabase().$transaction(async (tx) => {
        // Prepare the quote update data, only including valid fields
        const validQuoteData: any = {};
        
        if (quoteData.date !== undefined) validQuoteData.date = quoteData.date;
        if (quoteData.status !== undefined) validQuoteData.status = quoteData.status;
        if (quoteData.userId !== undefined) validQuoteData.userId = quoteData.userId;
        if (quoteData.product !== undefined) validQuoteData.product = quoteData.product;
        if (quoteData.quantity !== undefined) validQuoteData.quantity = quoteData.quantity;
        if (clientId !== undefined) validQuoteData.clientId = clientId;

        console.log('Updating quote with valid data:', validQuoteData);

        // Update the quote
        const updatedQuote = await tx.quote.update({
          where: { id },
          data: validQuoteData,
          include: {
            client: true,
            user: true,
            papers: true,
            finishing: true,
            amounts: true,
          },
        });

        console.log('Quote updated successfully:', updatedQuote.id);

        // If amount is provided, update the QuoteAmount
        if (amount !== undefined) {
          console.log('Updating amount to:', amount);
          
          // Check if QuoteAmount exists, if not create it
          const existingAmount = await tx.quoteAmount.findUnique({
            where: { quoteId: id },
          });

          if (existingAmount) {
            await tx.quoteAmount.update({
              where: { quoteId: id },
              data: { total: amount },
            });
            console.log('Updated existing amount record');
          } else {
            await tx.quoteAmount.create({
              data: {
                quoteId: id,
                base: amount,
                vat: 0,
                total: amount,
              },
            });
            console.log('Created new amount record');
          }
          
          // Refresh the quote data to include updated amounts
          const refreshedQuote = await tx.quote.findUnique({
            where: { id },
            include: {
              client: true,
              user: true,
              papers: true,
              finishing: true,
              amounts: true,
            },
          });
          
          console.log('Refreshed quote with amounts:', refreshedQuote?.amounts);
          return refreshedQuote;
        }

        return updatedQuote;
      });
    } catch (error) {
      console.error('Error in updateQuote:', error);
      throw error;
    }
  }

  // Update quote with complete details including papers, finishing, and amounts
  static async updateQuoteWithDetails(id: string, data: any) {
    try {
      console.log('DatabaseService.updateQuoteWithDetails called with:', { id, data });
      console.log('Data type:', typeof data);
      console.log('Data keys:', Object.keys(data || {}));
      
      // First, verify the quote exists
      const existingQuote = await this.getQuoteById(id);
      
      if (!existingQuote) {
        throw new Error('Quote not found in database');
      }
      
      console.log('Found existing quote:', existingQuote.id);
      
      // Verify the client exists if clientId is being updated
      if (data.clientId && data.clientId !== existingQuote.clientId) {
        try {
          const client = await this.checkDatabase().client.findUnique({
            where: { id: data.clientId }
          });
          
          if (!client) {
            throw new Error(`Client with ID ${data.clientId} not found in database`);
          }
          
          console.log('Verified client exists:', client.id);
        } catch (clientError) {
          console.error('Error verifying client:', clientError);
          throw new Error(`Failed to verify client: ${clientError instanceof Error ? clientError.message : 'Unknown error'}`);
        }
      }
      
      // Verify the user exists if userId is being updated
      if (data.userId && data.userId !== existingQuote.userId) {
        try {
          const user = await this.checkDatabase().user.findUnique({
            where: { id: data.userId }
          });
          
          if (!user) {
            console.warn(`User with ID ${data.userId} not found, setting userId to null`);
            data.userId = null;
          } else {
            console.log('Verified user exists:', user.id);
          }
        } catch (userError) {
          console.error('Error verifying user:', userError);
          console.warn('Setting userId to null due to verification error');
          data.userId = null;
        }
      }
      
      // Start a transaction to update quote and all related data
      return await this.checkDatabase().$transaction(async (tx) => {
        // Prepare the quote update data
        const validQuoteData: any = {};
        
        if (data.date !== undefined) validQuoteData.date = data.date;
        if (data.status !== undefined) validQuoteData.status = data.status;
        if (data.userId !== undefined) validQuoteData.userId = data.userId;
        if (data.clientId !== undefined) validQuoteData.clientId = data.clientId;
        if (data.product !== undefined) validQuoteData.product = data.product;
        if (data.quantity !== undefined) validQuoteData.quantity = data.quantity;
        if (data.sides !== undefined) validQuoteData.sides = data.sides;
        if (data.printing !== undefined) validQuoteData.printing = data.printing;
        if (data.printingSelection !== undefined) validQuoteData.printingSelection = data.printingSelection;
        
        // Handle the new Step 3 fields
        if (data.flatSizeWidth !== undefined) validQuoteData.flatSizeWidth = data.flatSizeWidth;
        if (data.flatSizeHeight !== undefined) validQuoteData.flatSizeHeight = data.flatSizeHeight;
        if (data.flatSizeSpine !== undefined) validQuoteData.flatSizeSpine = data.flatSizeSpine;
        if (data.closeSizeWidth !== undefined) validQuoteData.closeSizeWidth = data.closeSizeWidth;
        if (data.closeSizeHeight !== undefined) validQuoteData.closeSizeHeight = data.closeSizeHeight;
        if (data.closeSizeSpine !== undefined) validQuoteData.closeSizeSpine = data.closeSizeSpine;
        if (data.useSameAsFlat !== undefined) validQuoteData.useSameAsFlat = data.useSameAsFlat;
        if (data.colors !== undefined) validQuoteData.colors = data.colors;

        console.log('Updating quote with valid data:', validQuoteData);

        // Update the quote
        const updatedQuote = await tx.quote.update({
          where: { id },
          data: validQuoteData,
          include: {
            client: true,
            user: true,
            papers: true,
            finishing: true,
            amounts: true,
          },
        });

        console.log('Quote updated successfully:', updatedQuote.id);

        // Update papers if provided
        if (data.papers && Array.isArray(data.papers)) {
          console.log('Updating papers:', data.papers);
          
          try {
            // Delete existing papers
            await tx.paper.deleteMany({
              where: { quoteId: id },
            });
            
            // Create new papers
            if (data.papers.length > 0) {
              await tx.paper.createMany({
                data: data.papers.map((paper: any) => ({
                  quoteId: id,
                  name: paper.name || 'Standard Paper',
                  gsm: paper.gsm || '150',
                })),
              });
            }
          } catch (paperError) {
            console.error('Error updating papers:', paperError);
            // Don't fail the entire update if papers fail
            console.log('Continuing with quote update despite papers error');
          }
        } else {
          console.log('No papers data provided, skipping papers update');
        }

        // Update finishing if provided
        if (data.finishing && Array.isArray(data.finishing)) {
          console.log('Updating finishing:', data.finishing);
          
          try {
            // Delete existing finishing
            await tx.finishing.deleteMany({
              where: { quoteId: id },
            });
            
            // Create new finishing
            if (data.finishing.length > 0) {
              await tx.finishing.createMany({
                data: data.finishing.map((finish: any) => ({
                  quoteId: id,
                  name: finish.name || finish, // Handle both object and string formats
                })),
              });
            }
          } catch (finishingError) {
            console.error('Error updating finishing:', finishingError);
            // Don't fail the entire update if finishing fails
            console.log('Continuing with quote update despite finishing error');
          }
        } else {
          console.log('No finishing data provided, skipping finishing update');
        }

        // Update amounts if provided
        if (data.amounts) {
          console.log('Updating amounts:', data.amounts);
          
          try {
            // Check if QuoteAmount exists, if not create it
            const existingAmount = await tx.quoteAmount.findUnique({
              where: { quoteId: id },
            });

            if (existingAmount) {
              await tx.quoteAmount.update({
                where: { quoteId: id },
                data: {
                  base: data.amounts.base || 0,
                  vat: data.amounts.vat || 0,
                  total: data.amounts.total || 0,
                },
              });
              console.log('Updated existing amount record');
            } else {
              await tx.quoteAmount.create({
                data: {
                  quoteId: id,
                  base: data.amounts.base || 0,
                  vat: data.amounts.vat || 0,
                  total: data.amounts.total || 0,
                },
              });
              console.log('Created new amount record');
            }
          } catch (amountError) {
            console.error('Error updating amounts:', amountError);
            throw new Error(`Failed to update quote amounts: ${amountError instanceof Error ? amountError.message : 'Unknown error'}`);
          }
        }
        
        // Refresh the quote data to include all updated related data
        const refreshedQuote = await tx.quote.findUnique({
          where: { id },
          include: {
            client: true,
            user: true,
            papers: true,
            finishing: true,
            amounts: true,
          },
        });
        
        console.log('Refreshed quote with all details:', refreshedQuote);
        return refreshedQuote;
      });
    } catch (error) {
      console.error('Error in updateQuoteWithDetails:', error);
      
      // Provide more specific error messages for common issues
      if (error instanceof Error) {
        if (error.message.includes('Foreign key constraint failed')) {
          throw new Error('Foreign key constraint failed: The client or user referenced in this quote does not exist. Please check the client and user data.');
        } else if (error.message.includes('Record to update not found')) {
          throw new Error('Quote not found: The quote you are trying to update does not exist in the database.');
        } else if (error.message.includes('Unique constraint failed')) {
          throw new Error('Duplicate data: The quote ID or client information conflicts with existing data.');
        }
      }
      
      throw error;
    }
  }

  static async deleteQuote(id: string) {
    const db = this.checkDatabase();
    return await db.quote.delete({
      where: { id },
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

  // Search operations
  static async saveSearchHistory(query: string, userId?: string) {
    const db = this.checkDatabase();
    return await db.searchHistory.create({
      data: {
        query,
        userId,
      },
    });
  }

  static async getSearchHistory(userId?: string, limit = 10) {
    const db = this.checkDatabase();
    return await db.searchHistory.findMany({
      where: userId ? { userId } : {},
      orderBy: { timestamp: 'desc' },
      take: limit,
    });
  }

  static async saveSearchAnalytics(query: string, userId?: string) {
    const db = this.checkDatabase();
    return await db.searchAnalytics.create({
      data: {
        query,
        userId,
      },
    });
  }

  static async getSearchAnalytics(userId?: string, limit = 100) {
    const db = this.checkDatabase();
    return await db.searchAnalytics.findMany({
      where: userId ? { userId } : {},
      orderBy: { timestamp: 'desc' },
      take: limit,
    });
  }

  // Statistics
  static async getQuoteStats() {
    const db = this.checkDatabase();
    const total = await db.quote.count();
    const pending = await db.quote.count({ where: { status: 'Pending' } });
    const approved = await db.quote.count({ where: { status: 'Approved' } });
    const rejected = await db.quote.count({ where: { status: 'Rejected' } });
    const completed = await db.quote.count({ where: { status: 'Completed' } });

    return {
      total,
      pending,
      approved,
      rejected,
      completed,
    };
  }

  // Supplier operations
  static async createSupplier(supplierData: {
    name: string;
    contact?: string;
    email?: string;
    phone?: string;
    countryCode?: string;
    address?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
    status?: string;
  }) {
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

  static async getAllSuppliers() {
    const db = this.checkDatabase();
    return await db.supplier.findMany({
      include: {
        materials: true,
      },
      orderBy: { name: 'asc' },
    });
  }

  static async updateSupplier(id: string, data: any) {
    const db = this.checkDatabase();
    return await db.supplier.update({
      where: { id },
      data,
      include: {
        materials: true,
      },
    });
  }

  static async deleteSupplier(id: string) {
    const db = this.checkDatabase();
    return await db.supplier.delete({
      where: { id },
    });
  }

  // Material operations
  static async createMaterial(materialData: {
    materialId: string;
    name: string;
    gsm?: string;
    supplierId: string;
    cost: number;
    unit: string;
    status?: string;
  }) {
    const db = this.checkDatabase();
    return await db.material.create({
      data: materialData,
      include: {
        supplier: true,
      },
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

  static async getAllMaterials() {
    const db = this.checkDatabase();
    return await db.material.findMany({
      include: {
        supplier: true,
      },
      orderBy: { name: 'asc' },
    });
  }

  static async updateMaterial(id: string, data: any) {
    const db = this.checkDatabase();
    return await db.material.update({
      where: { id },
      data,
      include: {
        supplier: true,
      },
    });
  }

  static async deleteMaterial(id: string) {
    const db = this.checkDatabase();
    return await db.material.delete({
      where: { id },
    });
  }

  // Get material by materialId
  static async getMaterialByMaterialId(materialId: string) {
    const db = this.checkDatabase();
    return await db.material.findUnique({
      where: { materialId },
      include: {
        supplier: true,
      },
    });
  }

  // Get supplier by email
  static async getSupplierByEmail(email: string) {
    const db = this.checkDatabase();
    return await db.supplier.findFirst({
      where: { email },
      include: {
        materials: true,
      },
    });
  }

  // Get supplier by name
  static async getSupplierByName(name: string) {
    const db = this.checkDatabase();
    return await db.supplier.findFirst({
      where: { name },
      include: {
        materials: true,
      },
    });
  }

  // Get materials by supplier
  static async getMaterialsBySupplier(supplierId: string) {
    const db = this.checkDatabase();
    return await db.material.findMany({
      where: { supplierId },
      include: {
        supplier: true,
      },
      orderBy: { name: 'asc' },
    });
  }

  static async getClientStats() {
    const db = this.checkDatabase();
    const total = await db.client.count();
    const companies = await db.client.count({ where: { clientType: 'Company' } });
    const individuals = await db.client.count({ where: { clientType: 'Individual' } });

    return {
      total,
      companies,
      individuals,
    };
  }

  // Migration helper - convert dummy data to database
  static async migrateDummyData() {
    // This will be used to migrate existing dummy data to the database
    console.log('Starting dummy data migration...');
    
    // Create default admin user if none exists
    const existingUser = await this.getUserByEmail('admin@example.com');
    if (!existingUser) {
      await this.createUser({
        email: 'admin@example.com',
        name: 'John Admin',
        role: 'admin',
      });
      console.log('Created default admin user');
    }

    console.log('Dummy data migration completed');
  }

  // Seed database with initial suppliers
  static async seedSuppliers() {
    console.log('Starting supplier seeding...');
    
    const suppliersToSeed = [
      {
        name: 'Paper Source LLC',
        contact: 'Ahmed Al Mansouri',
        email: 'ahmed@papersourcellc.ae',
        phone: '0501234567',
        countryCode: '+971',
        address: 'Sheikh Zayed Road',
        city: 'Dubai',
        state: 'Dubai',
        postalCode: '12345',
        country: 'UAE',
        status: 'Active'
      },
      {
        name: 'Apex Papers',
        contact: 'Sarah Johnson',
        email: 'sarah@apexpapers.ae',
        phone: '0509876543',
        countryCode: '+971',
        address: 'Al Wasl Road',
        city: 'Dubai',
        state: 'Dubai',
        postalCode: '54321',
        country: 'UAE',
        status: 'Active'
      },
      {
        name: 'Premium Print Supplies',
        contact: 'Mohammed Al Rashid',
        email: 'mohammed@premiumprint.ae',
        phone: '0505555555',
        countryCode: '+971',
        address: 'Jumeirah Road',
        city: 'Dubai',
        state: 'Dubai',
        postalCode: '67890',
        country: 'UAE',
        status: 'Active'
      }
    ];

    for (const supplierData of suppliersToSeed) {
      try {
        // Check if supplier exists by name instead of email (since email is optional)
        const existingSupplier = await this.getSupplierByName(supplierData.name);
        
        if (!existingSupplier) {
          const newSupplier = await this.createSupplier(supplierData);
          console.log(`Created supplier: ${supplierData.name} with ID: ${newSupplier.id}`);
        } else {
          console.log(`Supplier already exists: ${supplierData.name}`);
        }
      } catch (error) {
        console.error(`Error creating supplier ${supplierData.name}:`, error);
      }
    }
  }

  // Seed database with initial materials
  static async seedMaterials() {
    console.log('Starting material seeding...');
    
    // First, get the suppliers to link materials
    let suppliers = await this.getAllSuppliers();
    if (suppliers.length === 0) {
      console.log('No suppliers found, seeding suppliers first...');
      await this.seedSuppliers();
      suppliers = await this.getAllSuppliers();
    }
    
    const materialsToSeed = [
      {
        materialId: 'M-001',
        name: 'Art Paper',
        gsm: '300',
        supplierId: suppliers[0]?.id || '',
        cost: 0.50,
        unit: 'per_sheet',
        status: 'Active'
      },
      {
        materialId: 'M-002',
        name: 'Art Paper',
        gsm: '150',
        supplierId: suppliers[0]?.id || '',
        cost: 0.18,
        unit: 'per_sheet',
        status: 'Active'
      },
      {
        materialId: 'M-003',
        name: 'Glossy Paper',
        gsm: '200',
        supplierId: suppliers[1]?.id || '',
        cost: 0.35,
        unit: 'per_sheet',
        status: 'Active'
      },
      {
        materialId: 'M-004',
        name: 'Matte Paper',
        gsm: '250',
        supplierId: suppliers[1]?.id || '',
        cost: 0.42,
        unit: 'per_sheet',
        status: 'Active'
      },
      {
        materialId: 'M-005',
        name: 'Cardboard',
        gsm: '400',
        supplierId: suppliers[2]?.id || '',
        cost: 0.85,
        unit: 'per_sheet',
        status: 'Active'
      }
    ];

    for (const materialData of materialsToSeed) {
      try {
        if (materialData.supplierId) {
          const existingMaterial = await this.getMaterialByMaterialId(materialData.materialId);
          
          if (!existingMaterial) {
            await this.createMaterial(materialData);
            console.log(`Created material: ${materialData.name}`);
          } else {
            console.log(`Material already exists: ${materialData.name}`);
          }
        }
      } catch (error) {
        console.error(`Error creating material ${materialData.name}:`, error);
      }
    }
  }

  // Seed database with initial users
  static async seedUsers() {
    console.log('Starting user seeding...');
    
    const usersToSeed = [
      {
        email: 'admin@example.com',
        name: 'John Admin',
        role: 'admin',
        password: 'admin123',
      },
      {
        email: 'estimator@example.com',
        name: 'Jane Estimator',
        role: 'estimator',
        password: 'estimator123',
      },
      {
        email: 'user@example.com',
        name: 'Bob User',
        role: 'user',
        password: 'user123',
      }
    ];

    for (const userData of usersToSeed) {
      try {
        const existingUser = await this.getUserByEmail(userData.email);
        
        if (!existingUser) {
          await this.createUser({
            email: userData.email,
            name: userData.name,
            role: userData.role,
          });
          console.log(`Created user: ${userData.email}`);
        } else {
          // Update existing user with password if missing
          if (!existingUser.password) {
            await this.updateUser(existingUser.id, { password: userData.password });
            console.log(`Updated user password: ${userData.email}`);
          } else {
            console.log(`User already exists: ${userData.email}`);
          }
        }
      } catch (error) {
        console.error(`Error creating user ${userData.email}:`, error);
      }
    }

    // Also update existing users with passwords if they don't have them
    const existingUsers = await this.getAllUsers();

    for (const user of existingUsers) {
      try {
        let defaultPassword = 'password123';
        
        // Set role-specific passwords
        if (user.role === 'admin') {
          defaultPassword = 'admin123';
        } else if (user.role === 'estimator') {
          defaultPassword = 'estimator123';
        } else if (user.role === 'manager') {
          defaultPassword = 'manager123';
        }
        
        await this.updateUser(user.id, { password: defaultPassword });
        console.log(`Set password for user: ${user.email}`);
      } catch (error) {
        console.error(`Error setting password for user ${user.email}:`, error);
      }
    }

    console.log('User seeding completed');
  }

  // Seed database with initial clients
  static async seedClients() {
    console.log('Starting client seeding...');
    
    const clientsToSeed = [
      {
        clientType: 'Company',
        companyName: 'Eagan Inc.',
        contactPerson: 'John Smith',
        email: 'john.smith@eagan.com',
        phone: '501234567',
        countryCode: '+971',
        role: 'Marketing Manager',
      },
      {
        clientType: 'Company',
        companyName: 'Tech Solutions Ltd.',
        contactPerson: 'Sarah Johnson',
        email: 'sarah.j@techsolutions.com',
        phone: '559876543',
        countryCode: '+971',
        role: 'Operations Director',
      },
      {
        clientType: 'Company',
        companyName: 'Global Print Corp.',
        contactPerson: 'Michael Brown',
        email: 'michael.b@globalprint.com',
        phone: '524567890',
        countryCode: '+971',
        role: 'Procurement Manager',
      },
      {
        clientType: 'Company',
        companyName: 'Creative Agency',
        contactPerson: 'Lisa Wilson',
        email: 'lisa.w@creativeagency.com',
        phone: '543210987',
        countryCode: '+971',
        role: 'Creative Director',
      },
      {
        clientType: 'Individual',
        companyName: undefined,
        contactPerson: 'David Lee',
        email: 'david.lee@gmail.com',
        phone: '567890123',
        countryCode: '+971',
        role: undefined,
      }
    ];

    for (const clientData of clientsToSeed) {
      try {
        const existingClient = await this.getClientByEmail(clientData.email);
        
        if (!existingClient) {
          await this.createClient(clientData);
          console.log(`Created client: ${clientData.contactPerson}`);
        } else {
          console.log(`Client already exists: ${clientData.contactPerson}`);
        }
      } catch (error) {
        console.error(`Error creating client ${clientData.contactPerson}:`, error);
      }
    }

    console.log('Client seeding completed');
  }
}
