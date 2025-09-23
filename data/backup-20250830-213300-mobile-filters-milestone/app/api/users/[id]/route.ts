import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService } from '@/lib/database-unified';

// Use production database service if in production
const getDatabaseService = () => {
  if (process.env.NODE_ENV === 'production') {
    // In production, use the production database service
    const { DatabaseService: ProductionDatabaseService } = require('@/lib/database-production');
    return new ProductionDatabaseService();
  }
  // In development, use the unified database service
  return new DatabaseService();
};

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    // Remove password if it's undefined to avoid overwriting with undefined
    if (body.password === undefined) {
      delete body.password;
    }
    
    const dbService = getDatabaseService();
    const user = await dbService.updateUser(id, body);
    return NextResponse.json(user);
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const dbService = getDatabaseService();
    await dbService.deleteUser(params.id);
    return NextResponse.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    );
  }
}
