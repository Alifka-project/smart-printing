import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService } from '@/lib/database-production';

// Use production database service if in production
const getDatabaseService = () => {
  if (process.env.NODE_ENV === 'production') {
    // In production, use the production database service
    const { DatabaseService: ProductionDatabaseService } = require('@/lib/database-production');
    return new ProductionDatabaseService();
  }
  // In development, use the unified database service
  return new DatabaseService();
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    console.log('🔍 API: Fetching quote by ID:', id);
    
    const dbService = getDatabaseService();
    const quote = await dbService.getQuoteById(id);
    
    if (!quote) {
      console.log('❌ API: Quote not found:', id);
      return NextResponse.json(
        { error: 'Quote not found' },
        { status: 404 }
      );
    }
    
    console.log('✅ API: Quote fetched successfully:', quote.id);
    return NextResponse.json(quote);
    
  } catch (error: any) {
    console.error('❌ API: Error fetching quote:', error);
    console.error('❌ Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    return NextResponse.json(
      { error: 'Failed to fetch quote', details: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    console.log('🔍 API: Updating quote:', id);
    console.log('📝 Update data:', JSON.stringify(body, null, 2));
    
    const dbService = getDatabaseService();
    
    // Use updateQuoteWithDetails if amounts are provided, otherwise use updateQuote
    const updatedQuote = body.amounts 
      ? await dbService.updateQuoteWithDetails(id, body)
      : await dbService.updateQuote(id, body);
    
    console.log('✅ API: Quote updated successfully:', updatedQuote.id);
    return NextResponse.json(updatedQuote);
    
  } catch (error: any) {
    console.error('❌ API: Error updating quote:', error);
    console.error('❌ Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    return NextResponse.json(
      { error: 'Failed to update quote', details: error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    console.log('🔍 API: Patching quote:', id);
    console.log('📝 Patch data:', JSON.stringify(body, null, 2));
    
    const dbService = getDatabaseService();
    
    // Handle status updates specifically
    if (body.status) {
      console.log('🔄 API: Updating quote status to:', body.status);
      const updatedQuote = await dbService.updateQuoteStatus(id, body.status);
      console.log('✅ API: Quote status updated successfully:', updatedQuote.id);
      return NextResponse.json(updatedQuote);
    }
    
    // Handle other partial updates
    const updatedQuote = await dbService.updateQuote(id, body);
    console.log('✅ API: Quote updated successfully:', updatedQuote.id);
    return NextResponse.json(updatedQuote);
    
  } catch (error: any) {
    console.error('❌ API: Error patching quote:', error);
    console.error('❌ Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    return NextResponse.json(
      { error: 'Failed to update quote status', details: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    console.log('🔍 API: Deleting quote:', id);
    
    const dbService = getDatabaseService();
    await dbService.deleteQuote(id);
    
    console.log('✅ API: Quote deleted successfully:', id);
    return NextResponse.json({ message: 'Quote deleted successfully' });
    
  } catch (error: any) {
    console.error('❌ API: Error deleting quote:', error);
    console.error('❌ Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    return NextResponse.json(
      { error: 'Failed to delete quote', details: error.message },
      { status: 500 }
    );
  }
}

