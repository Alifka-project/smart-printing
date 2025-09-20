import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    // Get all active materials that represent papers
    const materials = await DatabaseService.getAllMaterials();
    
    if (!materials || materials.length === 0) {
      return NextResponse.json([]);
    }

    // Filter for active materials and extract unique paper types
    const activeMaterials = materials.filter(material => material.status === 'Active');
    
    // Group by paper name and collect available GSM values
    const paperTypes = activeMaterials.reduce((acc: any, material) => {
      const paperName = material.name;
      
      if (!acc[paperName]) {
        acc[paperName] = {
          name: paperName,
          gsmOptions: [],
          suppliers: []
        };
      }
      
      // Add GSM option if not already present
      if (material.gsm && !acc[paperName].gsmOptions.includes(material.gsm)) {
        acc[paperName].gsmOptions.push(material.gsm);
      }
      
      // Add supplier if not already present
      if (material.supplier && !acc[paperName].suppliers.includes(material.supplier.name)) {
        acc[paperName].suppliers.push(material.supplier.name);
      }
      
      return acc;
    }, {});

    // Convert to array format and sort
    const papersList = Object.values(paperTypes).map((paper: any) => ({
      name: paper.name,
      gsmOptions: paper.gsmOptions.sort((a: string, b: string) => parseInt(a) - parseInt(b)),
      suppliers: paper.suppliers
    }));

    // Sort by paper name
    papersList.sort((a: any, b: any) => a.name.localeCompare(b.name));

    return NextResponse.json(papersList);
  } catch (error) {
    console.error('Error fetching paper materials:', error);
    return NextResponse.json(
      { error: 'Failed to fetch paper materials' },
      { status: 500 }
    );
  }
}
