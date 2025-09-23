import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService } from '@/lib/database-unified';

export async function GET() {
  try {
    const dbService = new DatabaseService();
    const suppliers = await dbService.getAllSuppliers();
    return NextResponse.json(suppliers);
  } catch (error) {
    console.error('Error fetching suppliers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch suppliers' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const supplier = await dbService.createSupplier(body);
    return NextResponse.json(supplier);
  } catch (error) {
    console.error('Error creating supplier:', error);
    return NextResponse.json(
      { error: 'Failed to create supplier' },
      { status: 500 }
    );
  }
}
