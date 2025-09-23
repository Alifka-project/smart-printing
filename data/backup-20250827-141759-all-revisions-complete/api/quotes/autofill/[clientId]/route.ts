import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService } from '@/lib/database';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  try {
    const { clientId } = await params;
    
    if (!clientId) {
      return NextResponse.json(
        { error: 'Client ID is required' },
        { status: 400 }
      );
    }

    // Use the DatabaseService method that includes all related data
    const quotes = await DatabaseService.getQuotesByClientId(clientId);
    
    if (!quotes || quotes.length === 0) {
      return NextResponse.json([]);
    }

    // Transform the data to match the expected format
    const transformedQuotes = quotes.map(quote => ({
      id: quote.id,
      quoteId: quote.quoteId,
      date: quote.date,
      status: quote.status,
      product: quote.product,
      productName: quote.productName,
      quantity: quote.quantity,
      sides: quote.sides,
      printing: quote.printing,
      printingSelection: quote.printingSelection,
      colors: quote.colors,
      flatSizeWidth: quote.flatSizeWidth,
      flatSizeHeight: quote.flatSizeHeight,
      flatSizeSpine: quote.flatSizeSpine,
      closeSizeWidth: quote.closeSizeWidth,
      closeSizeHeight: quote.closeSizeHeight,
      closeSizeSpine: quote.closeSizeSpine,
      useSameAsFlat: quote.useSameAsFlat,
      papers: quote.papers || [],
      finishing: quote.finishing || [],
      operational: quote.QuoteOperational || { plates: null, units: null },
      amounts: quote.amounts,
      client: quote.client,
      createdAt: quote.createdAt,
      updatedAt: quote.updatedAt,
    }));

    return NextResponse.json(transformedQuotes);
  } catch (error) {
    console.error('Error fetching quotes for autofill:', error);
    return NextResponse.json(
      { error: 'Failed to fetch quotes for autofill' },
      { status: 500 }
    );
  }
}
