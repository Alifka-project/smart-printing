import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database';

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 Testing database operations...');
    
    const results = {
      supplierCreation: null,
      materialCreation: null,
      errors: []
    };

    // Test 1: Create a supplier directly
    try {
      console.log('📋 Testing supplier creation...');
      const supplier = await prisma.supplier.create({
        data: {
          name: 'Test Supplier',
          contact: 'Test Contact',
          email: 'test@supplier.com',
          phone: '123456789',
          countryCode: '+971',
          country: 'UAE',
          status: 'Active'
        }
      });
      results.supplierCreation = supplier;
      console.log('✅ Supplier created successfully:', supplier.id);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      results.errors.push(`Supplier creation failed: ${errorMsg}`);
      console.error('❌ Supplier creation failed:', error);
    }

    // Test 2: Create a material if supplier was created
    if (results.supplierCreation) {
      try {
        console.log('📦 Testing material creation...');
        const material = await prisma.material.create({
          data: {
            materialId: 'TEST-001',
            name: 'Test Material',
            supplierId: results.supplierCreation.id,
            cost: 1.00,
            unit: 'per_sheet',
            status: 'Active'
          }
        });
        results.materialCreation = material;
        console.log('✅ Material created successfully:', material.id);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        results.errors.push(`Material creation failed: ${errorMsg}`);
        console.error('❌ Material creation failed:', error);
      }
    }

    // Test 3: Query the created data
    try {
      console.log('🔍 Testing data queries...');
      const suppliers = await prisma.supplier.findMany();
      const materials = await prisma.material.findMany();
      
      console.log('📊 Current data counts:', {
        suppliers: suppliers.length,
        materials: materials.length
      });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      results.errors.push(`Data query failed: ${errorMsg}`);
      console.error('❌ Data query failed:', error);
    }

    return NextResponse.json({
      success: true,
      message: 'Database test completed',
      results,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('💥 Error in database test:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Database test failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // Get current counts
    const suppliers = await prisma.supplier.findMany();
    const materials = await prisma.material.findMany();
    
    return NextResponse.json({
      success: true,
      currentData: {
        suppliers: suppliers.length,
        materials: materials.length,
        supplierDetails: suppliers.map(s => ({ id: s.id, name: s.name, status: s.status })),
        materialDetails: materials.map(m => ({ id: m.id, materialId: m.materialId, name: m.name }))
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Error getting current data:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to get current data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
