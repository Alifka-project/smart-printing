import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService } from '@/lib/database-unified';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tableName: string }> }
) {
  try {
    const { tableName } = await params;
    console.log(`🔍 Fetching rows for table: ${tableName}`);
    
    const dbService = new DatabaseService();
    const data = await dbService.getTableData(tableName);
    
    return NextResponse.json(data);
    
  } catch (error) {
    console.error(`❌ Error fetching rows for table ${params.tableName}:`, error);
    return NextResponse.json(
      { error: 'Failed to fetch table data', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ tableName: string }> }
) {
  try {
    const { tableName } = await params;
    const body = await request.json();
    console.log(`➕ Adding row to table: ${tableName}`, body);
    
    const dbService = new DatabaseService();
    const result = await dbService.addTableRow(tableName, body);
    
    return NextResponse.json(result);
    
  } catch (error) {
    console.error(`❌ Error adding row to table:`, error);
    return NextResponse.json(
      { error: 'Failed to add row', details: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ tableName: string }> }
) {
  try {
    const { tableName } = await params;
    const body = await request.json();
    const { rowIndex, data } = body;
    console.log(`✏️ Updating row ${rowIndex} in table: ${tableName}`, data);
    
    const dbService = new DatabaseService();
    const result = await dbService.updateTableRow(tableName, rowIndex, data);
    
    return NextResponse.json(result);
    
  } catch (error) {
    console.error(`❌ Error updating row in table:`, error);
    return NextResponse.json(
      { error: 'Failed to update row', details: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ tableName: string }> }
) {
  try {
    const { tableName } = await params;
    const body = await request.json();
    const { rowIndex } = body;
    console.log(`🗑️ Deleting row ${rowIndex} from table: ${tableName}`);
    
    const dbService = new DatabaseService();
    const result = await dbService.deleteTableRow(tableName, rowIndex);
    
    return NextResponse.json(result);
    
  } catch (error) {
    console.error(`❌ Error deleting row from table:`, error);
    return NextResponse.json(
      { error: 'Failed to delete row', details: error.message },
      { status: 500 }
    );
  }
}
