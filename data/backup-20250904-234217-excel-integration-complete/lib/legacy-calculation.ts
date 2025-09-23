import type { 
  Cm, 
  MarginsCm, 
  DigitalPricing, 
  OffsetPricing, 
  DigitalCostingResult, 
  OffsetCostingResult 
} from '../types';
import { 
  PARENT, 
  MARGINS, 
  DIGITAL_OPTIONS, 
  cmToMm, 
  pressPerParent,
  CUP_SEAM_OVERLAP,
  BAG_GLUE_SEAM,
  BAG_LIP
} from '../constants/printing-config';

// === LEGACY CALCULATION LOGIC (BACKUP) ===
// This file contains the original calculation logic as backup
// DO NOT MODIFY - This is preserved for safety and rollback purposes

// === Legacy Imposition Calculation ===
export function legacyComputeImposition(
  sheet: { w: Cm; h: Cm },
  piece: { w: Cm; h: Cm },
  bleed: Cm,
  gaps: { x: Cm; y: Cm },
  margins: MarginsCm,
  allowRotate: boolean
) {
  const printW = sheet.w - (margins.left + margins.right);
  const printH = sheet.h - (margins.top + margins.bottom + margins.gripperTop);

  const fit = (w: Cm, h: Cm) => {
    const unitW = w + 2 * bleed;
    const unitH = h + 2 * bleed;
    const cols = Math.max(0, Math.floor((printW + gaps.x) / (unitW + gaps.x)));
    const rows = Math.max(0, Math.floor((printH + gaps.y) / (unitH + gaps.y)));
    return { cols, rows, yield: cols * rows };
  };

  const normal = fit(piece.w, piece.h);
  if (!allowRotate) return normal;

  const rotated = fit(piece.h, piece.w);
  return rotated.yield > normal.yield ? rotated : normal;
}

// === Legacy Digital Costing ===
export function legacyCalcDigitalCosting({
  qty,
  parent = PARENT,
  options = DIGITAL_OPTIONS,
  piece,
  bleed,
  gapX,
  gapY,
  margins = MARGINS,
  sides,
  colorsF,
  colorsB,
  perClick,
  parentCost,
  wasteParents = 0,
  allowRotate
}: {
  qty: number;
  parent?: { w: Cm; h: Cm };
  options?: readonly { w: Cm; h: Cm; label: string }[];
  piece: { w: Cm; h: Cm };
  bleed: Cm;
  gapX: Cm;
  gapY: Cm;
  margins?: MarginsCm;
  sides: 1 | 2;
  colorsF: 1 | 2 | 4;
  colorsB?: 1 | 2 | 4;
  perClick: number;
  parentCost: number;
  wasteParents?: number;
  allowRotate: boolean;
}): DigitalCostingResult[] {
  const colors = colorsF + (sides === 2 ? (colorsB ?? 0) : 0);

  return options.map(option => {
    const fitCount = (pw: Cm, ph: Cm, sw: Cm, sh: Cm) => 
      Math.floor(pw / sw) * Math.floor(ph / sh);

    const a = fitCount(parent.w, parent.h, option.w, option.h);
    const b = fitCount(parent.w, parent.h, option.h, option.w);
    const cutPerParent = Math.max(a, b);

    if (!cutPerParent) return null;

    const impo = legacyComputeImposition(
      { w: option.w, h: option.h },
      piece,
      bleed,
      { x: gapX, y: gapY },
      margins,
      allowRotate
    );

    const upsPerParent = cutPerParent * impo.yield;
    const parents = Math.ceil(qty / upsPerParent) + wasteParents;

    const paper = parents * parentCost;
    const clicks = parents * sides * colors * perClick;
    const total = paper + clicks;

    return {
      option: option.label,
      cutPerParent,
      upsPerSheet: impo.yield,
      upsPerParent,
      parents,
      paper,
      clicks,
      total
    };
  }).filter(Boolean) as DigitalCostingResult[];
}

