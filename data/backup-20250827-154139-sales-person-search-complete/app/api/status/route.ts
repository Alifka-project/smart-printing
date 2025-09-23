import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService } from '@/lib/database';
import { convertToEmpFormat } from '@/lib/auth';

export async function GET() {
  try {
    const users = await DatabaseService.getAllUsers();
    const clients = await DatabaseService.getAllClients();
    const quotes = await DatabaseService.getAllQuotes();
    
    return NextResponse.json({
      status: 'ok',
      counts: {
        users: users.length,
        clients: clients.length,
        quotes: quotes.length
      },
      sampleData: {
        users: users.slice(0, 3).map(u => ({ 
          id: u.id, 
          displayId: convertToEmpFormat(u.id), 
          name: u.name, 
          email: u.email, 
          role: u.role 
        })),
        clients: clients.slice(0, 3).map(c => ({ id: c.id, contactPerson: c.contactPerson, companyName: c.companyName, email: c.email })),
        quotes: quotes.slice(0, 3).map(q => ({ id: q.id, quoteId: q.quoteId, status: q.status }))
      }
    });
  } catch (error) {
    console.error('Error checking database status:', error);
    return NextResponse.json(
      { error: 'Failed to check database status', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
