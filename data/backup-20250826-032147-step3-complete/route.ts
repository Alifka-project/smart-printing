import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService } from '@/lib/database';

export async function GET() {
  try {
    // Try Prisma first, but fallback to direct SQLite if it fails
    try {
      const quotes = await DatabaseService.getAllQuotes();
      return NextResponse.json(quotes);
    } catch (prismaError) {
      console.log('Prisma failed, using direct SQLite fallback');
      
      // Fallback to direct SQLite query
      const { execSync } = require('child_process');
      const path = require('path');
      const dbPath = path.join(process.cwd(), 'prisma', 'dev.db');
      
      try {
        const quotesResult = execSync(`sqlite3 "${dbPath}" "SELECT q.id, q.quoteId, q.date, q.status, q.clientId, q.userId, q.product, q.quantity, q.sides, q.printing, q.colors, q.createdAt, q.updatedAt, q.productName, q.printingSelection, q.flatSizeWidth, q.flatSizeHeight, q.flatSizeSpine, q.closeSizeWidth, q.closeSizeHeight, q.closeSizeSpine, q.useSameAsFlat, c.companyName, c.contactPerson, c.email, u.name as userName, u.email as userEmail, qa.base, qa.vat, qa.total FROM Quote q LEFT JOIN Client c ON q.clientId = c.id LEFT JOIN User u ON q.userId = u.id LEFT JOIN QuoteAmount qa ON q.id = qa.quoteId ORDER BY q.date DESC;"`, { encoding: 'utf8' });
        
        if (!quotesResult.trim()) {
          return NextResponse.json([]);
        }
        
        const quotes = quotesResult.trim().split('\n').map((line: string) => {
          const [id, quoteId, date, status, clientId, userId, product, quantity, sides, printing, colors, createdAt, updatedAt, productName, printingSelection, flatSizeWidth, flatSizeHeight, flatSizeSpine, closeSizeWidth, closeSizeHeight, closeSizeSpine, useSameAsFlat, companyName, contactPerson, clientEmail, userName, userEmail, base, vat, total] = line.split('|');
          return {
            id,
            quoteId,
            date,
            status,
            clientId,
            userId: userId || null,
            product,
            quantity: parseInt(quantity),
            sides,
            printing,
            colors: colors || null,
            createdAt,
            updatedAt,
            // New Step 3 fields
            productName: productName || product,
            printingSelection: printingSelection || printing,
            flatSizeWidth: flatSizeWidth ? parseFloat(flatSizeWidth) : null,
            flatSizeHeight: flatSizeHeight ? parseFloat(flatSizeHeight) : null,
            flatSizeSpine: flatSizeSpine ? parseFloat(flatSizeSpine) : null,
            closeSizeWidth: closeSizeWidth ? parseFloat(closeSizeWidth) : null,
            closeSizeHeight: closeSizeHeight ? parseFloat(closeSizeHeight) : null,
            closeSizeSpine: closeSizeSpine ? parseFloat(closeSizeSpine) : null,
            useSameAsFlat: useSameAsFlat === '1',
            // Add proper client info
            client: { 
              id: clientId, 
              companyName: companyName || 'Client', 
              contactPerson: contactPerson || 'Contact', 
              email: clientEmail || 'email@example.com' 
            },
            user: userId ? { 
              id: userId, 
              name: userName || 'User', 
              email: userEmail || 'user@example.com' 
            } : null,
            amounts: base && vat && total ? {
              base: parseFloat(base),
              vat: parseFloat(vat),
              total: parseFloat(total)
            } : null
          };
        });
        
        return NextResponse.json(quotes);
      } catch (sqliteError) {
        console.error('Both Prisma and SQLite failed:', sqliteError);
        return NextResponse.json([]);
      }
    }
  } catch (error) {
    console.error('Error fetching quotes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch quotes' },
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
      const client = await DatabaseService.getClientById(body.clientId);
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
    
    // Ensure papers and finishing are arrays
    if (!Array.isArray(body.papers)) {
      body.papers = [];
    }
    if (!Array.isArray(body.finishing)) {
      body.finishing = [];
    }
    
    // Ensure amounts object exists
    if (!body.amounts) {
      body.amounts = {
        base: 0,
        vat: 0,
        total: 0
      };
    }
    
    // Process Step 3 product specification data
    if (body.products && body.products.length > 0) {
      const product = body.products[0]; // Take the first product for now
      
      // Map Step 3 fields to the new database columns
      body.productName = product.productName || body.product;
      body.printingSelection = product.printingSelection || body.printing;
      
      // Map size specifications
      if (product.flatSize) {
        body.flatSizeWidth = product.flatSize.width;
        body.flatSizeHeight = product.flatSize.height;
        body.flatSizeSpine = product.flatSize.spine;
      }
      
      if (product.closeSize) {
        body.closeSizeWidth = product.closeSize.width;
        body.closeSizeHeight = product.closeSize.height;
        body.closeSizeSpine = product.closeSize.spine;
      }
      
      body.useSameAsFlat = product.useSameAsFlat || false;
      
      // Map colors if available
      if (product.colors) {
        body.colors = product.colors;
      }
      
      // Map papers if available
      if (product.papers && product.papers.length > 0) {
        body.papers = product.papers;
      }
      
      // Map finishing if available
      if (product.finishing && product.finishing.length > 0) {
        body.finishing = product.finishing;
      }
      
      // Map finishing comments if available
      if (product.finishingComments) {
        body.finishingComments = product.finishingComments;
      }
    }
    
    console.log('Processed quote data:', JSON.stringify(body, null, 2));
    
    // Use the new method that handles complete quote creation with related data
    const quote = await DatabaseService.createQuoteWithDetails(body);
    console.log('Quote created successfully with all details:', quote.id);
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

