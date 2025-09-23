import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService } from '@/lib/database-production';

export async function GET() {
  try {
    const dbService = new DatabaseService();
    const users = await dbService.getAllUsers();
    return NextResponse.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const dbService = new DatabaseService();
    const user = await dbService.createUser(body);
    return NextResponse.json(user);
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    );
  }
}