// === Legacy Offset Costing ===
export function legacyCalcOffsetCosting({
  qty,
  parent = PARENT,
  press,
  piece,
  bleed,
  gapX,
  gapY,
  margins = MARGINS,
  sides,
  colorsF,
  colorsB,
  pricing,
  allowRotate
}: {
  qty: number;
  parent?: { w: Cm; h: Cm };
  press: { w: Cm; h: Cm; label: string };
  piece: { w: Cm; h: Cm };
  bleed: Cm;
  gapX: Cm;
  gapY: Cm;
  margins?: MarginsCm;
  sides: 1 | 2;
  colorsF: 1 | 2 | 4;
  colorsB?: 1 | 2 | 4;
  pricing: OffsetPricing;
  allowRotate: boolean;
}): OffsetCostingResult {
  const ppp = pressPerParent(parent, press);
  if (!ppp) throw new Error("Press size not cuttable from parent.");

  const impo = legacyComputeImposition(press, piece, bleed, { x: gapX, y: gapY }, margins, allowRotate);
  const ups = impo.yield;
  const pressSheets = Math.ceil(qty / ups) + pricing.makeReadySheets;
  const parents = Math.ceil(pressSheets / ppp);

  const plates = colorsF + (sides === 2 ? (colorsB ?? 0) : 0);
  const paper = parents * pricing.parentCost;
  const platesC = plates * pricing.plateCost;
  const mkready = pricing.makeReadySetup + pricing.makeReadySheets * (pricing.parentCost / ppp);
  const run = (pressSheets * sides) * (pricing.runPer1000 / 1000);
  const cutting = legacyCutOps(impo.cols, impo.rows) * pricing.cutOpRate * pressSheets;
  const total = paper + platesC + mkready + run + cutting;

  return {
    pressPerParent: ppp,
    upsPerPress: ups,
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

// === Legacy Helper Functions ===
export function legacyCutOps(cols: number, rows: number): number {
  return (cols && rows) ? 4 + (cols - 1) + cols * (rows - 1) : 0;
}

// === Legacy Default Pricing Constants ===
export const LEGACY_DEFAULT_DIGITAL_PRICING: DigitalPricing = {
  perClick: 0.05,
  parentSheetCost: 2.50,
  wasteParents: 0
};

export const LEGACY_DEFAULT_OFFSET_PRICING: OffsetPricing = {
  parentCost: 2.50,
  plateCost: 25.00,
  makeReadySetup: 50.00,
  makeReadySheets: 10,
  runPer1000: 15.00,
  cutOpRate: 2.00
};

// === Legacy Validation Function ===
export function validateLegacyFormulas() {
  console.log('🔍 Validating Legacy Formulas...');
  
  // Test Legacy Digital Calculation
  const legacyDigitalTest = legacyCalcDigitalCosting({
    qty: 1000,
    piece: { w: 5.5, h: 9 },
    bleed: 0.5,
    gapX: 0.5,
    gapY: 0.5,
    sides: 4,
    colorsF: 4,
    perClick: 0.05,
    parentCost: 2.50,
    allowRotate: true
  });
  
  console.log('📱 Legacy Digital Test Results:', legacyDigitalTest);
  
  // Test Legacy Offset Calculation
  const legacyOffsetTest = legacyCalcOffsetCosting({
    qty: 3000,
    press: { w: 35, h: 50, label: "35×50 cm" },
    piece: { w: 21, h: 29 },
    bleed: 0.5,
    gapX: 0.5,
    gapY: 0.5,
    sides: 2,
    colorsF: 2,
    pricing: LEGACY_DEFAULT_OFFSET_PRICING,
    allowRotate: true
  });
  
  console.log('🖨️ Legacy Offset Test Results:', legacyOffsetTest);
  
  return { legacyDigitalTest, legacyOffsetTest };
}
