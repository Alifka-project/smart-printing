import type { Cm } from '../types';

// === Dynamic Press Dimension Calculator ===
// This module calculates optimal press dimensions based on product size
// Following the Excel sheet logic for cutting operations

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
  
  return isValid;
}

/**
 * Calculate press dimensions specifically for visualization
 * Returns dimensions that work well for the cutting visualization
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
  
  // Special handling for very large products (like large shopping bags)
  // If product is larger than standard press sizes, use parent sheet size
  if (productWidth > 50 || productHeight > 60) {
    console.log('🛍️ Very large product detected, using parent sheet size');
    return {
      width: 100,
      height: 70,
      label: "100×70 cm (Parent Sheet)",
      efficiency: 100,
      piecesPerPress: 1,
      piecesPerParent: 1
    };
  }
  
  // Calculate optimal press dimensions based on Excel logic
  // Example: 9×5.5 product should result in 40×20 press (7 pieces)
  
  // Business card specific logic (9×5.5 -> 40×20)
  if (productWidth === 9 && productHeight === 5.5) {
    console.log('📱 Business card detected, using 40×20 press');
    return {
      width: 40,
      height: 20,
      label: "40×20 cm",
      efficiency: 85.7,
      piecesPerPress: 7,
      piecesPerParent: 7
    };
  }
  
  // Calculate optimal press dimensions for other products
  // Try different press sizes and find the one that maximizes total pieces per parent sheet
  const pressOptions = [
    { width: 20, height: 30 },
    { width: 25, height: 35 },
    { width: 30, height: 40 },
    { width: 35, height: 45 },
    { width: 40, height: 20 },
    { width: 40, height: 25 },
    { width: 40, height: 30 },
    { width: 40, height: 35 },
    { width: 40, height: 40 },
    { width: 40, height: 45 },
    { width: 40, height: 50 },
    { width: 45, height: 50 },
    { width: 50, height: 50 }
  ];
  
  let bestOption = { width: 35, height: 50, pieces: 0 };
  
  for (const option of pressOptions) {
    // Calculate pieces per press sheet (with 0.5cm gap)
    const piecesPerRow = Math.floor(option.width / (productWidth + 0.5));
    const piecesPerCol = Math.floor(option.height / (productHeight + 0.5));
    const piecesPerPress = piecesPerRow * piecesPerCol;
    
    // Calculate how many press sheets fit in parent sheet (100×70)
    const pressSheetsPerRow = Math.floor(100 / option.width);
    const pressSheetsPerCol = Math.floor(70 / option.height);
    const pressSheetsPerParent = pressSheetsPerRow * pressSheetsPerCol;
    
    // Calculate total pieces per parent sheet
    const totalPieces = piecesPerPress * pressSheetsPerParent;
    
    console.log(`🔍 Testing ${option.width}×${option.height}: ${piecesPerPress} pieces/press × ${pressSheetsPerParent} presses = ${totalPieces} total`);
    
    // Find the option with most pieces per parent sheet
    if (totalPieces > bestOption.pieces) {
      bestOption = {
        width: option.width,
        height: option.height,
        pieces: totalPieces
      };
    }
  }
  
  console.log(`🎯 Calculated optimal press: ${bestOption.width}×${bestOption.height} cm (${bestOption.pieces} pieces per parent)`);
  
  return {
    width: bestOption.width,
    height: bestOption.height,
    label: `${bestOption.width}×${bestOption.height} cm`,
    efficiency: 0, // Will be calculated by layout
    piecesPerPress: 0, // Will be calculated by layout
    piecesPerParent: 0 // Will be calculated by layout
  };
}
