// Define Cm type locally since types module might not be available
type Cm = number;

// === Dynamic Press Dimension Calculator ===
// This module calculates optimal press dimensions based on product size
// Following the Excel sheet logic for cutting operations

// Units-table VLOOKUP (cumulative) in closed form - same as Excel
const unitPrice = (units: number) => {
  const u = Math.max(0, Math.floor(units));
  if (u <= 10) return 50 * u;
  if (u <= 20) return 60 * u - u * u; // 60u - u^2
  return 40 * u;
};

export interface PressDimension {
  width: Cm;
  height: Cm;
  label: string;
  efficiency: number; // Percentage of parent sheet utilized
  piecesPerPress: number;
  piecesPerParent: number;
}

export interface ProductDimensions {
  width: Cm;
  height: Cm;
}

export interface CuttingConstraints {
  parentWidth: Cm;
  parentHeight: Cm;
  minPressWidth: Cm;
  minPressHeight: Cm;
  maxPressWidth: Cm;
  maxPressHeight: Cm;
  cuttingMargin: Cm; // Margin for cutting operations
  gapBetweenPieces: Cm; // Gap between product pieces
}

// Default cutting constraints based on Excel analysis
export const DEFAULT_CUTTING_CONSTRAINTS: CuttingConstraints = {
  parentWidth: 100,
  parentHeight: 70,
  minPressWidth: 20,
  minPressHeight: 15,
  maxPressWidth: 100,
  maxPressHeight: 70,
  cuttingMargin: 1.0, // 1cm margin for cutting operations
  gapBetweenPieces: 0.5 // 0.5cm gap between pieces
};

/**
 * Calculate optimal press dimensions based on product size
 * Following Excel sheet logic: press dimensions should maximize cutting efficiency
 */
export function calculateOptimalPressDimensions(
  productDimensions: ProductDimensions,
  constraints: CuttingConstraints = DEFAULT_CUTTING_CONSTRAINTS
): PressDimension[] {
  const { width: productWidth, height: productHeight } = productDimensions;
  const { 
    parentWidth, 
    parentHeight, 
    minPressWidth, 
    minPressHeight, 
    maxPressWidth, 
    maxPressHeight,
    cuttingMargin,
    gapBetweenPieces
  } = constraints;

  console.log('🔍 Calculating optimal press dimensions for product:', productDimensions);
  console.log('📏 Using constraints:', constraints);

  const pressOptions: PressDimension[] = [];

  // Calculate all possible press dimensions that fit within parent sheet
  // with reasonable cutting margins
  const stepSize = 5; // 5cm increments for press dimensions
  
  for (let pressWidth = minPressWidth; pressWidth <= maxPressWidth; pressWidth += stepSize) {
    for (let pressHeight = minPressHeight; pressHeight <= maxPressHeight; pressHeight += stepSize) {
      
      // Check if press fits within parent sheet with margins
      if (pressWidth + cuttingMargin <= parentWidth && 
          pressHeight + cuttingMargin <= parentHeight) {
        
        // Calculate how many pieces fit on this press sheet
        const piecesPerPress = calculatePiecesPerPress(
          pressWidth, 
          pressHeight, 
          productWidth, 
          productHeight, 
          gapBetweenPieces
        );
        
        // Calculate how many press sheets fit in parent sheet
        const pressSheetsPerParent = calculatePressSheetsPerParent(
          parentWidth, 
          parentHeight, 
          pressWidth, 
          pressHeight
        );
        
        // Calculate total pieces per parent sheet
        const piecesPerParent = piecesPerPress * pressSheetsPerParent;
        
        // Calculate efficiency (percentage of parent sheet utilized)
        const efficiency = (piecesPerParent * productWidth * productHeight) / 
                          (parentWidth * parentHeight) * 100;
        
        if (piecesPerPress > 0 && pressSheetsPerParent > 0) {
          pressOptions.push({
            width: pressWidth,
            height: pressHeight,
            label: `${pressWidth}×${pressHeight} cm`,
            efficiency: Math.round(efficiency * 100) / 100,
            piecesPerPress,
            piecesPerParent
          });
        }
      }
    }
  }

  // Sort by efficiency (highest first)
  pressOptions.sort((a, b) => b.efficiency - a.efficiency);

  console.log('📊 Generated press options:', pressOptions.slice(0, 5)); // Log top 5 options

  return pressOptions;
}

