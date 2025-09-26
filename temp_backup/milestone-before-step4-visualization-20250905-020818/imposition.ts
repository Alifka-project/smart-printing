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
import { excelDigitalCalculation, excelOffsetCalculation } from './excel-calculation';

// === Imposition Calculation ===
export function computeImposition(
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

// === Digital Costing ===
export function calcDigitalCosting({
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
  allowRotate,
  useExcelLogic = true // NEW: Excel mode (default to true for accuracy)
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
  useExcelLogic?: boolean; // NEW: Optional Excel mode parameter
}): DigitalCostingResult[] {
  // Use Excel calculation logic if enabled (default for accuracy)
  if (useExcelLogic) {
    return excelDigitalCalculation({
      qty,
      piece,
      sides,
      colorsF,
      colorsB,
      parent,
      allowRotate
    });
  }

  // Legacy calculation logic (kept as backup)
  const colors = colorsF + (sides === 2 ? (colorsB ?? 0) : 0);

  return options.map(option => {
    const fitCount = (pw: Cm, ph: Cm, sw: Cm, sh: Cm) => 
      Math.floor(pw / sw) * Math.floor(ph / sh);

    const a = fitCount(parent.w, parent.h, option.w, option.h);
    const b = fitCount(parent.w, parent.h, option.h, option.w);
    const cutPerParent = Math.max(a, b);

    if (!cutPerParent) return null;

    const impo = computeImposition(
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

// === Offset Costing ===
export function calcOffsetCosting({
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
  allowRotate,
  useExcelLogic = true // NEW: Excel mode (default to true for accuracy)
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
  useExcelLogic?: boolean; // NEW: Optional Excel mode parameter
}): OffsetCostingResult {
  // Use Excel calculation logic if enabled (default for accuracy)
  if (useExcelLogic) {
    return excelOffsetCalculation({
      qty,
      piece,
      sides,
      colorsF,
      colorsB,
      parent,
      allowRotate
    });
  }

  // Legacy calculation logic (kept as backup)
  const ppp = pressPerParent(parent, press);
  if (!ppp) throw new Error("Press size not cuttable from parent.");

  const impo = computeImposition(press, piece, bleed, { x: gapX, y: gapY }, margins, allowRotate);
  const ups = impo.yield;
  const pressSheets = Math.ceil(qty / ups) + pricing.makeReadySheets;
  const parents = Math.ceil(pressSheets / ppp);

  const plates = colorsF + (sides === 2 ? (colorsB ?? 0) : 0);
  const paper = parents * pricing.parentCost;
  const platesC = plates * pricing.plateCost;
  const mkready = pricing.makeReadySetup + pricing.makeReadySheets * (pricing.parentCost / ppp);
  const run = (pressSheets * sides) * (pricing.runPer1000 / 1000);
  const cutting = cutOps(impo.cols, impo.rows) * pricing.cutOpRate * pressSheets;
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

// === Helper Functions ===
export function cutOps(cols: number, rows: number): number {
  return (cols && rows) ? 4 + (cols - 1) + cols * (rows - 1) : 0;
}

// === Create ImpositionInput DTO ===
export function createImpositionInput({
  product,
  selectedDigitalOption,
  selectedPress,
  allowRotate = true,
  staggerForDie = false
}: {
  product: any;
  selectedDigitalOption?: { w: Cm; h: Cm; label: string };
  selectedPress?: { w: Cm; h: Cm; label: string };
  allowRotate?: boolean;
  staggerForDie?: boolean;
}) {
  const piece = product.flatSize;
  const bleed = product.bleed || 0.5;
  const gap = product.gap || 0.5;
  
  // Determine press/sheet dimensions
  let press;
  if (selectedDigitalOption) {
    press = {
      w_mm: cmToMm(selectedDigitalOption.w),
      h_mm: cmToMm(selectedDigitalOption.h),
      label: selectedDigitalOption.label
    };
  } else if (selectedPress) {
    press = {
      w_mm: cmToMm(selectedPress.w),
      h_mm: cmToMm(selectedPress.h),
      label: selectedPress.label
    };
  } else {
    throw new Error("Either digital option or press must be selected");
  }

  // Create base imposition input
  const impositionInput: any = {
    parent: {
      w_mm: cmToMm(PARENT.w),
      h_mm: cmToMm(PARENT.h)
    },
    press,
    margins_mm: {
      left: cmToMm(MARGINS.left),
      right: cmToMm(MARGINS.right),
      top: cmToMm(MARGINS.top),
      bottom: cmToMm(MARGINS.bottom),
      gripperTop: cmToMm(MARGINS.gripperTop)
    },
    piece_mm: {
      w: cmToMm(piece.width),
      h: cmToMm(piece.height)
    },
    bleed_mm: cmToMm(bleed),
    gapX_mm: cmToMm(gap),
    gapY_mm: cmToMm(gap),
    allowRotate,
    staggerForDie
  };

  // Add extras based on product type
  const extras: any = {};

  // Handle cups
  if (product.productName === 'Cups' && product.cupSizeOz) {
    const seamOverlap = CUP_SEAM_OVERLAP[product.cupSizeOz as keyof typeof CUP_SEAM_OVERLAP] || 0.4;
    extras.seamOverlap_mm = cmToMm(seamOverlap);
  }

  // Handle shopping bags
  if (product.productName === 'Shopping Bag' && product.gusset) {
    extras.bagPanels_mm = {
      frontBack: {
        w: cmToMm(piece.width),
        h: cmToMm(piece.height)
      },
      gusset: {
        w: cmToMm(product.gusset),
        h: cmToMm(piece.height)
      },
      bottom: {
        w: cmToMm(piece.width),
        h: cmToMm(product.gusset)
      },
      glueSeam_mm: cmToMm(BAG_GLUE_SEAM),
      lip_mm: cmToMm(BAG_LIP)
    };
  }

  if (Object.keys(extras).length > 0) {
    impositionInput.extras = extras;
  }

  return impositionInput;
}
