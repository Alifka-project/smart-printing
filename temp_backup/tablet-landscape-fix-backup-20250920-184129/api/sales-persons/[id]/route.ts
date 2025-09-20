import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService } from '@/lib/database-unified';

// GET /api/sales-persons/[id] - Get specific sales person
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    console.log('📋 Fetching sales person with ID:', id);
    
    const dbService = new DatabaseService();
    const salesPerson = await dbService.getSalesPersonById(id);
    
    if (!salesPerson) {
      console.log('ℹ️ Sales person not found');
      return NextResponse.json(
        { error: 'Sales person not found' },
        { status: 404 }
      );
    }

    console.log('✅ Sales person fetched successfully:', salesPerson.salesPersonId);
    return NextResponse.json(salesPerson);
    
  } catch (error) {
    console.error('❌ Error fetching sales person:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sales person' },
      { status: 500 }
    );
  }
}

// PUT /api/sales-persons/[id] - Update sales person
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    console.log('📝 Updating sales person with ID:', id, body);

    const dbService = new DatabaseService();
    const updatedSalesPerson = await dbService.updateSalesPerson(id, body);
    
    if (!updatedSalesPerson) {
      return NextResponse.json(
        { error: 'Sales person not found' },
        { status: 404 }
      );
    }

    console.log('✅ Sales person updated successfully:', updatedSalesPerson.salesPersonId);
    return NextResponse.json(updatedSalesPerson);
    
  } catch (error) {
    console.error('❌ Error updating sales person:', error);
    return NextResponse.json(
      { error: 'Failed to update sales person' },
      { status: 500 }
    );
  }
}

// DELETE /api/sales-persons/[id] - Delete sales person
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    console.log('🗑️ Deleting sales person with ID:', id);

    const dbService = new DatabaseService();
    const deletedSalesPerson = await dbService.deleteSalesPerson(id);
    
    if (!deletedSalesPerson) {
      return NextResponse.json(
        { error: 'Sales person not found' },
        { status: 404 }
      );
    }

    console.log('✅ Sales person deleted successfully:', deletedSalesPerson.salesPersonId);
    return NextResponse.json({ message: 'Sales person deleted successfully' });
    
  } catch (error) {
    console.error('❌ Error deleting sales person:', error);
    return NextResponse.json(
      { error: 'Failed to delete sales person' },
      { status: 500 }
    );
  }
}
