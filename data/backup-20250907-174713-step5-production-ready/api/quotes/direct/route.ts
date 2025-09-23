import { NextResponse } from 'next/server';
import { prisma } from '@/lib/database-production';

export async function GET() {
  try {
    console.log('🔍 DIRECT API: Fetching quotes with client data directly from database...');
    
    // Use Prisma's native queries instead of raw SQL
    const quotes = await prisma.quote.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        amounts: true,
        papers: true,
        finishing: true
      }
    });

    console.log(`✅ DIRECT API: Found ${quotes.length} quotes with amounts`);

    // Fetch client data separately for each quote
    const clientIds = [...new Set(quotes.map(q => q.clientId).filter(Boolean))];
    const clients = await prisma.client.findMany({
      where: { id: { in: clientIds } }
    });

    // Create client map
    const clientMap = new Map(clients.map(client => [client.id, client]));

    // Transform the data to include client data and amounts
    const transformedQuotes = quotes.map(quote => {
      const client = quote.clientId ? clientMap.get(quote.clientId) : null;
      
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
          area: client.area
        } : null,
        amounts: quote.amounts || [],
        papers: quote.papers || [],
        finishing: quote.finishing || []
      };
    });

    console.log('✅ DIRECT API: Returning transformed quotes with client data and amounts');
    console.log('🔍 DEBUG: Sample client data:', transformedQuotes[0]?.client);
    
    return NextResponse.json(transformedQuotes);
    
  } catch (error) {
    console.error('❌ DIRECT API Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch quotes directly from database', details: error.message },
      { status: 500 }
    );
  }
}
