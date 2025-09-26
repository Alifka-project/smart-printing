import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService } from '@/lib/database';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    console.log('Getting quote with ID:', id);
    
    const quote = await DatabaseService.getQuoteById(id);
    if (!quote) {
      return NextResponse.json(
        { error: 'Quote not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(quote);
  } catch (error) {
    console.error('Error getting quote:', error);
    return NextResponse.json(
      { error: 'Failed to get quote' },
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
    console.log('Updating quote with data:', body);
    
    // Use the new comprehensive update method that handles all related data
    const quote = await DatabaseService.updateQuoteWithDetails(id, body);
    return NextResponse.json(quote);
  } catch (error) {
    console.error('Error updating quote:', error);
    
    // Provide more detailed error information
    let errorMessage = 'Failed to update quote';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    return NextResponse.json(
      { error: errorMessage },
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
    console.log('Patching quote with data:', body);
    
    // For PATCH requests, we'll handle partial updates (like status changes)
    if (body.status) {
      const quote = await DatabaseService.updateQuoteStatus(id, body.status);
      return NextResponse.json(quote);
    }
    
    return NextResponse.json(
      { error: 'Invalid PATCH data' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error patching quote:', error);
    return NextResponse.json(
      { error: 'Failed to patch quote' },
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
    await DatabaseService.deleteQuote(id);
    return NextResponse.json({ message: 'Quote deleted successfully' });
  } catch (error) {
    console.error('Error deleting quote:', error);
    return NextResponse.json(
      { error: 'Failed to delete quote' },
      { status: 500 }
    );
  }
}

