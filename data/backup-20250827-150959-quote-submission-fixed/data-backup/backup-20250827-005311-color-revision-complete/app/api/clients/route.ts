import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService } from '@/lib/database';

export async function GET() {
  try {
    console.log('🔍 API: Starting to fetch clients...');
    const clients = await DatabaseService.getAllClients();
    console.log(`✅ API: Fetched ${clients.length} clients successfully`);
    console.log('Sample client data:', clients[0] || 'No clients found');
    return NextResponse.json(clients);
  } catch (error: any) {
    console.error('❌ API: Error fetching clients:', error);
    console.error('❌ Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    return NextResponse.json(
      { error: 'Failed to fetch clients', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const client = await DatabaseService.createClient(body);
    return NextResponse.json(client);
  } catch (error) {
    console.error('Error creating client:', error);
    return NextResponse.json(
      { error: 'Failed to create client' },
      { status: 500 }
    );
  }
}

