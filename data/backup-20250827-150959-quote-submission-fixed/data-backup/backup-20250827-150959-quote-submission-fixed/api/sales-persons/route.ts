import { NextRequest, NextResponse } from 'next/server';
import { execSync } from 'child_process';
import path from 'path';

const dbPath = path.join(process.cwd(), 'prisma', 'dev.db');

// GET /api/sales-persons - Get all sales persons
export async function GET() {
  try {
    console.log('📋 Fetching all sales persons...');
    
    const result = execSync(`sqlite3 "${dbPath}" "SELECT * FROM SalesPerson ORDER BY salesPersonId;"`, { encoding: 'utf8' });
    
    if (!result.trim()) {
      console.log('ℹ️ No sales persons found in database');
      return NextResponse.json([]);
    }

    const salesPersons = result.trim().split('\n').map(line => {
      const columns = line.split('|');
      return {
        id: columns[0],
        salesPersonId: columns[1],
        name: columns[2],
        email: columns[3],
        phone: columns[4],
        countryCode: columns[5],
        designation: columns[6],
        department: columns[7],
        hireDate: columns[8],
        status: columns[9],
        profilePicture: columns[10] || null,
        address: columns[11] || null,
        city: columns[12],
        state: columns[13],
        postalCode: columns[14] || null,
        country: columns[15],
        notes: columns[16] || null,
        createdAt: columns[17],
        updatedAt: columns[18]
      };
    });

    console.log(`✅ Found ${salesPersons.length} sales persons`);
    return NextResponse.json(salesPersons);
    
  } catch (error) {
    console.error('❌ Error fetching sales persons:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sales persons' },
      { status: 500 }
    );
  }
}

// POST /api/sales-persons - Create new sales person
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('📝 Creating new sales person:', body);

    const {
      salesPersonId,
      name,
      email,
      phone,
      countryCode,
      designation,
      department,
      hireDate,
      status,
      profilePicture,
      address,
      city,
      state,
      postalCode,
      country,
      notes
    } = body;

    // Validate required fields
    if (!salesPersonId || !name || !email || !phone) {
      return NextResponse.json(
        { error: 'Missing required fields: salesPersonId, name, email, phone' },
        { status: 400 }
      );
    }

    // Generate unique ID
    const id = `sp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();

    // Insert new sales person
    const insertCmd = `sqlite3 "${dbPath}" "INSERT INTO SalesPerson (
      id, salesPersonId, name, email, phone, countryCode, designation, department,
      hireDate, status, profilePicture, address, city, state, postalCode, country,
      notes, createdAt, updatedAt
    ) VALUES (
      '${id}', '${salesPersonId}', '${name}', '${email}', '${phone}', '${countryCode || '+971'}',
      '${designation || 'Sales Representative'}', '${department || 'Sales'}', '${hireDate || now}',
      '${status || 'Active'}', '${profilePicture || ''}', '${address || ''}', '${city || 'Dubai'}',
      '${state || 'Dubai'}', '${postalCode || ''}', '${country || 'UAE'}', '${notes || ''}',
      '${now}', '${now}'
    );"`;

    execSync(insertCmd);

    // Fetch the newly created sales person
    const fetchCmd = `sqlite3 "${dbPath}" "SELECT * FROM SalesPerson WHERE id = '${id}';"`;
    const result = execSync(fetchCmd, { encoding: 'utf8' });

    if (!result.trim()) {
      throw new Error('Failed to fetch newly created sales person');
    }

    const columns = result.trim().split('|');
    const newSalesPerson = {
      id: columns[0],
      salesPersonId: columns[1],
      name: columns[2],
      email: columns[3],
      phone: columns[4],
      countryCode: columns[5],
      designation: columns[6],
      department: columns[7],
      hireDate: columns[8],
      status: columns[9],
      profilePicture: columns[10] || null,
      address: columns[11] || null,
      city: columns[12],
      state: columns[13],
      postalCode: columns[14] || null,
      country: columns[15],
      notes: columns[16] || null,
      createdAt: columns[17],
      updatedAt: columns[18]
    };

    console.log('✅ Sales person created successfully:', newSalesPerson.salesPersonId);
    return NextResponse.json(newSalesPerson, { status: 201 });
    
  } catch (error) {
    console.error('❌ Error creating sales person:', error);
    return NextResponse.json(
      { error: 'Failed to create sales person' },
      { status: 500 }
    );
  }
}