/**
 * Calculate how many product pieces fit on a press sheet
 * Following Excel formula: ROUNDDOWN((Sheet Width) / (width + gap), 0) × ROUNDDOWN((Sheet Height) / (height + gap), 0)
 */
function calculatePiecesPerPress(
  pressWidth: Cm,
  pressHeight: Cm,
  productWidth: Cm,
  productHeight: Cm,
  gap: Cm
): number {
  // Option 1: Normal orientation
  const cols1 = Math.floor(pressWidth / (productWidth + gap));
  const rows1 = Math.floor(pressHeight / (productHeight + gap));
  const pieces1 = cols1 * rows1;

  // Option 2: Rotated orientation
  const cols2 = Math.floor(pressWidth / (productHeight + gap));
  const rows2 = Math.floor(pressHeight / (productWidth + gap));
  const pieces2 = cols2 * rows2;

  // Return the better option (Excel logic: IF(Option 1 > Option 2, Option 1, Option 2))
  return Math.max(pieces1, pieces2);
}

/**
 * Calculate how many press sheets fit in parent sheet
 * Following Excel logic for cutting operations
 */
function calculatePressSheetsPerParent(
  parentWidth: Cm,
  parentHeight: Cm,
  pressWidth: Cm,
  pressHeight: Cm
): number {
  // Calculate how many press sheets fit horizontally and vertically
  const horizontalFit = Math.floor(parentWidth / pressWidth);
  const verticalFit = Math.floor(parentHeight / pressHeight);
  
  return horizontalFit * verticalFit;
}

/**
 * Get the best press dimension for a given product
 * Returns the most efficient option
 */
export function getBestPressDimension(
  productDimensions: ProductDimensions,
  constraints: CuttingConstraints = DEFAULT_CUTTING_CONSTRAINTS
): PressDimension | null {
  const options = calculateOptimalPressDimensions(productDimensions, constraints);
  return options.length > 0 ? options[0] : null;
}

/**
 * Validate press dimensions against Excel examples
 * Test function to ensure calculations match Excel logic
 */
export function validatePressCalculations(): boolean {
  console.log('🧪 Validating press calculations against Excel examples...');
  
  // Test case: Business card (9×5.5) should result in press around 40×20
  const businessCardTest = getBestPressDimension({ width: 9, height: 5.5 });
  
  console.log('📱 Business card test result:', businessCardTest);
  
  // Expected: Should be around 40×20 with good efficiency
  const isValid = businessCardTest && 
                 businessCardTest.width >= 35 && 
                 businessCardTest.width <= 45 &&
                 businessCardTest.height >= 15 && 
                 businessCardTest.height <= 25;
  
  if (isValid) {
    console.log('✅ Press calculation validation: PASSED');
  } else {
    console.warn('⚠️ Press calculation validation: FAILED');
  }
  
  return isValid || false;
}

/**
 * Calculate press dimensions specifically for visualization
 * Returns dimensions that work well for the cutting visualization
 * Uses EXACT SAME logic as Excel calculation (pickCheapestTotal + calcRowTotal)
 */
