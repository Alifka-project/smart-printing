import { NextResponse, NextRequest } from 'next/server';
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('Received quote data:', JSON.stringify(body, null, 2));
    
    // Validate required fields
    const requiredFields = ['quoteId', 'clientId', 'product', 'quantity', 'sides', 'printing'];
    for (const field of requiredFields) {
      if (!body[field]) {
        console.log(`Missing required field: ${field}`);
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }
    
    // Validate userId if provided
    if (body.userId) {
      try {
        // Use relative URL instead of environment variable for better production compatibility
        const userResponse = await fetch(`${request.nextUrl.origin}/api/users/${body.userId}`);
        if (!userResponse.ok) {
          console.log(`Invalid userId: ${body.userId}`);
          // Remove invalid userId instead of failing
          delete body.userId;
        }
      } catch (error) {
        console.log(`Error validating userId: ${body.userId}, removing it`);
        delete body.userId;
      }
    }
    
    // Validate that clientId exists
    try {
      const client = await prisma.client.findUnique({
        where: { id: body.clientId }
      });
      if (!client) {
        console.log(`Client with ID ${body.clientId} not found`);
        return NextResponse.json(
          { error: `Client with ID ${body.clientId} not found` },
          { status: 400 }
        );
      }
      console.log('Client found:', client.id, client.contactPerson);
    } catch (clientError) {
      console.error('Error checking client:', clientError);
      return NextResponse.json(
        { error: 'Invalid client ID' },
        { status: 400 }
      );
    }
    
    // Ensure amounts object exists with proper values
    if (!body.amounts || !body.amounts.total || body.amounts.total === 0) {
      console.log('Warning: Quote amounts are missing or zero. This will result in a 0 AED quote.');
      body.amounts = {
        base: body.amounts?.base || 0,
        vat: body.amounts?.vat || 0,
        total: body.amounts?.total || 0
      };
    }
    
    // Ensure papers and finishing are arrays
    if (!Array.isArray(body.papers)) {
      body.papers = [];
    }
    if (!Array.isArray(body.finishing)) {
      body.finishing = [];
    }
    
    // Remove operational field from quote data since it's a relation field
    // The operational data will be created separately by the DatabaseService
    if (body.operational) {
      console.log('Extracting operational data for separate creation:', body.operational);
      // Keep the operational data for the DatabaseService to use
    }
    
    console.log('Processed quote data:', JSON.stringify(body, null, 2));
    
    // Use the working createQuote method from DatabaseService
    const { DatabaseService } = await import('@/lib/database');
    const quote = await DatabaseService.createQuote(body);
    
    console.log('Quote created successfully with all details:', quote?.id);
    
    if (!quote) {
      return NextResponse.json(
        { error: 'Failed to create quote - no response from database' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(quote);
    
  } catch (error) {
    console.error('Error creating quote:', error);
    
    // Provide more specific error information
    if (error instanceof Error) {
      return NextResponse.json(
        { error: `Failed to create quote: ${error.message}` },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to create quote' },
      { status: 500 }
    );
  }
}


