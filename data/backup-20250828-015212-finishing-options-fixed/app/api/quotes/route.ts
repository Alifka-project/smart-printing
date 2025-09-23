import { NextResponse } from 'next/server';
import { prisma } from '@/lib/database';

export async function GET() {
  try {
    console.log('🔍 Fetching quotes from database...');
    
    // Fetch quotes with basic info and include finishing
    const quotes = await prisma.quote.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            status: true
          }
        },
        finishing: true, // Include finishing options
        papers: true     // Include paper details
      }
    });
    
    console.log(`✅ Fetched ${quotes.length} quotes from database`);
    
    // Fetch all amounts separately
    const allAmounts = await prisma.quoteAmount.findMany();
    console.log(`✅ Fetched ${allAmounts.length} amounts from database`);
    
    // Create lookup maps
    const amountsMap = new Map();
    allAmounts.forEach(amount => {
      if (!amountsMap.has(amount.quoteId)) {
        amountsMap.set(amount.quoteId, []);
      }
      amountsMap.get(amount.quoteId).push(amount);
    });
    
    // Fetch all clients
    const allClients = await prisma.client.findMany();
    console.log(`✅ Fetched ${allClients.length} clients from database`);
    
    // Create a map of clients by id
    const clientMap = new Map(allClients.map(client => [client.id, client]));
    
    // Transform quotes to include amounts and client data
    const transformedQuotes = quotes.map(quote => {
      const client = clientMap.get(quote.clientId);
      const amounts = amountsMap.get(quote.id) || [];
      
      return {
        id: quote.id,
        quoteId: quote.quoteId,
        date: quote.date,
        status: quote.status,
        clientId: quote.clientId,
        userId: quote.userId,
        product: quote.product,
        quantity: quote.quantity,
        sides: quote.sides,
        printing: quote.printing,
        colors: quote.colors,
        createdAt: quote.createdAt,
        updatedAt: quote.updatedAt,
        productName: quote.productName || quote.product,
        printingSelection: quote.printingSelection || quote.printing,
        flatSizeWidth: quote.flatSizeWidth,
        flatSizeHeight: quote.flatSizeHeight,
        flatSizeSpine: quote.flatSizeSpine,
        closeSizeWidth: quote.closeSizeWidth,
        closeSizeHeight: quote.closeSizeHeight,
        closeSizeSpine: quote.closeSizeSpine,
        useSameAsFlat: quote.useSameAsFlat || false,
        // Include finishing options from database - transform to object array format with name property
        finishing: quote.finishing?.map(f => ({ name: f.name })) || [],
        // Include paper details from database
        papers: quote.papers?.map(p => ({
          name: p.name,
          gsm: p.gsm
        })) || [],
        client: client ? {
          id: client.id,
          clientType: client.clientType,
          companyName: client.companyName,
          contactPerson: client.contactPerson,
          firstName: client.firstName,
          lastName: client.lastName,
          email: client.email,
          phone: client.phone,
          countryCode: client.countryCode,
          role: client.role,
          status: client.status,
          address: client.address,
          city: client.city,
          state: client.state,
          postalCode: client.postalCode,
          country: client.country,
          designation: client.designation,
          emails: client.emails,
          trn: client.trn,
          hasNoTrn: client.hasNoTrn,
          area: client.area,
          createdAt: client.createdAt,
          updatedAt: client.updatedAt
        } : null,
        user: quote.user,
        amounts: amounts
      };
    });
    
    console.log(`✅ Returning ${transformedQuotes.length} quotes with amounts and client data`);
    
    // Log sample data for debugging
    if (transformedQuotes.length > 0) {
      const firstQuote = transformedQuotes[0];
      console.log('🔍 Sample quote data:', {
        id: firstQuote.id,
        quoteId: firstQuote.quoteId,
        hasClient: !!firstQuote.client,
        hasAmounts: firstQuote.amounts.length > 0,
        amountsCount: firstQuote.amounts.length,
        firstAmount: firstQuote.amounts[0] || 'No amounts'
      });
    }
    
    return NextResponse.json(transformedQuotes);
    
  } catch (error) {
    console.error('❌ API Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch quotes', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}


