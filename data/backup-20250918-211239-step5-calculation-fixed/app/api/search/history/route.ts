import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService } from '@/lib/database';

export async function GET() {
  try {
    const dbService = new DatabaseService();
    const history = await dbService.getSearchHistory();
    return NextResponse.json(history);
  } catch (error) {
    console.error('Error fetching search history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch search history' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, userId } = body;
    
    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }
    
    const dbService = new DatabaseService();
    await dbService.saveSearchHistory(query, userId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving search history:', error);
    return NextResponse.json(
      { error: 'Failed to save search history' },
      { status: 500 }
    );
  }
}

