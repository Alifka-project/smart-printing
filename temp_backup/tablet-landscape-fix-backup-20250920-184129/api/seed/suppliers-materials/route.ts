import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService } from '@/lib/database';

export async function POST(request: NextRequest) {
  try {
    console.log('🌱 Starting supplier and material seeding...');
    
    // Seed suppliers first
    console.log('📋 Step 1: Seeding suppliers...');
    const suppliersResult = await DatabaseService.seedSuppliers();
    console.log('✅ Suppliers seeding result:', suppliersResult);
    
    // Then seed materials (which depend on suppliers)
    console.log('📦 Step 2: Seeding materials...');
    const materialsResult = await DatabaseService.seedMaterials();
    console.log('✅ Materials seeding result:', materialsResult);
    
    // Verify the data was created
    console.log('🔍 Step 3: Verifying data creation...');
    const suppliers = await DatabaseService.getAllSuppliers();
    const materials = await DatabaseService.getAllMaterials();
    
    console.log('📊 Final counts:', {
      suppliers: suppliers.length,
      materials: materials.length
    });
    
    return NextResponse.json({ 
      success: true,
      message: 'Suppliers and materials seeded successfully',
      results: {
        suppliers: suppliers.length,
        materials: materials.length
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Error seeding suppliers and materials:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to seed suppliers and materials',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // Get current suppliers and materials count
    const suppliers = await DatabaseService.getAllSuppliers();
    const materials = await DatabaseService.getAllMaterials();
    
    return NextResponse.json({
      success: true,
      data: {
        suppliers: {
          count: suppliers.length,
          items: suppliers.map(s => ({ id: s.id, name: s.name, status: s.status }))
        },
        materials: {
          count: materials.length,
          items: materials.map(m => ({ id: m.id, materialId: m.materialId, name: m.name, supplier: m.supplier?.name }))
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Error fetching suppliers and materials status:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch suppliers and materials status',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
