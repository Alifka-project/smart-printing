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
    console.log('🔍 API: Fetching client by ID:', id);
    
    const dbService = getDatabaseService();
    const client = await dbService.getClientById(id);
    
    if (!client) {
      console.log('❌ API: Client not found:', id);
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      );
    }
    
    console.log('✅ API: Client fetched successfully:', client.id);
    return NextResponse.json(client);
    
  } catch (error: any) {
    console.error('❌ API: Error fetching client:', error);
    console.error('❌ Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    return NextResponse.json(
      { error: 'Failed to fetch client', details: error.message },
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
    
    console.log('🔍 API: Updating client:', id);
    console.log('📝 Update data:', JSON.stringify(body, null, 2));
    
    const dbService = getDatabaseService();
    const updatedClient = await dbService.updateClient(id, body);
    
    console.log('✅ API: Client updated successfully:', updatedClient.id);
    return NextResponse.json(updatedClient);
    
  } catch (error: any) {
    console.error('❌ API: Error updating client:', error);
    console.error('❌ Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    return NextResponse.json(
      { error: 'Failed to update client', details: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const dbService = new DatabaseService();
    await dbService.deleteClient(params.id);
    return NextResponse.json({ message: 'Client deleted successfully' });
  } catch (error) {
    console.error('Error deleting client:', error);
    return NextResponse.json(
      { error: 'Failed to delete client' },
      { status: 500 }
    );
  }
}