export function calculateVisualizationPressDimensions(
  productDimensions: ProductDimensions,
  formData?: any
): PressDimension | null {
  // Use product dimensions from form data if available
  const productWidth = productDimensions.width;
  const productHeight = productDimensions.height;
  
  if (!productWidth || !productHeight) {
    console.warn('⚠️ Missing product dimensions for press calculation');
    return null;
  }
  
  console.log('🔍 Calculating visualization press dimensions for:', productDimensions);
  
  // Use EXACT SAME CUT_SIZE_CANDIDATES as Excel calculation
  const cutSizeCandidates = [
    { parentW: 20,   parentH: 14,    cutPcs: 25, label: "20×14 / Cp25" },
    { parentW: 20,   parentH: 17.5,  cutPcs: 20, label: "20×17.5 / Cp20" },
    { parentW: 23,   parentH: 14,    cutPcs: 21, label: "23×14 / Cp21" },
    { parentW: 23,   parentH: 16.5,  cutPcs: 18, label: "23×16.5 / Cp18" },
    { parentW: 23,   parentH: 20,    cutPcs: 15, label: "23×20 / Cp15" },
    { parentW: 25,   parentH: 14,    cutPcs: 20, label: "25×14 / Cp20" },
    { parentW: 25,   parentH: 17.5,  cutPcs: 16, label: "25×17.5 / Cp16" },
    { parentW: 25,   parentH: 20,    cutPcs: 14, label: "25×20 / Cp14" },
    { parentW: 25,   parentH: 23,    cutPcs: 12, label: "25×23 / Cp12" },
    { parentW: 28,   parentH: 14,    cutPcs: 17, label: "28×14 / Cp17" },
    { parentW: 30,   parentH: 14,    cutPcs: 16, label: "30×14 / Cp16" },
    { parentW: 30,   parentH: 17.5,  cutPcs: 13, label: "30×17.5 / Cp13" },
    { parentW: 30,   parentH: 20,    cutPcs: 11, label: "30×20 / Cp11" },
    { parentW: 30,   parentH: 23,    cutPcs: 9,  label: "30×23 / Cp9"  },
    { parentW: 35,   parentH: 14,    cutPcs: 14, label: "35×14 / Cp14" },
    { parentW: 35,   parentH: 17.5,  cutPcs: 11, label: "35×17.5 / Cp11" },
    { parentW: 35,   parentH: 20,    cutPcs: 10, label: "35×20 / Cp10" },
    { parentW: 35,   parentH: 23,    cutPcs: 8,  label: "35×23 / Cp8"  },
    { parentW: 35,   parentH: 25,    cutPcs: 7,  label: "35×25 / Cp7"  },
    { parentW: 40,   parentH: 14,    cutPcs: 12, label: "40×14 / Cp12" },
    { parentW: 40,   parentH: 17.5,  cutPcs: 10, label: "40×17.5 / Cp10" },
    { parentW: 40,   parentH: 20,    cutPcs: 8,  label: "40×20 / Cp8"  },
    { parentW: 40,   parentH: 23,    cutPcs: 7,  label: "40×23 / Cp7"  },
    { parentW: 40,   parentH: 25,    cutPcs: 6,  label: "40×25 / Cp6"  },
    { parentW: 40,   parentH: 30,    cutPcs: 5,  label: "40×30 / Cp5"  },
    { parentW: 40,   parentH: 35,    cutPcs: 4,  label: "40×35 / Cp4"  },
    { parentW: 45,   parentH: 20,    cutPcs: 7,  label: "45×20 / Cp7"  },
    { parentW: 45,   parentH: 25,    cutPcs: 5,  label: "45×25 / Cp5"  },
    { parentW: 45,   parentH: 30,    cutPcs: 4,  label: "45×30 / Cp4"  },
    { parentW: 45,   parentH: 35,    cutPcs: 3,  label: "45×35 / Cp3"  },
    { parentW: 50,   parentH: 20,    cutPcs: 6,  label: "50×20 / Cp6"  },
    { parentW: 50,   parentH: 25,    cutPcs: 5,  label: "50×25 / Cp5"  },
    { parentW: 50,   parentH: 30,    cutPcs: 4,  label: "50×30 / Cp4"  },
    { parentW: 50,   parentH: 35,    cutPcs: 4,  label: "50×35 / Cp4"  }
  ];
  
  // Use EXACT SAME logic as Excel calculation
  // Get form data values for accurate calculation
  const sides = formData?.products?.[0]?.sides === "1" ? 1 : 2;
  const colours = formData?.products?.[0]?.colours || 4;
  const qty = formData?.products?.[0]?.quantity || 1000;
  const paperCostPerSheet = 1; // Standard paper cost for visualization
  
  // Create base object for calcRowTotal
  const base = {
    pieceW: productWidth,
    pieceH: productHeight,
    qty: qty,
    sides: sides,
    colours: colours,
    paperCostPerSheet: paperCostPerSheet
  };
  
  // Use EXACT SAME pickCheapestTotal logic
  const rows = cutSizeCandidates.map(candidate => calcRowTotal(base, candidate));
  rows.sort((a, b) => a.total - b.total);
  const cheapestRow = rows[0]; // cheapest row
  
  if (cheapestRow) {
    console.log('🎯 Best cutting size found (Excel logic):', cheapestRow);
    
    // Calculate efficiency percentage
    const efficiency = (cheapestRow.upsPerSht * productWidth * productHeight) / 
                      (cheapestRow.parentW * cheapestRow.parentH) * 100;
    
    return {
      width: cheapestRow.parentW,
      height: cheapestRow.parentH,
      label: cheapestRow.label || `${cheapestRow.parentW}×${cheapestRow.parentH} cm`,
      efficiency: Math.round(efficiency * 100) / 100,
      piecesPerPress: cheapestRow.noOfUps,
      piecesPerParent: cheapestRow.cutPcs
    };
  }
  
  // Fallback: use parent sheet size for very large products
  console.log('⚠️ No optimal cutting size found, using parent sheet size');
  return {
    width: 100,
    height: 70,
    label: "100×70 cm (Parent Sheet)",
    efficiency: 100,
    piecesPerPress: 1,
    piecesPerParent: 1
  };
}

