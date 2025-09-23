import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database';

export async function GET() {
  try {
    console.log('🔍 Fetching sales persons from PostgreSQL database...');
    
    // Use direct Prisma client with raw SQL for now
    const salesPersons = await prisma.$queryRaw`
      SELECT 
        id, "salesPersonId", name, email, phone, "countryCode", 
        designation, department, "hireDate", status, "profilePicture",
        address, city, state, "postalCode", country, notes,
        "createdAt", "updatedAt"
      FROM "SalesPerson" 
      ORDER BY "createdAt" DESC
    `;
    
    console.log(`✅ Found ${Array.isArray(salesPersons) ? salesPersons.length : 0} sales persons`);
    
    return NextResponse.json(Array.isArray(salesPersons) ? salesPersons : []);
    
  } catch (error) {
    console.error('❌ Error fetching sales persons:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sales persons', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('Received sales person data:', JSON.stringify(body, null, 2));
    
    // Validate required fields
    const requiredFields = ['salesPersonId', 'name', 'email', 'phone'];
    for (const field of requiredFields) {
      if (!body[field]) {
        console.log(`Missing required field: ${field}`);
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }
    
    // Create sales person using raw SQL for now
    const result = await prisma.$executeRaw`
      INSERT INTO "SalesPerson" (
        id, "salesPersonId", name, email, phone, "countryCode", 
        designation, department, "hireDate", status, "profilePicture",
        address, city, state, "postalCode", country, notes,
        "createdAt", "updatedAt"
      ) VALUES (
        ${body.id || 'cuid()'}, ${body.salesPersonId}, 
        ${body.name}, ${body.email}, ${body.phone},
        ${body.countryCode || '+971'}, ${body.designation || 'Sales Representative'},
        ${body.department || 'Sales'}, ${body.hireDate || new Date()},
        ${body.status || 'Active'}, ${body.profilePicture || null},
        ${body.address || null}, ${body.city || 'Dubai'},
        ${body.state || 'Dubai'}, ${body.postalCode || null},
        ${body.country || 'UAE'}, ${body.notes || null},
        ${new Date()}, ${new Date()}
      )
    `;
    
    console.log('Sales person created successfully');
    return NextResponse.json({ success: true, message: 'Sales person created' });
    
  } catch (error) {
    console.error('❌ Error creating sales person:', error);
    return NextResponse.json(
      { error: 'Failed to create sales person', details: error.message },
      { status: 500 }
    );
  }
}
