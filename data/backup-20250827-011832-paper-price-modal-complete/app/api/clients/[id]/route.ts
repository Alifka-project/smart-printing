import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService } from '@/lib/database';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    console.log('🔍 API: Updating client with data:', body);
    console.log('🔍 API: Client ID:', params.id);
    
    const client = await DatabaseService.updateClient(params.id, body);
    console.log('✅ API: Client updated successfully:', client);
    
    return NextResponse.json(client);
  } catch (error: any) {
    console.error('❌ API: Error updating client:', error);
    console.error('❌ Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    
    return NextResponse.json(
      { 
        error: 'Failed to update client', 
        details: error.message,
        stack: error.stack 
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await DatabaseService.deleteClient(params.id);
    return NextResponse.json({ message: 'Client deleted successfully' });
  } catch (error) {
    console.error('Error deleting client:', error);
    return NextResponse.json(
      { error: 'Failed to delete client' },
      { status: 500 }
    );
  }
}