/**
 * EXACT COPY of calcRowTotal from Step4Operational.tsx
 * This ensures the visualization uses the same calculation logic
 */
function calcRowTotal(
  base: { pieceW: number; pieceH: number; qty: number; sides: number; colours: number; paperCostPerSheet: number },
  row: { parentW: number; parentH: number; cutPcs: number; label?: string }
) {
  const { pieceW, pieceH, qty, sides, colours, paperCostPerSheet } = base;
  const { parentW, parentH, cutPcs } = row;

  // 1) Imposition (Option1/2)
  const opt1 = Math.floor(parentW / (pieceH + 1)) * Math.floor(parentH / (pieceW + 1));
  const opt2 = Math.floor(parentW / (pieceW + 1)) * Math.floor(parentH / (pieceH + 1));
  const noOfUps = Math.max(opt1, opt2);

  // 2) Odd/even rule (IF(Sides=1, TRUE, ISEVEN(No. of ups)))
  const oddEven = (sides === 1) ? true : (noOfUps % 2 === 0);

  // 3) Ups/sheet; 4) Waste; 5) Sheets
  const upsPerSht   = noOfUps * cutPcs;
  const wasteSheets = Math.ceil((parentW > 50 ? 120 : 100) / cutPcs);
  const sheets      = upsPerSht === 0 ? 0 : Math.ceil(qty / upsPerSht + wasteSheets);

  // 6) Paper cost
  const paperCost = sheets * paperCostPerSheet;

  // 7) Units → 8) unit price
  const coreUnits = Math.ceil((sheets * cutPcs * colours * sides) / 1000);
  const baseUnits = Math.max(colours, coreUnits);
  const units     = oddEven ? baseUnits : baseUnits * 2;
  const unit_price = unitPrice(units);

  // 9) Plate
  const platePerSide = (parentW > 54 ? 50 : 20) * colours;
  const plateTotal   = platePerSide * sides;

  // 10) Total
  const total = sheets === 0 ? 0 : unit_price + paperCost + plateTotal;

  return { ...row, noOfUps, upsPerSht, wasteSheets, sheets, paperCost, units, unit_price, platePerSide, plateTotal, total };
}
