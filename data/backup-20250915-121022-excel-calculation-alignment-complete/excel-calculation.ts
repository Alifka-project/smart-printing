import type { 
  Cm, 
  DigitalPricing, 
  OffsetPricing, 
  DigitalCostingResult, 
  OffsetCostingResult 
} from '../types';

// === Excel Calculation Constants (from Excel analysis) ===
export const EXCEL_DIGITAL_CONSTANTS = {
  perClick: 0.10,        // AED per click (from Excel)
  parentSheetCost: 5.00, // AED per parent sheet (from Excel)
  wasteParents: 3        // Fixed waste sheets (from Excel)
};

export const EXCEL_OFFSET_CONSTANTS = {
  parentCost: 8.00,      // AED per parent sheet (from Excel)
  plateCost: 120.00,     // AED per plate (from Excel)
  makeReadySetup: 200.00, // AED setup cost (from Excel)
  makeReadySheets: 10,   // Number of make-ready sheets (from Excel)
  runPer1000: 60.00,     // AED per 1000 impressions (from Excel)
  cutOpRate: 8.00        // AED per cut operation (from Excel)
};

// === Excel Digital Calculation (Exact Excel Formulas) ===
export function excelDigitalCalculation({
  qty,
  piece,
  sides,
  colorsF,
  colorsB,
  parent = { w: 100, h: 70 }, // Default parent sheet size
  allowRotate = true
}: {
  qty: number;
  piece: { w: Cm; h: Cm };
  sides: 1 | 2;
  colorsF: 1 | 2 | 4;
  colorsB?: 1 | 2 | 4;
  parent?: { w: Cm; h: Cm };
  allowRotate?: boolean;
}): DigitalCostingResult[] {
  
  const colors = colorsF + (sides === 2 ? (colorsB ?? 0) : 0);
  
  // Excel Formula: ROUNDDOWN((Sheet Width) / (height + 1), 0) × ROUNDDOWN((Sheet Height) / (width + 1), 0)
  const calculateUpsOption1 = (sheetW: number, sheetH: number, pieceW: number, pieceH: number) => {
    const cols = Math.floor(sheetW / (pieceW + 1));
    const rows = Math.floor(sheetH / (pieceH + 1));
    return cols * rows;
  };

  // Excel Formula: ROUNDDOWN((Sheet Width) / (width + 1), 0) × ROUNDDOWN((Sheet Height) / (height + 1), 0)
  const calculateUpsOption2 = (sheetW: number, sheetH: number, pieceW: number, pieceH: number) => {
    const cols = Math.floor(sheetW / (pieceH + 1));
    const rows = Math.floor(sheetH / (pieceW + 1));
    return cols * rows;
  };

  // Excel Formula: IF(Option 1 > Option 2, Option 1, Option 2)
  const getBestUps = (option1: number, option2: number) => {
    return Math.max(option1, option2);
  };

  // Excel Formula: ROUNDUP(Quantity / ups per sheet + Waste Sheets, 0)
  const calculateSheets = (quantity: number, upsPerSheet: number) => {
    if (upsPerSheet === 0) return 0;
    return Math.ceil(quantity / upsPerSheet + EXCEL_DIGITAL_CONSTANTS.wasteParents);
  };

  // Excel Formula: Sheets × Cut pieces × Per click × Sides
  const calculateClickCost = (sheets: number, cutPieces: number, perClick: number, sides: number) => {
    return sheets * cutPieces * perClick * sides;
  };

  // Calculate for different sheet sizes (matching Excel options)
  const sheetOptions = [
    { w: 48, h: 33, label: "48×33 cm" },
    { w: 70, h: 33, label: "70×33 cm" },
    { w: 100, h: 33, label: "100×33 cm" }
  ];

  return sheetOptions.map(option => {
    // Calculate UPS for both orientations
    const upsOption1 = calculateUpsOption1(option.w, option.h, piece.w, piece.h);
    const upsOption2 = allowRotate ? calculateUpsOption2(option.w, option.h, piece.w, piece.h) : 0;
    
    // Get best UPS (Excel formula)
    const bestUps = getBestUps(upsOption1, upsOption2);
    
    if (bestUps === 0) return null;

    // Calculate sheets needed (Excel formula)
    const sheets = calculateSheets(qty, bestUps);
    
    // Calculate costs
    const paper = sheets * EXCEL_DIGITAL_CONSTANTS.parentSheetCost;
    const clicks = calculateClickCost(sheets, bestUps, EXCEL_DIGITAL_CONSTANTS.perClick, sides);
    const total = paper + clicks;

    return {
      option: option.label,
      cutPerParent: bestUps,
      upsPerSheet: bestUps,
      upsPerParent: bestUps,
      parents: sheets,
      paper,
      clicks,
      total
    };
  }).filter(Boolean) as DigitalCostingResult[];
}

