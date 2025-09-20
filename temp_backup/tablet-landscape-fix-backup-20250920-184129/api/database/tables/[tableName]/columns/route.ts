import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService } from '@/lib/database-unified';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tableName: string }> }
) {
  try {
    const { tableName } = await params;
    console.log(`🔍 Fetching columns for table: ${tableName}`);
    
    const dbService = new DatabaseService();
    const columns = await dbService.getTableColumns(tableName);
    
    return NextResponse.json(columns);
    
  } catch (error) {
    console.error(`❌ Error fetching columns for table:`, error);
    return NextResponse.json(
      { error: 'Failed to fetch table columns', details: error instanceof Error ? error.message : 'Unknown error' },
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
    console.log(`➕ Adding column to table: ${tableName}`, body);
    
    const dbService = new DatabaseService();
    const result = await dbService.addTableColumn(tableName, body);
    
    return NextResponse.json(result);
    
  } catch (error) {
    console.error(`❌ Error adding column to table:`, error);
    return NextResponse.json(
      { error: 'Failed to add column', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
