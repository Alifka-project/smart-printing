import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService } from '@/lib/database-unified';

export async function GET() {
  try {
    console.log('🔍 Testing database connectivity...');
    
    const dbService = new DatabaseService();
    
    // Test basic connectivity
    const health = await dbService.checkHealth();
    console.log('Health check result:', health);
    
    // Test getting a specific table
    try {
      const userData = await dbService.getTableData('User');
      console.log('User table data:', userData);
    } catch (error) {
      console.error('Error getting User table:', error);
    }
    
    // Test getting table columns
    try {
      const userColumns = await dbService.getTableColumns('User');
      console.log('User table columns:', userColumns);
    } catch (error) {
      console.error('Error getting User columns:', error);
    }
    
    return NextResponse.json({
      health,
      message: 'Database test completed',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Error testing database:', error);
    return NextResponse.json(
      { error: 'Database test failed', details: error.message },
      { status: 500 }
    );
  }
}
