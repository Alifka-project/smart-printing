import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService } from '@/lib/database';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ paperName: string }> }
) {
  try {
    const { paperName } = await params;

    if (!paperName) {
      return NextResponse.json(
        { error: 'Paper name is required' },
        { status: 400 }
      );
    }

    // Decode the paper name (handle URL encoding)
    const decodedPaperName = decodeURIComponent(paperName);

    // Get all materials for this paper name
    const materials = await DatabaseService.getAllMaterials();
    
    console.log('Paper Details API Debug:', {
      requestedPaperName: paperName,
      decodedPaperName,
      totalMaterials: materials?.length || 0,
      availableMaterialNames: materials?.map(m => m.name) || []
    });
    
    if (!materials || materials.length === 0) {
      return NextResponse.json([]);
    }

    // Filter materials by paper name and active status - use enhanced matching
    const paperMaterials = materials.filter(material => {
      if (material.status !== 'Active') return false;
      
      // Exact match first
      if (material.name === decodedPaperName) return true;
      
      // Partial match by name (e.g., "Coated Paper" matches "Coated Paper 350gsm")
      const cleanMaterialName = material.name.replace(/\d+gsm$/i, '').trim();
      if (cleanMaterialName.toLowerCase() === decodedPaperName.toLowerCase()) return true;
      
      // Try to find by base name
      const baseName = decodedPaperName.replace(/\d+gsm$/i, '').trim();
      if (baseName.toLowerCase() === cleanMaterialName.toLowerCase()) return true;
      
      // Enhanced fuzzy matching for similar names
      const words1 = material.name.toLowerCase().split(/\s+/);
      const words2 = decodedPaperName.toLowerCase().split(/\s+/);
      const commonWords = words1.filter(w => words2.includes(w));
      if (commonWords.length >= Math.min(words1.length, words2.length) * 0.6) return true;
      
      // Try to match by paper type (e.g., "Premium Card Stock" might match "Cardboard")
      const paperType1 = material.name.toLowerCase().replace(/\d+gsm$/i, '').trim();
      const paperType2 = decodedPaperName.toLowerCase().replace(/\d+gsm$/i, '').trim();
      
      // Check if one paper type contains the other
      if (paperType1.includes(paperType2) || paperType2.includes(paperType1)) return true;
      
      // Check for similar paper categories
      const similarCategories = {
        'card stock': ['cardboard', 'art paper', 'coated paper'],
        'premium': ['cardboard', 'art paper', 'coated paper', 'glossy paper'],
        'business card': ['cardboard', 'art paper'],
        'letterhead': ['bond paper', 'uncoated paper'],
        'brochure': ['coated paper', 'glossy paper', 'matte paper']
      };
      
      for (const [category, alternatives] of Object.entries(similarCategories)) {
        if (paperType2.includes(category) || paperType1.includes(category)) {
          if (alternatives.some(alt => paperType1.includes(alt) || paperType2.includes(alt))) {
            return true;
          }
        }
      }
      
      return false;
    });
    
    console.log('Filtered materials:', {
      filteredCount: paperMaterials.length,
      filteredNames: paperMaterials.map(m => m.name)
    });
    
    if (paperMaterials.length === 0) {
      // Return a meaningful response for papers not found in database
      console.log(`No materials found for paper: ${decodedPaperName}`);
      
      // Find similar papers based on keywords
      const similarPapers = materials.filter(material => {
        if (material.status !== 'Active') return false;
        
        const paperType = material.name.toLowerCase().replace(/\d+gsm$/i, '').trim();
        const searchTerms = decodedPaperName.toLowerCase().split(/\s+/);
        
        // Check if any search terms match the paper type
        return searchTerms.some(term => 
          paperType.includes(term) || 
          term.includes(paperType) ||
          (term === 'premium' && ['cardboard', 'art paper', 'coated paper'].some(alt => paperType.includes(alt))) ||
          (term === 'card' && ['cardboard', 'art paper'].some(alt => paperType.includes(alt))) ||
          (term === 'stock' && ['cardboard', 'art paper', 'coated paper'].some(alt => paperType.includes(alt)))
        );
      });
      
      return NextResponse.json({
        paperName: decodedPaperName,
        gsmDetails: [],
        totalSuppliers: 0,
        totalMaterials: 0,
        message: `Paper "${decodedPaperName}" was not found in the supplier database. This may be a custom paper from a quote template.`,
        availableAlternatives: materials.slice(0, 5).map(m => ({ name: m.name, gsm: m.gsm })),
        similarPapers: similarPapers.slice(0, 5).map(m => ({ 
          name: m.name, 
          gsm: m.gsm,
          supplier: m.supplier?.name,
          cost: m.cost,
          unit: m.unit
        })),
        suggestion: similarPapers.length > 0 
          ? `Found ${similarPapers.length} similar papers that might match your needs.`
          : "Consider selecting from the available alternatives above."
      });
    }

    // Group by GSM and collect supplier information
    const paperDetails = paperMaterials.reduce((acc: any, material) => {
      const gsm = material.gsm || 'Unknown';
      
      if (!acc[gsm]) {
        acc[gsm] = {
          gsm,
          suppliers: [],
          totalCost: 0,
          averageCost: 0,
          materialCount: 0
        };
      }
      
      // Add supplier information
      if (material.supplier) {
        const supplierInfo = {
          id: material.supplier.id,
          name: material.supplier.name,
          contact: material.supplier.contact,
          email: material.supplier.email,
          phone: material.supplier.phone,
          countryCode: material.supplier.countryCode,
          address: material.supplier.address,
          city: material.supplier.city,
          state: material.supplier.state,
          country: material.supplier.country,
          cost: material.cost,
          unit: material.unit,
          lastUpdated: material.lastUpdated
        };
        
        acc[gsm].suppliers.push(supplierInfo);
        acc[gsm].totalCost += material.cost || 0;
        acc[gsm].materialCount += 1;
      }
      
      return acc;
    }, {});

    // Calculate averages and format the response
    const formattedDetails = Object.values(paperDetails).map((detail: any) => ({
      gsm: detail.gsm,
      suppliers: detail.suppliers,
      totalCost: detail.totalCost,
      averageCost: detail.materialCount > 0 ? detail.totalCost / detail.materialCount : 0,
      materialCount: detail.materialCount,
      costRange: {
        min: Math.min(...detail.suppliers.map((s: any) => s.cost || 0)),
        max: Math.max(...detail.suppliers.map((s: any) => s.cost || 0))
      }
    }));

    // Sort by GSM (numeric)
    formattedDetails.sort((a: any, b: any) => {
      const gsmA = parseInt(a.gsm) || 0;
      const gsmB = parseInt(b.gsm) || 0;
      return gsmA - gsmB;
    });

    return NextResponse.json({
      paperName: decodedPaperName,
      gsmDetails: formattedDetails,
      totalSuppliers: new Set(paperMaterials.map(m => m.supplier?.id)).size,
      totalMaterials: paperMaterials.length
    });

  } catch (error) {
    console.error('Error fetching paper details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch paper details' },
      { status: 500 }
    );
  }
}
