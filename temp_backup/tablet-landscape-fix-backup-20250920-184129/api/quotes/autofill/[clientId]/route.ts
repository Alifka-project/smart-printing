import { NextRequest, NextResponse } from 'next/server';

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

    // Use the main quotes API and filter by clientId
    const response = await fetch(`${request.nextUrl.origin}/api/quotes`);
    if (!response.ok) {
      throw new Error('Failed to fetch quotes');
    }
    
    const allQuotes = await response.json();
    
    // Filter quotes by clientId
    const quotes = allQuotes.filter((quote: any) => quote.clientId === clientId);
    
    if (!quotes || quotes.length === 0) {
      return NextResponse.json([]);
    }

    // Transform the data to match the expected format
    const transformedQuotes = quotes.map((quote: any) => ({
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
      productName: quote.productName,
      printingSelection: quote.printingSelection,
      flatSizeWidth: quote.flatSizeWidth,
      flatSizeHeight: quote.flatSizeHeight,
      flatSizeSpine: quote.flatSizeSpine,
      closeSizeWidth: quote.closeSizeWidth,
      closeSizeHeight: quote.closeSizeHeight,
      closeSizeSpine: quote.closeSizeSpine,
      useSameAsFlat: quote.useSameAsFlat,
      finishingComments: quote.finishingComments,
      approvalStatus: quote.approvalStatus,
      requiresApproval: quote.requiresApproval,
      approvalReason: quote.approvalReason,
      approvedBy: quote.approvedBy,
      approvedAt: quote.approvedAt,
      approvalNotes: quote.approvalNotes,
      discountPercentage: quote.discountPercentage,
      discountAmount: quote.discountAmount,
      marginPercentage: quote.marginPercentage,
      marginAmount: quote.marginAmount,
      customerPdfEnabled: quote.customerPdfEnabled,
      sendToCustomerEnabled: quote.sendToCustomerEnabled,
      // Include finishing and papers data from the main API response
      finishing: quote.finishing || [], // Now contains [{name: "UV Spot"}, {name: "Lamination"}]
      papers: quote.papers || []
    }));

    console.log(`✅ Returning ${transformedQuotes.length} quotes for client ${clientId}`);
    return NextResponse.json(transformedQuotes);
    
  } catch (error) {
    console.error('❌ Autofill API Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch autofill data', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
