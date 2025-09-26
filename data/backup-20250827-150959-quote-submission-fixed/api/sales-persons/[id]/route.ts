import { NextRequest, NextResponse } from 'next/server';
import { execSync } from 'child_process';
import path from 'path';

const dbPath = path.join(process.cwd(), 'prisma', 'dev.db');

// GET /api/sales-persons/[id] - Get specific sales person
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    console.log('📋 Fetching sales person with ID:', id);
    
    const result = execSync(`sqlite3 "${dbPath}" "SELECT * FROM SalesPerson WHERE id = '${id}';"`, { encoding: 'utf8' });
    
    if (!result.trim()) {
      console.log('ℹ️ Sales person not found');
      return NextResponse.json(
        { error: 'Sales person not found' },
        { status: 404 }
      );
    }

    const columns = result.trim().split('|');
    const salesPerson = {
      id: columns[0],
      salesPersonId: columns[1],
      name: columns[2],
      email: columns[3],
      phone: columns[4],
      countryCode: columns[5],
      designation: columns[6],
      department: columns[7],
      hireDate: columns[8],
      status: columns[9],
      profilePicture: columns[10] || null,
      address: columns[11] || null,
      city: columns[12],
      state: columns[13],
      postalCode: columns[14] || null,
      country: columns[15],
      notes: columns[16] || null,
      createdAt: columns[17],
      updatedAt: columns[18]
    };

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
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    console.log('📝 Updating sales person with ID:', id, body);

    // Fetch existing sales person to get current values
    const fetchResult = execSync(`sqlite3 "${dbPath}" "SELECT * FROM SalesPerson WHERE id = '${id}';"`, { encoding: 'utf8' });
    
    if (!fetchResult.trim()) {
      return NextResponse.json(
        { error: 'Sales person not found' },
        { status: 404 }
      );
    }

    const existingColumns = fetchResult.trim().split('|');
    
    // Merge existing data with updates
    const updatedData = {
      salesPersonId: body.salesPersonId || existingColumns[1],
      name: body.name || existingColumns[2],
      email: body.email || existingColumns[3],
      phone: body.phone || existingColumns[4],
      countryCode: body.countryCode || existingColumns[5],
      designation: body.designation || existingColumns[6],
      department: body.department || existingColumns[7],
      hireDate: body.hireDate || existingColumns[8],
      status: body.status || existingColumns[9],
      profilePicture: body.profilePicture || existingColumns[10] || '',
      address: body.address || existingColumns[11] || '',
      city: body.city || existingColumns[12],
      state: body.state || existingColumns[13],
      postalCode: body.postalCode || existingColumns[14] || '',
      country: body.country || existingColumns[15],
      notes: body.notes || existingColumns[16] || ''
    };

    const now = new Date().toISOString();

    // Update sales person
    const updateCmd = `sqlite3 "${dbPath}" "UPDATE SalesPerson SET 
      salesPersonId = '${updatedData.salesPersonId}',
      name = '${updatedData.name}',
      email = '${updatedData.email}',
      phone = '${updatedData.phone}',
      countryCode = '${updatedData.countryCode}',
      designation = '${updatedData.designation}',
      department = '${updatedData.department}',
      hireDate = '${updatedData.hireDate}',
      status = '${updatedData.status}',
      profilePicture = '${updatedData.profilePicture}',
      address = '${updatedData.address}',
      city = '${updatedData.city}',
      state = '${updatedData.state}',
      postalCode = '${updatedData.postalCode}',
      country = '${updatedData.country}',
      notes = '${updatedData.notes}',
      updatedAt = '${now}'
      WHERE id = '${id}';"`;

    execSync(updateCmd);

    // Fetch the updated sales person
    const result = execSync(`sqlite3 "${dbPath}" "SELECT * FROM SalesPerson WHERE id = '${id}';"`, { encoding: 'utf8' });

    if (!result.trim()) {
      throw new Error('Failed to fetch updated sales person');
    }

    const columns = result.trim().split('|');
    const updatedSalesPerson = {
      id: columns[0],
      salesPersonId: columns[1],
      name: columns[2],
      email: columns[3],
      phone: columns[4],
      countryCode: columns[5],
      designation: columns[6],
      department: columns[7],
      hireDate: columns[8],
      status: columns[9],
      profilePicture: columns[10] || null,
      address: columns[11] || null,
      city: columns[12],
      state: columns[13],
      postalCode: columns[14] || null,
      country: columns[15],
      notes: columns[16] || null,
      createdAt: columns[17],
      updatedAt: columns[18]
    };

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
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    console.log('🗑️ Deleting sales person with ID:', id);

    // Check if sales person exists
    const fetchResult = execSync(`sqlite3 "${dbPath}" "SELECT salesPersonId FROM SalesPerson WHERE id = '${id}';"`, { encoding: 'utf8' });
    
    if (!fetchResult.trim()) {
      return NextResponse.json(
        { error: 'Sales person not found' },
        { status: 404 }
      );
    }

    const salesPersonId = fetchResult.trim();

    // Delete sales person
    const deleteCmd = `sqlite3 "${dbPath}" "DELETE FROM SalesPerson WHERE id = '${id}';"`;
    execSync(deleteCmd);

    console.log('✅ Sales person deleted successfully:', salesPersonId);
    return NextResponse.json({ message: 'Sales person deleted successfully' });
    
  } catch (error) {
    console.error('❌ Error deleting sales person:', error);
    return NextResponse.json(
      { error: 'Failed to delete sales person' },
      { status: 500 }
    );
  }
}
