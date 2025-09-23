import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService } from '@/lib/database';

export async function POST(request: NextRequest) {
  try {
    // Seed users
    await DatabaseService.seedUsers();
    
    // Seed clients
    await DatabaseService.seedClients();
    
    // Seed suppliers
    await DatabaseService.seedSuppliers();
    
    // Seed materials
    await DatabaseService.seedMaterials();
    
    return NextResponse.json({ 
      message: 'Database seeded successfully with users, clients, suppliers, and materials',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error seeding database:', error);
    return NextResponse.json(
      { error: 'Failed to seed database' },
      { status: 500 }
    );
  }
}