// === Excel Offset Calculation (Exact Excel Formulas) ===
export function excelOffsetCalculation({
  qty,
  piece,
  sides,
  colorsF,
  colorsB,
  parent = { w: 100, h: 70 }, // Default parent sheet size
  allowRotate = true
}: {
  qty: number;
  piece: { w: Cm; h: Cm };
  sides: 1 | 2;
  colorsF: 1 | 2 | 4;
  colorsB?: 1 | 2 | 4;
  parent?: { w: Cm; h: Cm };
  allowRotate?: boolean;
}): OffsetCostingResult {
  
  const colors = colorsF + (sides === 2 ? (colorsB ?? 0) : 0);
  
  // Excel Formula: ROUNDDOWN((Sheet Width) / (height + 1), 0) × ROUNDDOWN((Sheet Height) / (width + 1), 0)
  const calculateUpsOption1 = (sheetW: number, sheetH: number, pieceW: number, pieceH: number) => {
    const cols = Math.floor(sheetW / (pieceW + 1));
    const rows = Math.floor(sheetH / (pieceH + 1));
    return cols * rows;
  };

  // Excel Formula: ROUNDDOWN((Sheet Width) / (width + 1), 0) × ROUNDDOWN((Sheet Height) / (height + 1), 0)
  const calculateUpsOption2 = (sheetW: number, sheetH: number, pieceW: number, pieceH: number) => {
    const cols = Math.floor(sheetW / (pieceH + 1));
    const rows = Math.floor(sheetH / (pieceW + 1));
    return cols * rows;
  };

  // Excel Formula: IF(Option 1 > Option 2, Option 1, Option 2)
  const getBestUps = (option1: number, option2: number) => {
    return Math.max(option1, option2);
  };

  // Excel Formula: ROUNDUP(IF(Sheet Width > 50, 120/Cut pieces, 100/Cut pieces), 0)
  const calculateWasteSheets = (sheetW: number, cutPieces: number) => {
    const wasteBase = sheetW > 50 ? 120 : 100;
    return Math.ceil(wasteBase / cutPieces);
  };

  // Excel Formula: ROUNDUP(Quantity / ups per sheet + Waste Sheets, 0)
  const calculateSheets = (quantity: number, upsPerSheet: number, wasteSheets: number) => {
    if (upsPerSheet === 0) return 0;
    return Math.ceil(quantity / upsPerSheet + wasteSheets);
  };

  // Excel Formula: IF(Sheets = 0, 0, unit price + paper cost + Plate cost × 2)
  const calculatePlateCost = (sheets: number, unitPrice: number, paperCost: number, plateCost: number) => {
    if (sheets === 0) return 0;
    return unitPrice + paperCost + (plateCost * 2);
  };

  // Use standard press size (35×50 cm) for offset calculations
  const press = { w: 35, h: 50 };
  
  // Calculate UPS for both orientations
  const upsOption1 = calculateUpsOption1(press.w, press.h, piece.w, piece.h);
  const upsOption2 = allowRotate ? calculateUpsOption2(press.w, press.h, piece.w, piece.h) : 0;
  
  // Get best UPS (Excel formula)
  const bestUps = getBestUps(upsOption1, upsOption2);
  
  if (bestUps === 0) {
    throw new Error("Press size not cuttable from parent.");
  }

  // Calculate waste sheets (Excel formula)
  const wasteSheets = calculateWasteSheets(press.w, bestUps);
  
  // Calculate sheets needed (Excel formula)
  const pressSheets = calculateSheets(qty, bestUps, wasteSheets);
  
  // Calculate press per parent
  const pressPerParent = Math.floor(parent.w / press.w) * Math.floor(parent.h / press.h);
  const parents = Math.ceil(pressSheets / pressPerParent);

  // Calculate costs
  const plates = colors;
  const paper = parents * EXCEL_OFFSET_CONSTANTS.parentCost;
  const platesC = plates * EXCEL_OFFSET_CONSTANTS.plateCost;
  const mkready = EXCEL_OFFSET_CONSTANTS.makeReadySetup + (EXCEL_OFFSET_CONSTANTS.makeReadySheets * (EXCEL_OFFSET_CONSTANTS.parentCost / pressPerParent));
  const run = (pressSheets * sides) * (EXCEL_OFFSET_CONSTANTS.runPer1000 / 1000);
  
  // Calculate cutting operations
  const cols = Math.floor(press.w / (piece.w + 1));
  const rows = Math.floor(press.h / (piece.h + 1));
  const cutOps = (cols && rows) ? 4 + (cols - 1) + cols * (rows - 1) : 0;
  const cutting = cutOps * EXCEL_OFFSET_CONSTANTS.cutOpRate * pressSheets;
  
  const total = paper + platesC + mkready + run + cutting;

  return {
    pressPerParent,
    upsPerPress: bestUps,
    pressSheets,
    parents,
    plates,
    paper,
    platesC,
    mkready,
    run,
    cutting,
    total
  };
}

