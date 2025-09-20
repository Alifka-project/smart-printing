import { NextResponse, NextRequest } from 'next/server';
import { DatabaseService } from '@/lib/database-production';

export async function GET() {
  try {
    console.log('🔍 Fetching quotes from database...');
    
    const dbService = new DatabaseService();
    const quotes = await dbService.getAllQuotes();
    
    console.log(`✅ Fetched ${quotes.length} quotes from database`);
    
    return NextResponse.json(quotes);
    
  } catch (error) {
    console.error('❌ Error fetching quotes:', error);
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
    const dbService = new DatabaseService();
    try {
      const client = await dbService.getClientById(body.clientId);
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
    
    console.log('Processed quote data:', JSON.stringify(body, null, 2));
    
    // Use the enhanced createQuote method from DatabaseService
    const quote = await dbService.createQuote(body);
    
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


