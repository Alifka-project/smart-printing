import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService } from '@/lib/database-unified';

export async function GET() {
  try {
    console.log('🔍 Fetching database tables...');
    
    const dbService = new DatabaseService();
    const tables = await dbService.getAllTablesWithData();
    
    console.log(`✅ Found ${tables.length} tables`);
    
    return NextResponse.json(tables);
    
  } catch (error) {
    console.error('❌ Error fetching database tables:', error);
    return NextResponse.json(
      { error: 'Failed to fetch database tables', details: error.message },
      { status: 500 }
    );
  }
}