// === Excel Formula Validation ===
export function validateExcelFormulas() {
  console.log('🔍 Validating Excel Formulas...');
  
  // Test Digital Calculation
  const digitalTest = excelDigitalCalculation({
    qty: 1000,
    piece: { w: 5.5, h: 9 },
    sides: 4,
    colorsF: 4
  });
  
  console.log('📱 Digital Test Results:', digitalTest);
  
  // Test Offset Calculation
  const offsetTest = excelOffsetCalculation({
    qty: 3000,
    piece: { w: 21, h: 29 },
    sides: 2,
    colorsF: 2
  });
  
  console.log('🖨️ Offset Test Results:', offsetTest);
  
  // Validate constants alignment
  const constantsValidation = validatePricingConstants(
    EXCEL_DIGITAL_CONSTANTS,
    EXCEL_OFFSET_CONSTANTS
  );
  
  if (constantsValidation.isValid) {
    console.log('✅ Excel Constants Validation: PASSED');
  } else {
    console.warn('⚠️ Excel Constants Validation: FAILED', constantsValidation.errors);
  }
  
  return { digitalTest, offsetTest, constantsValidation };
}

// === Calculation Alignment Validation ===
export function validateCalculationAlignment(
  codeResult: number,
  excelResult: number,
  tolerance: number = 0.01
): boolean {
  const difference = Math.abs(codeResult - excelResult);
  const isAligned = difference <= tolerance;
  
  if (!isAligned) {
    console.warn(`⚠️ Calculation misalignment detected:`, {
      codeResult,
      excelResult,
      difference,
      tolerance
    });
  }
  
  return isAligned;
}

// === Pricing Constants Validation ===
export function validatePricingConstants(
  digitalPricing: any,
  offsetPricing: any
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Validate Digital Pricing
  if (digitalPricing.perClick !== EXCEL_DIGITAL_CONSTANTS.perClick) {
    errors.push(`Digital perClick mismatch: ${digitalPricing.perClick} vs ${EXCEL_DIGITAL_CONSTANTS.perClick}`);
  }
  if (digitalPricing.parentSheetCost !== EXCEL_DIGITAL_CONSTANTS.parentSheetCost) {
    errors.push(`Digital parentSheetCost mismatch: ${digitalPricing.parentSheetCost} vs ${EXCEL_DIGITAL_CONSTANTS.parentSheetCost}`);
  }
  if (digitalPricing.wasteParents !== EXCEL_DIGITAL_CONSTANTS.wasteParents) {
    errors.push(`Digital wasteParents mismatch: ${digitalPricing.wasteParents} vs ${EXCEL_DIGITAL_CONSTANTS.wasteParents}`);
  }
  
  // Validate Offset Pricing
  if (offsetPricing.parentCost !== EXCEL_OFFSET_CONSTANTS.parentCost) {
    errors.push(`Offset parentCost mismatch: ${offsetPricing.parentCost} vs ${EXCEL_OFFSET_CONSTANTS.parentCost}`);
  }
  if (offsetPricing.plateCost !== EXCEL_OFFSET_CONSTANTS.plateCost) {
    errors.push(`Offset plateCost mismatch: ${offsetPricing.plateCost} vs ${EXCEL_OFFSET_CONSTANTS.plateCost}`);
  }
  if (offsetPricing.makeReadySetup !== EXCEL_OFFSET_CONSTANTS.makeReadySetup) {
    errors.push(`Offset makeReadySetup mismatch: ${offsetPricing.makeReadySetup} vs ${EXCEL_OFFSET_CONSTANTS.makeReadySetup}`);
  }
  if (offsetPricing.runPer1000 !== EXCEL_OFFSET_CONSTANTS.runPer1000) {
    errors.push(`Offset runPer1000 mismatch: ${offsetPricing.runPer1000} vs ${EXCEL_OFFSET_CONSTANTS.runPer1000}`);
  }
  if (offsetPricing.cutOpRate !== EXCEL_OFFSET_CONSTANTS.cutOpRate) {
    errors.push(`Offset cutOpRate mismatch: ${offsetPricing.cutOpRate} vs ${EXCEL_OFFSET_CONSTANTS.cutOpRate}`);
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}



