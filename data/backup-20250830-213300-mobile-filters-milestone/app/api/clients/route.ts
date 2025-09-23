import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService } from '@/lib/database-production';

export async function GET() {
  try {
    console.log('🔍 API: Starting to fetch clients...');
    const dbService = new DatabaseService();
    const clients = await dbService.getAllClients();
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
    console.log('Creating client with data:', JSON.stringify(body, null, 2));
    
    // Validate required fields
    const requiredFields = ['clientType', 'contactPerson', 'email', 'phone', 'countryCode'];
    for (const field of requiredFields) {
      if (!body[field]) {
        console.error(`Missing required field: ${field}`);
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }
    
    // Filter out fields that don't exist in the production database schema
    // Production schema only supports these fields for Client model
    const allowedFields = [
      'clientType',
      'companyName', 
      'contactPerson',
      'email',
      'phone',
      'countryCode',
      'role',
      'status',
      'userId',
      'address',
      'city',
      'state',
      'postalCode',
      'country'
    ];
    
    const filteredClientData = Object.keys(body)
      .filter(key => allowedFields.includes(key))
      .reduce((obj, key) => {
        obj[key] = body[key];
        return obj;
      }, {} as any);
    
    console.log('Filtered client data for production database:', JSON.stringify(filteredClientData, null, 2));
    
    const dbService = new DatabaseService();
    const client = await dbService.createClient(filteredClientData);
    
    console.log('Client created successfully:', client.id);
    return NextResponse.json(client);
  } catch (error) {
    console.error('Error creating client:', error);
    
    // Provide more specific error information
    if (error instanceof Error) {
      return NextResponse.json(
        { error: `Failed to create client: ${error.message}` },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to create client' },
      { status: 500 }
    );
  }
}

