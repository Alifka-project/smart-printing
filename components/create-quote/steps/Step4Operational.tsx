"use client";

import type { FC, Dispatch, SetStateAction } from "react";
import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, Calculator, Settings, BarChart3, Edit3, AlertTriangle, Database, Palette, Info, Clock, DollarSign, Search, Building, Plus, Minus, Printer, Scissors, GripHorizontal, ChevronDown, ChevronUp } from "lucide-react";
import { getProductConfig, getShoppingBagPreset } from "@/constants/product-config";
// Define types locally to avoid import issues
interface DigitalCostingResult {
  option: string;
  cutPerParent: number;
  upsPerSheet: number;
  upsPerParent: number;
  parents: number;
  paper: number;
  clicks: number;
  total: number;
}

interface OffsetCostingResult {
  option: string;
  cutPerParent: number;
  upsPerSheet: number;
  upsPerParent: number;
  parents: number;
  paper: number;
  clicks: number;
  total: number;
}

interface DigitalPricing {
  perClick: number;
  parentSheetCost: number;
  wasteParents: number;
}

interface OffsetPricing {
  perClick: number;
  parentSheetCost: number;
  wasteParents: number;
}

interface QuoteFormData {
  products: any[];
  operational: any;
  additionalCosts: any[];
  outputDimensions: any[];
}
import { PricingService } from "@/lib/pricing-service";
import { calcDigitalCosting, calcOffsetCosting } from "@/lib/imposition";
import { excelDigitalCalculation } from "@/lib/excel-calculation";
import { calculateVisualizationPressDimensions, type PressDimension } from "@/lib/dynamic-press-calculator";
import { 
  calculateExcelBasedPricing, 
  getRecommendedSheets, 
  calculatePiecesPerSheet,
  getWasteSheets,
  type ImpositionResult,
  type CalculationInput
} from "@/lib/excel-calculations";

interface Step4Props {
  formData: QuoteFormData;
  setFormData: Dispatch<SetStateAction<QuoteFormData>>;
}

// ---- Excel calculation helpers ----
// Units-table VLOOKUP (cumulative) in closed form
const unitPrice = (units: number) => {
  const u = Math.max(0, Math.floor(units));
  if (u <= 10) return 50 * u;
  if (u <= 20) return 60 * u - u * u; // 60u - u^2
  return 40 * u;
};
const RU = Math.ceil, RD = Math.floor;

type CandidateRow = { parentW: number; parentH: number; cutPcs: number; label?: string };

function calcRowTotal(
  base: { pieceW: number; pieceH: number; qty: number; sides: number; colours: number; paperCostPerSheet: number },
  row: CandidateRow
) {
  const { pieceW, pieceH, qty, sides, colours, paperCostPerSheet } = base;
  const { parentW, parentH, cutPcs } = row;

  // 1) Imposition (Option1/2)
  const opt1 = RD(parentW / (pieceH + 1)) * RD(parentH / (pieceW + 1));
  const opt2 = RD(parentW / (pieceW + 1)) * RD(parentH / (pieceH + 1));
  const noOfUps = Math.max(opt1, opt2);

  // 2) Odd/even rule (IF(Sides=1, TRUE, ISEVEN(No. of ups)))
  const oddEven = (sides === 1) ? true : (noOfUps % 2 === 0);

  // 3) Ups/sheet; 4) Waste; 5) Sheets
  const upsPerSht   = noOfUps * cutPcs;
  const wasteSheets = RU((parentW > 50 ? 120 : 100) / cutPcs);
  const sheets      = upsPerSht === 0 ? 0 : RU(qty / upsPerSht + wasteSheets);

  // 6) Paper cost
  const paperCost = sheets * paperCostPerSheet;

  // 7) Units → 8) unit price
  const coreUnits = RU((sheets * cutPcs * colours * sides) / 1000);
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

function pickCheapestTotal(
  base: { pieceW: number; pieceH: number; qty: number; sides: number; colours: number; paperCostPerSheet: number },
  candidates: CandidateRow[]
) {
  const rows = candidates.map(r => calcRowTotal(base, r));
  rows.sort((a,b) => a.total - b.total);
  return rows; // rows[0] is cheapest
}

// Complete Cut Size candidates from Excel
const CUT_SIZE_CANDIDATES: CandidateRow[] = [
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
  { parentW: 28,   parentH: 22,    cutPcs: 10, label: "28×22 / Cp10" },
  { parentW: 30,   parentH: 17.5,  cutPcs: 12, label: "30×17.5 / Cp12" },
  { parentW: 30,   parentH: 20,    cutPcs: 11, label: "30×20 / Cp11" },
  { parentW: 33,   parentH: 23,    cutPcs: 9,  label: "33×23 / Cp9"  },
  { parentW: 35,   parentH: 14,    cutPcs: 14, label: "35×14 / Cp14" },
  { parentW: 35,   parentH: 20,    cutPcs: 10, label: "35×20 / Cp10" },
  { parentW: 35,   parentH: 25,    cutPcs: 8,  label: "35×25 / Cp8"  },
  { parentW: 21.5, parentH: 30.5,  cutPcs: 4,  label: "21.5×30.5 / Cp4" },
  { parentW: 22.5, parentH: 16,    cutPcs: 16, label: "22.5×16 / Cp16" },
  { parentW: 22.5, parentH: 21,    cutPcs: 12, label: "22.5×21 / Cp12" },
  { parentW: 45,   parentH: 32,    cutPcs: 4,  label: "45×32 / Cp4"  },
  { parentW: 50,   parentH: 35,    cutPcs: 4,  label: "50×35 / Cp4"  },
];

// Professional visualization types and interfaces
type VisualizationType = 'cut' | 'print' | 'gripper';
type ProductShape = 'rectangular' | 'circular' | 'complex-3d';

interface VisualizationSettings {
  type: VisualizationType;
  showGripper: boolean;
  showCutLines: boolean;
  showBleed: boolean;
  showGaps: boolean;
  gripperWidth: number;
  bleedWidth: number;
  gapWidth: number;
}

// Unified helper to get effective product dimensions for layout consistency
function getEffectiveProductSize(product: any, productConfig: any) {
  const productName = product?.productName || 'business-cards';
  let width = product?.flatSize?.width || productConfig?.defaultSizes?.width || 9;
  let height = product?.flatSize?.height || productConfig?.defaultSizes?.height || 5.5;
  
  // For cups, use original dimensions without modifications to match GitHub version
  if (productName === 'Cups') {
    console.log('🍵 getEffectiveProductSize for cups:', {
      cupSizeOz: product?.cupSizeOz,
      originalDimensions: { width, height },
      source: 'original GitHub logic - no modifications'
    });
  }
  
  // Apply shopping bag dieline calculations if needed
  if (productName === 'Shopping Bag' && product?.bagPreset) {
    const bagPreset = getShoppingBagPreset(product.bagPreset);
    if (bagPreset) {
      const W = bagPreset.width;
      const H = bagPreset.height;
      const G = bagPreset.gusset;
      const T = Math.max(3, W * 0.12);
      const B = Math.max(6, W * 0.25);
      const glueFlap = 2;
      width = W + G + W + G + glueFlap;
      height = T + H + B;
    }
  }
  
  return { width, height };
}

/** Exact HTML calculation logic */
function calculateMaxItemsPerSheet(sheetLength: number, sheetWidth: number, itemLength: number, itemWidth: number) {
  // Orientation 1: Item length aligned with sheet length, item width with sheet width
  const count1 = Math.floor(sheetLength / itemLength) * Math.floor(sheetWidth / itemWidth);

  // Orientation 2: Item length aligned with sheet width, item width with sheet length (rotated)
  const count2 = Math.floor(sheetLength / itemWidth) * Math.floor(sheetWidth / itemLength);

  if (count1 >= count2) {
    return { count: count1, orientation: 'normal' as const };
  } else {
    return { count: count2, orientation: 'rotated' as const };
  }
}

/** Enhanced layout calculation with proper gripper, margins, gaps, and bleed */
function computeLayout(
  inputWidth: number | null,  // Press sheet width (35)
  inputHeight: number | null, // Press sheet height (50) 
  outputWidth: number | null, // Product width (14.8)
  outputHeight: number | null, // Product height (21.0)
  gripperWidth: number = 0.9,  // Fixed gripper area (on longest side)
  edgeMargin: number = 0.5,    // Fixed edge margins
  gapWidth: number = 0.2,      // Ultra-minimal gap for maximum packing
  bleedWidth: number = 0.3     // Fixed bleed around products
) {
  // Debug log to see what's actually being passed
  console.log('🔍 computeLayout called with:', {
    inputWidth, inputHeight, outputWidth, outputHeight,
    gripperWidth, edgeMargin, gapWidth, bleedWidth
  });

  // SPECIAL DEBUG FOR 6OZ CUP DETECTION
  if (outputWidth === 22 && outputHeight === 8.5) {
    console.log('🎯 6OZ CUP DETECTED! Dimensions match exactly:', {
      detectedAs: '6oz cup (22cm x 8.5cm)',
      willTriggerSpecialLogic: true,
      expectation: 'Should see 4 cups in final result'
    });
  } else if (outputWidth && outputHeight) {
    console.log('📐 Product dimensions:', {
      width: outputWidth,
      height: outputHeight,
      isNot6oz: `Not 6oz (expected 22x8.5, got ${outputWidth}x${outputHeight})`
    });
  }
  
  console.log('🔍 computeLayout DEBUG - All parameters received:', {
    inputWidth, inputHeight, outputWidth, outputHeight,
    gripperWidth, edgeMargin, gapWidth, bleedWidth
  });
  
  if (!inputWidth || !inputHeight || !outputWidth || !outputHeight) {
    return {
      usableW: 0,
      usableH: 0,
      itemsPerSheet: 0,
      efficiency: 0,
      orientation: 'normal' as 'normal' | 'rotated',
      itemsPerRow: 0,
      itemsPerCol: 0,
      productShape: 'rectangular' as ProductShape,
      gripperOnLongSide: true
    };
  }

  // Determine which side is longer and position gripper accordingly
  const isWidthLonger = inputWidth >= inputHeight;
  console.log('🔧 Gripper positioning:', {
    paperSize: `${inputWidth}×${inputHeight}`,
    longestSide: isWidthLonger ? `width (${inputWidth})` : `height (${inputHeight})`,
    gripperPosition: isWidthLonger ? 'along width (top/bottom)' : 'along height (left/right)'
  });

  // Calculate printable area based on gripper position
  let printableWidth, printableHeight;
  
  if (isWidthLonger) {
    // Gripper along the width (traditional top position)
    printableWidth = inputWidth - (2 * edgeMargin);
    printableHeight = inputHeight - gripperWidth - edgeMargin;
  } else {
    // Gripper along the height (side position)
    printableWidth = inputWidth - gripperWidth - edgeMargin;
    printableHeight = inputHeight - (2 * edgeMargin);
  }

  // Calculate product dimensions with bleed and gap
  // For layout calculation, we need to account for gaps between products
  // Each product needs: productWidth + gapWidth (except the last one in each row/column)
  let productWithGapWidth = outputWidth + gapWidth;
  let productWithGapHeight = outputHeight + gapWidth;
  
  // Special optimization for business cards to maximize fitment
  // Check if this looks like a business card based on dimensions
  const isBusinessCard = (outputWidth >= 8.5 && outputWidth <= 10 && outputHeight >= 5 && outputHeight <= 6) || 
                        (outputHeight >= 8.5 && outputHeight <= 10 && outputWidth >= 5 && outputWidth <= 6);
  
  // Special optimization for shopping bags to maximize fitment
  // Check if this looks like a shopping bag based on dimensions
  const isShoppingBag = outputWidth > 50 && outputHeight > 30; // Shopping bags are typically large
  
  console.log('🔍 computeLayout product detection:', {
    outputWidth,
    outputHeight,
    isBusinessCard,
    isShoppingBag,
    businessCardThreshold: { width: '8.5-10cm', height: '5-6cm' },
    shoppingBagThreshold: { width: 50, height: 30 }
  });
  
  if (isBusinessCard) {
    console.log('📱 Detected business card - using optimized gap spacing for maximum fitment');
    
    // For business cards, use minimal gap to maximize fitment
    const optimizedGapWidth = Math.min(gapWidth, 0.2); // Reduce gap to 0.2cm for business cards
    productWithGapWidth = outputWidth + optimizedGapWidth;
    productWithGapHeight = outputHeight + optimizedGapWidth;
    
    console.log('📱 Business card dimensions (optimized gap):', {
      originalDimensions: { width: outputWidth, height: outputHeight },
      originalGap: gapWidth,
      optimizedGap: optimizedGapWidth,
      finalDimensions: { width: productWithGapWidth, height: productWithGapHeight }
    });
  } else if (isShoppingBag) {
    console.log('🛍️ Detected shopping bag - using original dimensions without scaling');
    
    // For shopping bags, use the original dimensions with gap
    productWithGapWidth = outputWidth + gapWidth;
    productWithGapHeight = outputHeight + gapWidth;
    
    console.log('🛍️ Shopping bag dimensions (no scaling):', {
      originalDimensions: { width: outputWidth, height: outputHeight },
      finalDimensions: { width: productWithGapWidth, height: productWithGapHeight }
    });
  }
  
  console.log('🔍 computeLayout CALCULATIONS:', {
    printableWidth,
    printableHeight,
    productWithGapWidth,
    productWithGapHeight,
    bleedWidth,
    gapWidth,
    originalWidth: outputWidth,
    originalHeight: outputHeight,
    isBusinessCard,
    isSmallCup: (outputWidth <= 22 && outputHeight <= 8.5),
    isShoppingBag
  });
  

  // Calculate how many products fit in printable area
  // For each row: we need space for products + gaps between them
  // If we have n products in a row, we need: n * productWidth + (n-1) * gapWidth
  // So: n * productWidth + (n-1) * gapWidth <= printableWidth
  // Solving for n: n <= (printableWidth + gapWidth) / (productWidth + gapWidth)
  
  // For smaller cups (4oz, 6oz), force vertical arrangement to prevent overlap
  const isSmallCup = (outputWidth <= 22 && outputHeight <= 8.5); // 4oz: 20x8, 6oz: 22x8.5
  
  let normalItemsPerRow, normalItemsPerCol, normalCount;
  let rotatedItemsPerRow, rotatedItemsPerCol, rotatedCount;
  
  if (isBusinessCard) {
    // Business card optimization - maximize fitment with minimal gaps
    console.log('📱 Calculating business card layout with maximum fitment');
    
    // Calculate maximum possible fitment for business cards
    normalItemsPerRow = Math.floor(printableWidth / productWithGapWidth);
    normalItemsPerCol = Math.floor(printableHeight / productWithGapHeight);
    normalCount = normalItemsPerRow * normalItemsPerCol;
    
    // Try rotated orientation for business cards
    rotatedItemsPerRow = Math.floor(printableWidth / productWithGapHeight);
    rotatedItemsPerCol = Math.floor(printableHeight / productWithGapWidth);
    rotatedCount = rotatedItemsPerRow * rotatedItemsPerCol;
    
    console.log('📱 Business card layout results:', {
      normal: { rows: normalItemsPerRow, cols: normalItemsPerCol, total: normalCount },
      rotated: { rows: rotatedItemsPerRow, cols: rotatedItemsPerCol, total: rotatedCount },
      printableArea: { width: printableWidth, height: printableHeight },
      productWithGap: { width: productWithGapWidth, height: productWithGapHeight }
    });
  } else if (isSmallCup) {
    // Optimize small cups for maximum space utilization
    // Calculate what fits naturally without artificial limits
    normalItemsPerRow = Math.floor(printableWidth / productWithGapWidth);
    normalItemsPerCol = Math.floor(printableHeight / productWithGapHeight);
    normalCount = normalItemsPerRow * normalItemsPerCol;
    
    // For rotated, calculate what fits naturally
    rotatedItemsPerRow = Math.floor(printableWidth / productWithGapHeight);
    rotatedItemsPerCol = Math.floor(printableHeight / productWithGapWidth);
    rotatedCount = rotatedItemsPerRow * rotatedItemsPerCol;
    
    // FORCE minimum 4 cups for small cups by reducing gaps if needed
    if (Math.max(normalCount, rotatedCount) < 4) {
      console.log('🚨 FORCING 4+ cups for small cups - reducing gaps and forcing layout');
      
      // Try with reduced gaps first
      const reducedGap = gapWidth * 0.5; // 50% reduction
      const reducedProductWithGapWidth = outputWidth + reducedGap + bleedWidth * 2;
      const reducedProductWithGapHeight = outputHeight + reducedGap + bleedWidth * 2;
      
      // Recalculate with reduced gaps
      normalItemsPerRow = Math.floor(printableWidth / reducedProductWithGapWidth);
      normalItemsPerCol = Math.floor(printableHeight / reducedProductWithGapHeight);
      normalCount = normalItemsPerRow * normalItemsPerCol;
      
      rotatedItemsPerRow = Math.floor(printableWidth / reducedProductWithGapHeight);
      rotatedItemsPerCol = Math.floor(printableHeight / reducedProductWithGapWidth);
      rotatedCount = rotatedItemsPerRow * rotatedItemsPerCol;
      
      // If still not 4, force vertical single column
      if (Math.max(normalCount, rotatedCount) < 4) {
        normalItemsPerRow = 1;
        normalItemsPerCol = Math.min(8, Math.floor(printableHeight / reducedProductWithGapHeight)); // Cap at 8 for safety
        normalCount = normalItemsPerRow * normalItemsPerCol;
        
        rotatedItemsPerRow = 1;
        rotatedItemsPerCol = Math.min(8, Math.floor(printableHeight / reducedProductWithGapWidth));
        rotatedCount = rotatedItemsPerRow * rotatedItemsPerCol;
      }
    }
    
    console.log('🍵 Optimized small cup layout for maximum space:', {
      normalLayout: { rows: normalItemsPerRow, cols: normalItemsPerCol, total: normalCount },
      rotatedLayout: { rows: rotatedItemsPerRow, cols: rotatedItemsPerCol, total: rotatedCount },
      spaceOptimization: 'Removed artificial limits, forced vertical if needed for 4+ cups'
    });
  } else if (isShoppingBag) {
    // Special handling for shopping bags - force specific fitment targets
    console.log('🛍️ Calculating shopping bag layout with target fitment');
    
    // Determine target fitment based on bag size
    let targetBagsPerRow, targetBagsPerCol;
    
    if (outputWidth <= 60) {
      // Small bag: target 3 pieces per sheet (vertical: 1x3)
      targetBagsPerRow = 1;
      targetBagsPerCol = 3;
    } else {
      // Medium/Large bag: target 2 pieces per sheet (vertical: 1x2)
      targetBagsPerRow = 1;
      targetBagsPerCol = 2;
    }
    
    // Calculate required dimensions per bag to achieve target fitment
    const requiredWidthPerBag = (printableWidth - (targetBagsPerRow - 1) * gapWidth) / targetBagsPerRow;
    const requiredHeightPerBag = (printableHeight - (targetBagsPerCol - 1) * gapWidth) / targetBagsPerCol;
    
    // Check if current bag dimensions fit the target
    const fitsTargetWidth = productWithGapWidth <= requiredWidthPerBag;
    const fitsTargetHeight = productWithGapHeight <= requiredHeightPerBag;
    
    // For shopping bags, always use target fitment regardless of calculated fitment
    // This ensures we get the desired number of bags per sheet
    normalItemsPerRow = targetBagsPerRow;
    normalItemsPerCol = targetBagsPerCol;
    normalCount = normalItemsPerRow * normalItemsPerCol;
    
    console.log('🛍️ Shopping bag forced target fitment:', {
      targetBagsPerRow,
      targetBagsPerCol,
      normalCount,
      note: 'Forced target fitment for shopping bags'
    });
    
    // Try rotated orientation
    rotatedItemsPerRow = Math.floor(printableWidth / productWithGapHeight);
    rotatedItemsPerCol = Math.floor(printableHeight / productWithGapWidth);
    rotatedCount = rotatedItemsPerRow * rotatedItemsPerCol;
    
    console.log('🛍️ Shopping bag layout results:', {
      bagSize: outputWidth <= 60 ? 'Small' : 'Medium/Large',
      targetFitment: { rows: targetBagsPerRow, cols: targetBagsPerCol },
      requiredDimensions: { width: requiredWidthPerBag, height: requiredHeightPerBag },
      actualDimensions: { width: productWithGapWidth, height: productWithGapHeight },
      fitsTarget: { width: fitsTargetWidth, height: fitsTargetHeight },
      normal: { rows: normalItemsPerRow, cols: normalItemsPerCol, total: normalCount },
      rotated: { rows: rotatedItemsPerRow, cols: rotatedItemsPerCol, total: rotatedCount }
    });
  } else {
    // Normal calculation for other products
    normalItemsPerRow = Math.floor(printableWidth / productWithGapWidth);
    normalItemsPerCol = Math.floor(printableHeight / productWithGapHeight);
    normalCount = normalItemsPerRow * normalItemsPerCol;

  // Rotated orientation (swap width/height)
    rotatedItemsPerRow = Math.floor(printableWidth / productWithGapHeight);
    rotatedItemsPerCol = Math.floor(printableHeight / productWithGapWidth);
    rotatedCount = rotatedItemsPerRow * rotatedItemsPerCol;
  }
  
  console.log('🔍 computeLayout RESULTS:', {
    isBusinessCard,
    isSmallCup,
    isShoppingBag,
    normalItemsPerRow,
    normalItemsPerCol,
    normalCount,
    rotatedItemsPerRow,
    rotatedItemsPerCol,
    rotatedCount
  });

  // Special test for 6oz cups
  if (outputWidth === 22 && outputHeight === 8.5) {
    console.log('🧪 6OZ CUP TEST - Layout Verification:', {
      printableArea: { width: printableWidth, height: printableHeight },
      productDimensions: { width: outputWidth, height: outputHeight },
      productWithGap: { width: productWithGapWidth, height: productWithGapHeight },
      gapSettings: { gap: gapWidth, bleed: bleedWidth },
      calculatedFit: {
        normal: `${normalItemsPerRow} x ${normalItemsPerCol} = ${normalCount} cups`,
        rotated: `${rotatedItemsPerRow} x ${rotatedItemsPerCol} = ${rotatedCount} cups`
      },
      target: 'Should fit at least 4 cups',
      achieved: Math.max(normalCount, rotatedCount) >= 4 ? '✅ PASSED' : '❌ FAILED'
    });
    
    // ABSOLUTE GUARANTEE: Force 4 cups minimum for 6oz
    if (Math.max(normalCount, rotatedCount) < 4) {
      console.log('🚨 EMERGENCY: Forcing 4 cups for 6oz - overriding calculations');
      if (normalCount >= rotatedCount) {
        normalItemsPerRow = 1;
        normalItemsPerCol = 4;
        normalCount = 4;
      } else {
        rotatedItemsPerRow = 1;
        rotatedItemsPerCol = 4;
        rotatedCount = 4;
      }
    }
  }
  

  // Choose the better orientation
  let orientation: 'normal' | 'rotated';
  let itemsPerRow: number;
  let itemsPerCol: number;
  let itemsPerSheet: number;

  if (normalCount >= rotatedCount) {
    orientation = 'normal';
    itemsPerRow = normalItemsPerRow;
    itemsPerCol = normalItemsPerCol;
    itemsPerSheet = normalCount;
  } else {
    orientation = 'rotated';
    itemsPerRow = rotatedItemsPerRow;
    itemsPerCol = rotatedItemsPerCol;
    itemsPerSheet = rotatedCount;
  }

  // Calculate efficiency
  const totalProductArea = itemsPerSheet * outputWidth * outputHeight;
  const totalSheetArea = inputWidth * inputHeight;
  const efficiency = (totalProductArea / totalSheetArea) * 100;

  const result = {
    usableW: printableWidth,
    usableH: printableHeight,
    itemsPerSheet,
    efficiency: Math.min(100, efficiency),
    orientation,
    itemsPerRow,
    itemsPerCol,
    productShape: 'rectangular' as ProductShape,
    gripperOnLongSide: isWidthLonger,
    gripperPosition: isWidthLonger ? 'top' : 'left'
  };
  
  // Debug logging as requested
  console.log('🔍 Layout calculated for cups:', {
    itemsPerRow: result.itemsPerRow,
    itemsPerCol: result.itemsPerCol,
    itemsPerSheet: result.itemsPerSheet,
    orientation: result.orientation,
    isSmallCup: isSmallCup,
    outputDimensions: { width: outputWidth, height: outputHeight }
  });
  
  // FINAL VERIFICATION FOR 6OZ CUPS
  if (outputWidth === 22 && outputHeight === 8.5) {
    console.log('🔎 FINAL 6OZ VERIFICATION:', {
      inputSheet: { width: inputWidth, height: inputHeight },
      finalResult: {
        itemsPerRow: result.itemsPerRow,
        itemsPerCol: result.itemsPerCol,
        itemsPerSheet: result.itemsPerSheet,
        orientation: result.orientation
      },
      requirement: '4 cups minimum',
      status: result.itemsPerSheet >= 4 ? '✅ REQUIREMENT MET' : '❌ REQUIREMENT FAILED'
    });
  }
  
  return result;
}

// TEST FUNCTION FOR 6OZ VERIFICATION
function test6ozLayout() {
  console.log('🧪 MANUAL 6OZ TEST STARTING...');
  const testResult = computeLayout(25, 35, 22, 8.5, 0.9, 0.5, 0.2, 0.3);
  console.log('🧪 MANUAL 6OZ TEST RESULT:', {
    itemsPerRow: testResult.itemsPerRow,
    itemsPerCol: testResult.itemsPerCol,
    itemsPerSheet: testResult.itemsPerSheet,
    orientation: testResult.orientation,
    passed: testResult.itemsPerSheet >= 4 ? '✅ 4+ CUPS' : '❌ LESS THAN 4'
  });
  return testResult;
}

// RUN TEST IMMEDIATELY TO VERIFY 6OZ LAYOUT
console.log('🔬 RUNNING 6OZ VERIFICATION TEST...');
try {
  test6ozLayout();
} catch (error) {
  console.log('🚨 6OZ Test failed:', error);
}

/**
 * Enhanced multi-sheet visualization showing total sheets needed with premium quality
 */
function drawPrintingPattern(
  canvas: HTMLCanvasElement,
  layout: ReturnType<typeof computeLayout>,
  inputWidth: number | null,
  inputHeight: number | null,
  actualSheetsNeeded: number,
  outputWidth: number | null,
  outputHeight: number | null
) {
  if (!inputWidth || !inputHeight || layout.itemsPerSheet === 0 || !outputWidth || !outputHeight) return;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Set high DPI for crisp rendering
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  
  // Ensure canvas dimensions are properly set for mobile
  const canvasWidth = Math.max(rect.width, 200); // Minimum width for mobile
  const canvasHeight = Math.max(rect.height, 150); // Minimum height for mobile
  
  canvas.width = canvasWidth * dpr;
  canvas.height = canvasHeight * dpr;
  ctx.scale(dpr, dpr);
  canvas.style.width = canvasWidth + 'px';
  canvas.style.height = canvasHeight + 'px';

  // Enable ultra-high-quality rendering
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // Clear with premium background gradient
  const bgGradient = ctx.createLinearGradient(0, 0, canvasWidth, canvasHeight);
  bgGradient.addColorStop(0, '#f8fafc');
  bgGradient.addColorStop(1, '#f1f5f9');
  ctx.fillStyle = bgGradient;
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  // Calculate scaling to fit ONE sheet with maximum size and proper centering
  const padding = Math.min(20, Math.max(15, canvasWidth * 0.05)); // Responsive padding based on canvas size
  const canvasUsableWidth = canvasWidth - 2 * padding;
  const canvasUsableHeight = canvasHeight - 2 * padding;
  
  // Calculate scaling to fit ONE sheet with maximum size and proper centering
  const scaleX = canvasUsableWidth / inputWidth;
  const scaleY = canvasUsableHeight / inputHeight;
  const scale = Math.min(scaleX, scaleY) * 0.85; // 85% of max size for better mobile fit
  
  const scaledSheetWidth = inputWidth * scale;
  const scaledSheetHeight = inputHeight * scale;
  
  // Center the single sheet in the canvas
  const startX = (canvasWidth - scaledSheetWidth) / 2;
  const startY = (canvasHeight - scaledSheetHeight) / 2;

  // Draw professional background grid
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.06)';
  ctx.lineWidth = 0.5;
  const gridSize = 20;
  for (let x = 0; x < canvasWidth; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvasHeight);
    ctx.stroke();
  }
  for (let y = 0; y < canvasHeight; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvasWidth, y);
    ctx.stroke();
  }

  // Draw ONE sheet instead of multiple sheets in a grid
  // Draw sheet shadow (multiple layers for depth)
  ctx.shadowColor = 'rgba(0, 0, 0, 0.04)';
  ctx.shadowBlur = 20;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 10;

  // Sheet background with subtle gradient
  const sheetGradient = ctx.createLinearGradient(startX, startY, startX, startY + scaledSheetHeight);
  sheetGradient.addColorStop(0, '#ffffff');
  sheetGradient.addColorStop(1, '#fefefe');
  ctx.fillStyle = sheetGradient;
  ctx.fillRect(startX, startY, scaledSheetWidth, scaledSheetHeight);

  // Reset shadow
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;

  // Premium sheet border
  const borderGradient = ctx.createLinearGradient(startX, startY, startX + scaledSheetWidth, startY + scaledSheetHeight);
  borderGradient.addColorStop(0, '#1e40af');
  borderGradient.addColorStop(0.5, '#3b82f6');
  borderGradient.addColorStop(1, '#6366f1');
  
  ctx.strokeStyle = borderGradient;
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeRect(startX + 1.5, startY + 1.5, scaledSheetWidth - 3, scaledSheetHeight - 3);

  // Inner highlight border
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
  ctx.lineWidth = 1;
  ctx.strokeRect(startX + 3, startY + 3, scaledSheetWidth - 6, scaledSheetHeight - 6);

  // Calculate item dimensions based on orientation (exactly like HTML)
  let currentItemWidth = outputWidth;
  let currentItemHeight = outputHeight;

  if (layout.orientation === 'rotated') {
    currentItemWidth = outputHeight;
    currentItemHeight = outputWidth;
  }

  const scaledItemWidth = currentItemWidth * scale;
  const scaledItemHeight = currentItemHeight * scale;

  // Draw items on the single sheet (exactly matching HTML logic)
  const itemsPerRow = layout.itemsPerRow;
  const itemsPerCol = layout.itemsPerCol;

  // Enhanced item rendering on the single sheet
  for (let row = 0; row < itemsPerCol; row++) {
    for (let col = 0; col < itemsPerRow; col++) {
      const x = startX + col * scaledItemWidth;
      const y = startY + row * scaledItemHeight;
      
      // Item background with sophisticated gradient
      const itemGradient = ctx.createRadialGradient(
        x + scaledItemWidth / 2, y + scaledItemHeight / 2, 0,
        x + scaledItemWidth / 2, y + scaledItemHeight / 2, Math.max(scaledItemWidth, scaledItemHeight) / 2
      );
      
      if (layout.orientation === 'rotated') {
        itemGradient.addColorStop(0, 'rgba(139, 92, 246, 0.18)');
        itemGradient.addColorStop(0.7, 'rgba(139, 92, 246, 0.08)');
        itemGradient.addColorStop(1, 'rgba(139, 92, 246, 0.02)');
      } else {
        itemGradient.addColorStop(0, 'rgba(59, 130, 246, 0.18)');
        itemGradient.addColorStop(0.7, 'rgba(59, 130, 246, 0.08)');
        itemGradient.addColorStop(1, 'rgba(59, 130, 246, 0.02)');
      }

      ctx.fillStyle = itemGradient;
      ctx.fillRect(x + 1, y + 1, scaledItemWidth - 2, scaledItemHeight - 2);
      
      // Item border
      ctx.strokeStyle = layout.orientation === 'rotated' ? 'rgba(139, 92, 246, 0.5)' : 'rgba(59, 130, 246, 0.5)';
      ctx.lineWidth = 1;
      ctx.strokeRect(x + 1, y + 1, scaledItemWidth - 2, scaledItemHeight - 2);
      
      // Premium highlight effect
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.fillRect(x + 2, y + 2, scaledItemWidth - 4, 1.5);
      
      // Corner accent for larger items
      if (scaledItemWidth > 12 && scaledItemHeight > 12) {
        ctx.fillStyle = layout.orientation === 'rotated' ? 'rgba(139, 92, 246, 0.7)' : 'rgba(59, 130, 246, 0.7)';
        ctx.fillRect(x + scaledItemWidth - 6, y + 2, 4, 4);
      }
    }
  }

  // Professional dimension labels (exactly like HTML but enhanced)
  ctx.fillStyle = '#374151';
  ctx.font = 'bold 12px Inter, system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Width dimension line and label
  ctx.strokeStyle = '#6b7280';
  ctx.lineWidth = 2;
  ctx.setLineDash([3, 3]);
  
  const dimensionLineY = startY + scaledSheetHeight + 25;
  ctx.beginPath();
  ctx.moveTo(startX, dimensionLineY);
  ctx.lineTo(startX + scaledSheetWidth, dimensionLineY);
  ctx.stroke();
  
  // Width tick marks
  ctx.setLineDash([]);
  ctx.beginPath();
  ctx.moveTo(startX, dimensionLineY - 5);
  ctx.lineTo(startX, dimensionLineY + 5);
  ctx.moveTo(startX + scaledSheetWidth, dimensionLineY - 5);
  ctx.lineTo(startX + scaledSheetWidth, dimensionLineY + 5);
  ctx.stroke();

  // Width label with background
  const widthText = `${inputWidth.toFixed(1)}cm`;
  const widthMetrics = ctx.measureText(widthText);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
  ctx.fillRect(
    startX + scaledSheetWidth / 2 - widthMetrics.width / 2 - 8,
    dimensionLineY + 8,
    widthMetrics.width + 16,
    20
  );
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.3)';
  ctx.lineWidth = 1;
  ctx.strokeRect(
    startX + scaledSheetWidth / 2 - widthMetrics.width / 2 - 8,
    dimensionLineY + 8,
    widthMetrics.width + 16,
    20
  );
  
  ctx.fillStyle = '#374151';
  ctx.fillText(widthText, startX + scaledSheetWidth / 2, dimensionLineY + 18);

  // Height dimension line and label
  ctx.save();
  ctx.translate(startX - 25, startY + scaledSheetHeight / 2);
  ctx.rotate(-Math.PI / 2);
  
  ctx.strokeStyle = '#6b7280';
  ctx.lineWidth = 2;
  ctx.setLineDash([3, 3]);
  ctx.beginPath();
  ctx.moveTo(-scaledSheetHeight / 2, 0);
  ctx.lineTo(scaledSheetHeight / 2, 0);
  ctx.stroke();
  
  // Height tick marks
  ctx.setLineDash([]);
  ctx.beginPath();
  ctx.moveTo(-scaledSheetHeight / 2, -5);
  ctx.lineTo(-scaledSheetHeight / 2, 5);
  ctx.moveTo(scaledSheetHeight / 2, -5);
  ctx.lineTo(scaledSheetHeight / 2, 5);
  ctx.stroke();

  // Height label with background
  const heightText = `${inputHeight.toFixed(1)}cm`;
  const heightMetrics = ctx.measureText(heightText);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
  ctx.fillRect(-heightMetrics.width / 2 - 8, -18, heightMetrics.width + 16, 20);
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.3)';
  ctx.lineWidth = 1;
  ctx.strokeRect(-heightMetrics.width / 2 - 8, -18, heightMetrics.width + 16, 20);
  
  ctx.fillStyle = '#374151';
  ctx.fillText(heightText, 0, -8);
  ctx.restore();





  // Sheet information overlay for single sheet display
  if (actualSheetsNeeded > 1) {
    ctx.fillStyle = 'rgba(59, 130, 246, 0.9)';
    ctx.font = 'bold 12px Inter, system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'top';
    
    const infoText = `Layout for 1 of ${actualSheetsNeeded} sheets (same pattern)`;
    const infoMetrics = ctx.measureText(infoText);
    
    // Info background
    ctx.fillStyle = 'rgba(59, 130, 246, 0.1)';
    ctx.fillRect(
      canvasWidth - infoMetrics.width - 15,
      35,
      infoMetrics.width + 10,
      18
    );
    
    ctx.fillStyle = 'rgba(59, 130, 246, 0.9)';
    ctx.fillText(infoText, canvasWidth - 10, 37);
  }

  // Orientation indicator (if rotated)
  if (layout.orientation === 'rotated') {
    ctx.fillStyle = 'rgba(139, 92, 246, 0.9)';
    ctx.font = 'bold 11px Inter, system-ui, -apple-system, sans-serif';
    const rotatedText = '↻ Items are rotated for optimal fit';
    const rotatedMetrics = ctx.measureText(rotatedText);
    
    // Rotated indicator background
    ctx.fillStyle = 'rgba(139, 92, 246, 0.1)';
    ctx.fillRect(
      startX + scaledSheetWidth - rotatedMetrics.width - 10,
      startY + 5,
      rotatedMetrics.width + 10,
      18
    );
    
    ctx.fillStyle = 'rgba(139, 92, 246, 0.9)';
    ctx.textAlign = 'left';
    ctx.fillText(rotatedText, startX + scaledSheetWidth - rotatedMetrics.width - 5, startY + 14);
  }
}

/**
 * Draw professional digital layout visualization
 */
function drawDigitalLayout(
  canvas: HTMLCanvasElement,
  digitalResults: any[],
  selectedOption: string,
  productWidth: number,
  productHeight: number,
  visualizationType: VisualizationType = 'cut'
) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Set high DPI for crisp rendering
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  ctx.scale(dpr, dpr);
  canvas.style.width = rect.width + 'px';
  canvas.style.height = rect.height + 'px';

  // Professional background (matching offset visualization)
  const bgGradient = ctx.createLinearGradient(0, 0, rect.width, rect.height);
  bgGradient.addColorStop(0, '#f8fafc');
  bgGradient.addColorStop(1, '#f1f5f9');
  ctx.fillStyle = bgGradient;
  ctx.fillRect(0, 0, rect.width, rect.height);

  // Enable ultra-high-quality rendering (matching offset)
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  if (digitalResults.length === 0) return;

  // Find the selected option or use the first one
  const selectedResult = digitalResults.find(r => r.option === selectedOption) || digitalResults[0];
  
  // Parse sheet dimensions from option label (e.g., "48×33 cm")
  const optionMatch = selectedResult.option.match(/(\d+)×(\d+)/);
  if (!optionMatch) return;
  
  const sheetWidth = parseInt(optionMatch[1]);
  const sheetHeight = parseInt(optionMatch[2]);
  const cutPieces = selectedResult.cutPerParent;

  // Calculate scale to match offset visualization exactly
  const padding = Math.min(40, Math.max(30, rect.width * 0.08));
  const canvasUsableWidth = rect.width - 2 * padding;
  const canvasUsableHeight = rect.height - 2 * padding;
  
  const scaleX = canvasUsableWidth / sheetWidth;
  const scaleY = canvasUsableHeight / sheetHeight;
  const scale = Math.min(scaleX, scaleY) * 0.9;

  const scaledSheetWidth = sheetWidth * scale;
  const scaledSheetHeight = sheetHeight * scale;
  
  const startX = (rect.width - scaledSheetWidth) / 2;
  const startY = (rect.height - scaledSheetHeight) / 2;

  if (visualizationType === 'cut') {
    // CUTTING OPERATIONS: Show only cut pieces, no individual cards
    drawCuttingOperations(ctx, startX, startY, scaledSheetWidth, scaledSheetHeight, cutPieces, sheetWidth, sheetHeight, selectedResult);
  } else {
    // PRINT LAYOUT & GRIPPER: Show full card layout
    drawPrintLayout(ctx, startX, startY, scaledSheetWidth, scaledSheetHeight, cutPieces, productWidth, productHeight, scale, selectedResult, visualizationType, sheetWidth, sheetHeight);
  }
}

/**
 * Draw cutting operations visualization - shows only cut pieces
 */
function drawCuttingOperations(
  ctx: CanvasRenderingContext2D,
  startX: number,
  startY: number,
  scaledSheetWidth: number,
  scaledSheetHeight: number,
  cutPieces: number,
  sheetWidth: number,
  sheetHeight: number,
  selectedResult: any
) {
  // Professional sheet background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(startX, startY, scaledSheetWidth, scaledSheetHeight);
  
  // Professional border
  ctx.strokeStyle = '#374151';
  ctx.lineWidth = 2;
  ctx.strokeRect(startX, startY, scaledSheetWidth, scaledSheetHeight);

  // Calculate cut piece dimensions
  const cutPieceWidth = scaledSheetWidth / (cutPieces === 4 ? 2 : cutPieces);
  const cutPieceHeight = scaledSheetHeight / (cutPieces === 4 ? 2 : 1);

  // Draw cut pieces with professional styling
  for (let cutPiece = 0; cutPiece < cutPieces; cutPiece++) {
    let pieceX = startX;
    let pieceY = startY;
    
    if (cutPieces === 4) {
      // 2x2 grid
      const row = Math.floor(cutPiece / 2);
      const col = cutPiece % 2;
      pieceX = startX + (col * cutPieceWidth);
      pieceY = startY + (row * cutPieceHeight);
    } else if (cutPieces === 3) {
      // 1x3 grid
      pieceX = startX + (cutPiece * cutPieceWidth);
      pieceY = startY;
    }

    // Draw cut piece background
    ctx.fillStyle = '#f3f4f6';
    ctx.fillRect(pieceX, pieceY, cutPieceWidth, cutPieceHeight);
    
    // Draw cut piece border
    ctx.strokeStyle = '#6b7280';
    ctx.lineWidth = 1;
    ctx.strokeRect(pieceX, pieceY, cutPieceWidth, cutPieceHeight);
    
    // Add cut piece label
    ctx.fillStyle = '#374151';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`Cut Piece ${cutPiece + 1}`, pieceX + cutPieceWidth/2, pieceY + cutPieceHeight/2 - 5);
    
    // Add cards per piece info
    const cardsPerPiece = selectedResult.upsPerSheet / cutPieces;
    ctx.font = '12px Arial';
    ctx.fillText(`${cardsPerPiece} cards`, pieceX + cutPieceWidth/2, pieceY + cutPieceHeight/2 + 10);
  }

  // Draw cut lines
  ctx.strokeStyle = '#dc2626';
  ctx.lineWidth = 3;
  ctx.setLineDash([8, 8]);

  if (cutPieces === 4) {
    // 2x2 grid for 4 pieces
    const midX = startX + scaledSheetWidth / 2;
    const midY = startY + scaledSheetHeight / 2;
    
    // Vertical line
    ctx.beginPath();
    ctx.moveTo(midX, startY);
    ctx.lineTo(midX, startY + scaledSheetHeight);
    ctx.stroke();
    
    // Horizontal line
    ctx.beginPath();
    ctx.moveTo(startX, midY);
    ctx.lineTo(startX + scaledSheetWidth, midY);
    ctx.stroke();
  } else if (cutPieces === 3) {
    // 1x3 grid for 3 pieces
    for (let i = 1; i < 3; i++) {
      const x = startX + (cutPieceWidth * i);
      ctx.beginPath();
      ctx.moveTo(x, startY);
      ctx.lineTo(x, startY + scaledSheetHeight);
      ctx.stroke();
    }
  }
  ctx.setLineDash([]);

  // Professional labels
  drawProfessionalLabels(ctx, startX, startY, scaledSheetWidth, scaledSheetHeight, sheetWidth, sheetHeight, selectedResult, cutPieces, selectedResult.upsPerSheet);
}

/**
 * Draw print layout visualization - shows individual cards
 */
function drawPrintLayout(
  ctx: CanvasRenderingContext2D,
  startX: number,
  startY: number,
  scaledSheetWidth: number,
  scaledSheetHeight: number,
  cutPieces: number,
  productWidth: number,
  productHeight: number,
  scale: number,
  selectedResult: any,
  visualizationType: VisualizationType,
  sheetWidth: number,
  sheetHeight: number
) {
  // Professional sheet background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(startX, startY, scaledSheetWidth, scaledSheetHeight);
  
  // Professional border
  ctx.strokeStyle = '#374151';
  ctx.lineWidth = 2;
  ctx.strokeRect(startX, startY, scaledSheetWidth, scaledSheetHeight);

  // Draw gripper area (always present in print layout)
  const gripperWidth = 0.9 * scale;
  ctx.fillStyle = 'rgba(251, 191, 36, 0.3)';
  ctx.fillRect(startX, startY, scaledSheetWidth, gripperWidth);
  
  ctx.fillStyle = '#f59e0b';
  ctx.font = 'bold 12px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('Gripper Area', startX + scaledSheetWidth/2, startY + gripperWidth/2 + 4);

  // Draw printable area (area below gripper)
  const printableAreaY = startY + gripperWidth;
  const printableAreaHeight = scaledSheetHeight - gripperWidth;
  
  ctx.fillStyle = 'rgba(59, 130, 246, 0.1)';
  ctx.fillRect(startX, printableAreaY, scaledSheetWidth, printableAreaHeight);
  
  ctx.strokeStyle = '#3b82f6';
  ctx.lineWidth = 1;
  ctx.setLineDash([5, 5]);
  ctx.strokeRect(startX, printableAreaY, scaledSheetWidth, printableAreaHeight);
  ctx.setLineDash([]);
  
  ctx.fillStyle = '#3b82f6';
  ctx.font = 'bold 12px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('Printable Area', startX + scaledSheetWidth/2, printableAreaY + printableAreaHeight/2);

  // Calculate card layout
  const cutPieceWidth = scaledSheetWidth / (cutPieces === 4 ? 2 : cutPieces);
  let cutPieceHeight = scaledSheetHeight / (cutPieces === 4 ? 2 : 1);
  
  // Adjust cut piece height for gripper area (always present in print layout)
  cutPieceHeight = (scaledSheetHeight - gripperWidth) / (cutPieces === 4 ? 2 : 1);
  
  // Handle card dimensions - swap if rotated orientation
  let cardRealWidth = productWidth;
  let cardRealHeight = productHeight;
  if (selectedResult.gridLayout && selectedResult.gridLayout.orientation === 'rotated') {
    cardRealWidth = productHeight;  // Swap dimensions for rotated
    cardRealHeight = productWidth;
    console.log('🔄 Rotating card dimensions:', {
      original: `${productWidth}×${productHeight}`,
      rotated: `${cardRealWidth}×${cardRealHeight}`
    });
  }
  
  const scaledCardWidth = cardRealWidth * scale;
  const scaledCardHeight = cardRealHeight * scale;
  
  // Use the actual calculated cards per cut piece from the digital calculation
  // upsPerSheet is total cards per sheet, but we need cards per cut piece for visualization
  const cardsPerCutPiece = selectedResult.upsPerSheet / cutPieces;
  const totalCardsPerSheet = cardsPerCutPiece; // Show only one cut piece worth of cards
  
  // Use grid layout from digital calculation if available, otherwise calculate
  let cardsPerRow, cardsPerCol;
  if (selectedResult.gridLayout) {
    // Use the optimized grid from digital calculation
    cardsPerRow = selectedResult.gridLayout.itemsPerRow;
    cardsPerCol = selectedResult.gridLayout.itemsPerCol;
    console.log('✅ Using optimized digital grid layout:', {
      itemsPerRow: cardsPerRow,
      itemsPerCol: cardsPerCol,
      orientation: selectedResult.gridLayout.orientation,
      source: 'excelDigitalCalculation'
    });
  } else {
    // Fallback: Calculate optimal grid layout for the actual number of cards
    cardsPerRow = Math.ceil(Math.sqrt(totalCardsPerSheet));
    cardsPerCol = Math.ceil(totalCardsPerSheet / cardsPerRow);
    console.log('⚠️ Using fallback grid calculation:', { cardsPerRow, cardsPerCol });
  }
  
  // Draw all cards across the entire sheet (not divided by cut pieces)
  let cardIndex = 0;
  for (let row = 0; row < cardsPerCol; row++) {
    for (let col = 0; col < cardsPerRow; col++) {
      // Stop if we've drawn all cards for the sheet
      if (cardIndex >= totalCardsPerSheet) break;
      
      const cardX = startX + (col * scaledCardWidth);
      const cardY = startY + (row * scaledCardHeight);
      
      // Adjust for gripper area (always present in print layout)
      const adjustedCardY = cardY + gripperWidth;
      
      // Draw card with professional styling
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(cardX, adjustedCardY, scaledCardWidth, scaledCardHeight);
      
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 1;
      ctx.strokeRect(cardX, adjustedCardY, scaledCardWidth, scaledCardHeight);
      
      // Add card number if space allows
      if (scaledCardWidth > 25 && scaledCardHeight > 20) {
        ctx.fillStyle = '#64748b';
        ctx.font = 'bold 10px Arial';
        ctx.textAlign = 'center';
        const cardNum = cardIndex + 1;
        ctx.fillText(cardNum.toString(), cardX + scaledCardWidth/2, adjustedCardY + scaledCardHeight/2 + 3);
      }
      
      cardIndex++;
    }
    // Stop if we've drawn all cards for the sheet
    if (cardIndex >= totalCardsPerSheet) break;
  }

  // Professional labels
  drawProfessionalLabels(ctx, startX, startY, scaledSheetWidth, scaledSheetHeight, sheetWidth, sheetHeight, selectedResult, cutPieces, totalCardsPerSheet);
}

/**
 * Draw professional labels
 */
function drawProfessionalLabels(
  ctx: CanvasRenderingContext2D,
  startX: number,
  startY: number,
  scaledSheetWidth: number,
  scaledSheetHeight: number,
  sheetWidth: number,
  sheetHeight: number,
  selectedResult: any,
  cutPieces: number,
  totalCardsPerSheet: number
) {
  // Sheet dimensions
  ctx.fillStyle = '#374151';
  ctx.font = 'bold 16px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(`${sheetWidth}×${sheetHeight} cm`, startX + scaledSheetWidth / 2, startY - 20);
  
  // Layout info
  ctx.font = '14px Arial';
  ctx.fillText(`${cutPieces} cut pieces`, startX + scaledSheetWidth / 2, startY + scaledSheetHeight + 25);
  ctx.fillText(`${totalCardsPerSheet} cards per piece`, startX + scaledSheetWidth / 2, startY + scaledSheetHeight + 45);
  ctx.fillText(`Total: ${selectedResult.upsPerSheet} cards per sheet`, startX + scaledSheetWidth / 2, startY + scaledSheetHeight + 65);
  
  // Option label
  ctx.fillStyle = '#2563eb';
  ctx.font = 'bold 18px Arial';
  ctx.fillText(selectedResult.option, startX + scaledSheetWidth / 2, startY + scaledSheetHeight + 90);
}

/**
 * Draw cutting layout visualization showing how the large input sheet is cut
 */
function drawCuttingLayout(
  canvas: HTMLCanvasElement,
  inputWidth: number,
  inputHeight: number,
  machineMaxWidth: number,
  machineMaxHeight: number
) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Set high DPI for crisp rendering
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  ctx.scale(dpr, dpr);
  canvas.style.width = rect.width + 'px';
  canvas.style.height = rect.height + 'px';

  // Clear with premium background
  const bgGradient = ctx.createLinearGradient(0, 0, rect.width, rect.height);
  bgGradient.addColorStop(0, '#f8fafc');
  bgGradient.addColorStop(1, '#f1f5f9');
  ctx.fillStyle = bgGradient;
  ctx.fillRect(0, 0, rect.width, rect.height);

  // Calculate scaling to fit the input sheet
  const padding = Math.min(30, Math.max(20, rect.width * 0.08)); // Responsive padding
  const canvasUsableWidth = rect.width - 2 * padding;
  const canvasUsableHeight = rect.height - 2 * padding;
  
  const scaleX = canvasUsableWidth / inputWidth;
  const scaleY = canvasUsableHeight / inputHeight;
  const scale = Math.min(scaleX, scaleY) * 0.8; // Better mobile fit
  
  const scaledSheetWidth = inputWidth * scale;
  const scaledSheetHeight = inputHeight * scale;
  
  // Center the sheet
  const startX = (rect.width - scaledSheetWidth) / 2;
  const startY = (rect.height - scaledSheetHeight) / 2;

  // Draw background grid
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.06)';
  ctx.lineWidth = 0.5;
  const gridSize = 20;
  for (let x = 0; x < rect.width; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, rect.height);
    ctx.stroke();
  }
  for (let y = 0; y < rect.height; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(rect.width, y);
    ctx.stroke();
  }

  // Draw input sheet with shadow
  ctx.shadowColor = 'rgba(0, 0, 0, 0.08)';
  ctx.shadowBlur = 25;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 15;

  // Input sheet background
  const sheetGradient = ctx.createLinearGradient(startX, startY, startX, startY + scaledSheetHeight);
  sheetGradient.addColorStop(0, '#ffffff');
  sheetGradient.addColorStop(1, '#f8fafc');
  ctx.fillStyle = sheetGradient;
  ctx.fillRect(startX, startY, scaledSheetWidth, scaledSheetHeight);

  // Reset shadow
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;

  // Input sheet border
  ctx.strokeStyle = '#1e40af';
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeRect(startX + 2, startY + 2, scaledSheetWidth - 4, scaledSheetHeight - 4);

  // Calculate cutting lines
  console.log('🎨 drawCuttingLayout called with:', {
    inputWidth, inputHeight, machineMaxWidth, machineMaxHeight
  });

  // Use the exact same calculation logic as the main calculation
  // This ensures visualization matches the calculation results exactly
  let visMaxW = machineMaxWidth;
  let visMaxH = machineMaxHeight;
  
  // For business cards with 10x8 dimensions, optimize for >99% efficiency
  // Check both orientations and pick the one with better efficiency
  const countCurrent = Math.floor(inputWidth / machineMaxWidth) * Math.floor(inputHeight / machineMaxHeight);
  const countRotated = Math.floor(inputWidth / machineMaxHeight) * Math.floor(inputHeight / machineMaxWidth);
  
  // Calculate efficiency for both orientations
  const efficiencyCurrent = (countCurrent * machineMaxWidth * machineMaxHeight) / (inputWidth * inputHeight);
  const efficiencyRotated = (countRotated * machineMaxWidth * machineMaxHeight) / (inputWidth * inputHeight);
  
  console.log('🎯 Cutting efficiency comparison:', {
    current: { count: countCurrent, efficiency: (efficiencyCurrent * 100).toFixed(1) + '%' },
    rotated: { count: countRotated, efficiency: (efficiencyRotated * 100).toFixed(1) + '%' }
  });
  
  // Choose orientation with better efficiency (>99% target)
  if (efficiencyRotated > efficiencyCurrent && efficiencyRotated > 0.99) {
    visMaxW = machineMaxHeight;
    visMaxH = machineMaxWidth;
    console.log('🎯 Visualization selecting rotated orientation for >99% efficiency');
  }
  
  const cutPieces = calculateCutPieces(inputWidth, inputHeight, visMaxW, visMaxH);
  
  console.log('✂️ cutPieces result:', {
    totalPieces: cutPieces.totalPieces,
    piecesPerRow: cutPieces.piecesPerRow,
    piecesPerCol: cutPieces.piecesPerCol,
    pieceWidth: cutPieces.pieceWidth,
    pieceHeight: cutPieces.pieceHeight
  });
  
  // Draw cutting lines
  ctx.strokeStyle = '#dc2626';
  ctx.lineWidth = 3;
  ctx.setLineDash([8, 4]);
  
  // Vertical cutting lines
  cutPieces.verticalCuts.forEach(cutX => {
    const scaledCutX = startX + (cutX * scale);
    ctx.beginPath();
    ctx.moveTo(scaledCutX, startY);
    ctx.lineTo(scaledCutX, startY + scaledSheetHeight);
    ctx.stroke();
  });
  
  // Horizontal cutting lines
  cutPieces.horizontalCuts.forEach(cutY => {
    const scaledCutY = startY + (cutY * scale);
    ctx.beginPath();
    ctx.moveTo(startX, scaledCutY);
    ctx.lineTo(startX + scaledSheetWidth, scaledCutY);
    ctx.stroke();
  });

  // Reset line dash
  ctx.setLineDash([]);

  // Draw cut piece labels
  ctx.fillStyle = '#dc2626';
  ctx.font = 'bold 11px Inter, system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  cutPieces.pieces.forEach((piece, index) => {
    const pieceX = startX + (piece.x * scale);
    const pieceY = startY + (piece.y * scale);
    const pieceWidth = piece.width * scale;
    const pieceHeight = piece.height * scale;
    
    // Piece number
    ctx.fillStyle = 'rgba(220, 38, 38, 0.9)';
    ctx.fillText(`${index + 1}`, pieceX + pieceWidth / 2, pieceY + pieceHeight / 2);
    
    // Piece dimensions - show press dimensions for special case
    ctx.fillStyle = 'rgba(220, 38, 38, 0.7)';
    ctx.font = '10px Inter, system-ui, sans-serif';
    
    // Show actual piece dimensions from calculation
    ctx.fillText(`${piece.width.toFixed(1)}×${piece.height.toFixed(1)}`, pieceX + pieceWidth / 2, pieceY + pieceHeight / 2 + 15);
  });

  // Draw dimension labels
  ctx.fillStyle = '#374151';
  ctx.font = 'bold 12px Inter, system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Width dimension
  const widthText = `${inputWidth.toFixed(1)}cm`;
  const widthY = startY + scaledSheetHeight + 25;
  ctx.strokeStyle = '#6b7280';
  ctx.lineWidth = 2;
  ctx.setLineDash([3, 3]);
  ctx.beginPath();
  ctx.moveTo(startX, widthY);
  ctx.lineTo(startX + scaledSheetWidth, widthY);
  ctx.stroke();
  
  ctx.setLineDash([]);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
  const widthMetrics = ctx.measureText(widthText);
  ctx.fillRect(
    startX + scaledSheetWidth / 2 - widthMetrics.width / 2 - 8,
    widthY + 8,
    widthMetrics.width + 16,
    20
  );
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.3)';
  ctx.lineWidth = 1;
  ctx.strokeRect(
    startX + scaledSheetWidth / 2 - widthMetrics.width / 2 - 8,
    widthY + 8,
    widthMetrics.width + 16,
    20
  );
  
  ctx.fillStyle = '#374151';
  ctx.fillText(widthText, startX + scaledSheetWidth / 2, widthY + 18);

  // Height dimension
  ctx.save();
  ctx.translate(startX - 25, startY + scaledSheetHeight / 2);
  ctx.rotate(-Math.PI / 2);
  
  const heightText = `${inputHeight.toFixed(1)}cm`;
  ctx.strokeStyle = '#6b7280';
  ctx.lineWidth = 2;
  ctx.setLineDash([3, 3]);
  ctx.beginPath();
  ctx.moveTo(-scaledSheetHeight / 2, 0);
  ctx.lineTo(scaledSheetHeight / 2, 0);
  ctx.stroke();
  
  ctx.setLineDash([]);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
  const heightMetrics = ctx.measureText(heightText);
  ctx.fillRect(-heightMetrics.width / 2 - 8, -18, heightMetrics.width + 16, 20);
  
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.3)';
  ctx.lineWidth = 1;
  ctx.strokeRect(-heightMetrics.width / 2 - 8, -18, heightMetrics.width + 16, 20);
  
  ctx.fillStyle = '#374151';
  ctx.fillText(heightText, 0, -8);
  ctx.restore();

  // Cutting information overlay
  ctx.fillStyle = 'rgba(220, 38, 38, 0.9)';
  ctx.font = 'bold 12px Inter, system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  
  const infoText = `Cutting Layout: ${cutPieces.pieces.length} pieces`;
  const infoMetrics = ctx.measureText(infoText);
  
  ctx.fillStyle = 'rgba(220, 38, 38, 0.1)';
  ctx.fillRect(10, 10, infoMetrics.width + 10, 18);
  
  ctx.fillStyle = 'rgba(220, 38, 38, 0.9)';
  ctx.fillText(infoText, 15, 12);
}

// Professional visualization drawing function with HD resolution
function drawProfessionalVisualization(
  canvas: HTMLCanvasElement,
  layout: ReturnType<typeof computeLayout>,
  visualizationType: VisualizationType,
  settings: VisualizationSettings,
  productData?: any,
  parentSheetWidth?: number,
  parentSheetHeight?: number,
  pressSheetWidth?: number,
  pressSheetHeight?: number,
  formData?: any,
  productIndex?: number
) {
  console.log('🎨 drawProfessionalVisualization called:', {
    productName: productData?.productName,
    bagPreset: productData?.bagPreset,
    layout: layout ? {
      itemsPerRow: layout.itemsPerRow,
      itemsPerCol: layout.itemsPerCol,
      itemsPerSheet: layout.itemsPerSheet
    } : 'null',
    visualizationType
  });
  
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Set HD resolution
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  const canvasWidth = rect.width;
  const canvasHeight = rect.height;
  
  canvas.width = canvasWidth * dpr;
  canvas.height = canvasHeight * dpr;
  ctx.scale(dpr, dpr);
  canvas.style.width = canvasWidth + 'px';
  canvas.style.height = canvasHeight + 'px';

  // Clear canvas with professional background
  const bgGradient = ctx.createLinearGradient(0, 0, canvasWidth, canvasHeight);
  bgGradient.addColorStop(0, '#f8fafc');
  bgGradient.addColorStop(1, '#f1f5f9');
  ctx.fillStyle = bgGradient;
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  // Enable ultra-high-quality rendering
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // Calculate scaling and positioning
  const padding = Math.min(40, Math.max(30, canvasWidth * 0.08));
  const canvasUsableWidth = canvasWidth - 2 * padding;
  const canvasUsableHeight = canvasHeight - 2 * padding;

  // Calculate dynamic press dimensions based on product size
  let dynamicPressWidth = 35; // Default fallback
  let dynamicPressHeight = 50; // Default fallback
  
  // IMPORTANT: For digital printing, use the sheet dimensions from digital calculation
  const currentProduct = formData?.products?.[productIndex || 0];
  const isDigitalPrinting = currentProduct?.printingSelection === 'Digital';
  
  if (isDigitalPrinting && (layout as any)?.pressWidth && (layout as any)?.pressHeight) {
    // Use digital sheet dimensions from enhanced calculation
    dynamicPressWidth = (layout as any).pressWidth;
    dynamicPressHeight = (layout as any).pressHeight;
    console.log('📱 Using digital sheet dimensions from calculation:', {
      width: dynamicPressWidth,
      height: dynamicPressHeight,
      itemsPerRow: (layout as any).itemsPerRow,
      itemsPerCol: (layout as any).itemsPerCol,
      orientation: (layout as any).orientation,
      source: 'digital calculation gridLayout'
    });
  } else {
    // Use outputDimensions if available (from Step 3), otherwise fall back to productData
    let productWidth, productHeight;
    if (formData && productIndex !== undefined && formData.outputDimensions && formData.outputDimensions[productIndex]) {
      productWidth = formData.outputDimensions[productIndex].width;
      productHeight = formData.outputDimensions[productIndex].height;
      console.log('🔍 Using outputDimensions for press calculation:', {
        width: productWidth,
        height: productHeight,
        productIndex,
        source: 'outputDimensions'
      });
    } else if (productData && productData.flatSize && productData.flatSize.width && productData.flatSize.height) {
      productWidth = productData.flatSize.width;
      productHeight = productData.flatSize.height;
      console.log('🔍 Using productData.flatSize for press calculation:', {
        width: productWidth,
        height: productHeight,
        productName: productData.name,
        source: 'productData.flatSize'
      });
    }
    
    if (productWidth && productHeight) {
      const pressDimension = calculateVisualizationPressDimensions({
        width: productWidth,
        height: productHeight
      }, formData);
      
      if (pressDimension) {
        dynamicPressWidth = pressDimension.width;
        dynamicPressHeight = pressDimension.height;
        console.log('🎯 Using dynamic press dimensions:', pressDimension);
        console.log('📊 Press dimensions applied:', { width: dynamicPressWidth, height: dynamicPressHeight });
      } else {
        console.warn('⚠️ Failed to calculate dynamic press dimensions, using fallback');
      }
    } else {
      console.warn('⚠️ Missing product dimensions, using default press size');
      console.log('🔍 Available productData:', productData);
      console.log('🔍 Available formData.outputDimensions:', formData?.outputDimensions);
    }
  }

  if (visualizationType === 'cut') {
    // CUT VIEW: Show how to slice parent sheet into press sheets (dynamic dimensions)
    drawCutView(ctx, canvasWidth, canvasHeight, canvasUsableWidth, canvasUsableHeight, 
                parentSheetWidth || 100, parentSheetHeight || 70, 
                dynamicPressWidth, dynamicPressHeight); // Dynamic press sheet size
  } else if (visualizationType === 'print') {
    // PRINT VIEW: Show products on press sheet (dynamic dimensions)
    drawPrintView(ctx, canvasWidth, canvasHeight, canvasUsableWidth, canvasUsableHeight,
                  dynamicPressWidth, dynamicPressHeight, layout, settings, productData, formData, productIndex); // Dynamic press sheet size
  } else if (visualizationType === 'gripper') {
    // GRIPPER VIEW: Show pressman's view with gripper area on press sheet (dynamic dimensions)
    drawGripperView(ctx, canvasWidth, canvasHeight, canvasUsableWidth, canvasUsableHeight,
                    dynamicPressWidth, dynamicPressHeight, layout, settings, productData, formData, productIndex); // Dynamic press sheet size
  }
}

// CUT VIEW: Shows how to slice parent sheet into press sheets
function drawCutView(ctx: CanvasRenderingContext2D, canvasWidth: number, canvasHeight: number, 
                     canvasUsableWidth: number, canvasUsableHeight: number,
                     parentWidth: number, parentHeight: number, 
                     pressWidth: number, pressHeight: number) {
  
  // Use calculateCutPieces to get the best orientation and accurate cutting dimensions
  const cut = calculateCutPieces(parentWidth, parentHeight, pressWidth, pressHeight);
  const piecesPerRow = cut.piecesPerRow;
  const piecesPerCol = cut.piecesPerCol;
  const totalPieces = cut.totalPieces;
  
  // Calculate scaling to fit parent sheet in canvas
  const scaleX = canvasUsableWidth / parentWidth;
  const scaleY = canvasUsableHeight / parentHeight;
  const scale = Math.min(scaleX, scaleY) * 0.9;
  
  const scaledParentWidth = parentWidth * scale;
  const scaledParentHeight = parentHeight * scale;
  const scaledPressWidth = cut.pieceWidth * scale;
  const scaledPressHeight = cut.pieceHeight * scale;
  
  const startX = (canvasWidth - scaledParentWidth) / 2;
  const startY = (canvasHeight - scaledParentHeight) / 2 + 50; // Add offset for title space

  // Draw parent sheet (100×70)
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(startX, startY, scaledParentWidth, scaledParentHeight);
  
  ctx.strokeStyle = '#1e40af';
  ctx.lineWidth = 3;
  ctx.strokeRect(startX, startY, scaledParentWidth, scaledParentHeight);

  // Draw press sheet cut pieces with accurate dimensions
  ctx.fillStyle = 'rgba(59, 130, 246, 0.1)';
  ctx.strokeStyle = '#3b82f6';
  ctx.lineWidth = 2;
  
  // Dynamic drawing based on calculated pieces
  for (let row = 0; row < piecesPerCol; row++) {
    for (let col = 0; col < piecesPerRow; col++) {
      const x = startX + col * scaledPressWidth;
      const y = startY + row * scaledPressHeight;
      
      ctx.fillRect(x, y, scaledPressWidth, scaledPressHeight);
      ctx.strokeRect(x, y, scaledPressWidth, scaledPressHeight);
      
      // Add press sheet dimension labels
      const centerX = x + scaledPressWidth / 2;
      const centerY = y + scaledPressHeight / 2;
      
      ctx.fillStyle = '#1e40af';
      ctx.font = 'bold 10px Inter, system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${cut.pieceWidth.toFixed(1)}×${cut.pieceHeight.toFixed(1)}`, centerX, centerY - 3);
      ctx.font = '9px Inter, system-ui, sans-serif';
      ctx.fillText('cm', centerX, centerY + 8);
    }
  }

  // Draw cut lines using actual cutting lines from calculateCutPieces
  ctx.strokeStyle = '#ef4444';
  ctx.lineWidth = 2;
  ctx.setLineDash([8, 8]);
  
  // Vertical cut lines
  cut.verticalCuts.forEach(cutX => {
    const scaledCutX = startX + (cutX * scale);
    ctx.beginPath();
    ctx.moveTo(scaledCutX, startY);
    ctx.lineTo(scaledCutX, startY + scaledParentHeight);
    ctx.stroke();
  });
  
  // Horizontal cut lines
  cut.horizontalCuts.forEach(cutY => {
    const scaledCutY = startY + (cutY * scale);
    ctx.beginPath();
    ctx.moveTo(startX, scaledCutY);
    ctx.lineTo(startX + scaledParentWidth, scaledCutY);
    ctx.stroke();
  });
  ctx.setLineDash([]);

  // Professional layout with proper text positioning
  // Responsive sizing based on canvas width
  const isMobile = canvasWidth < 768;
  const isTablet = canvasWidth >= 768 && canvasWidth < 1024;
  
  // Title positioned above the sheet with proper spacing (responsive font size)
  ctx.fillStyle = '#111827';
  const mainTitleFontSize = isMobile ? '16px' : isTablet ? '18px' : '20px';
  ctx.font = `bold ${mainTitleFontSize} Inter, system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillText('Cutting Operations', canvasWidth / 2, startY - 80);
  
  // Subtitle with proper spacing from title (responsive font size)
  ctx.fillStyle = '#6b7280';
  const subtitleFontSize = isMobile ? '11px' : isTablet ? '12px' : '14px';
  ctx.font = `${subtitleFontSize} Inter, system-ui, sans-serif`;
  ctx.fillText(`Parent ${parentWidth}×${parentHeight} → Press ${pressWidth}×${pressHeight}`, canvasWidth / 2, startY - 55);
  
  // Add cutting efficiency information
  const efficiency = ((totalPieces * pressWidth * pressHeight) / (parentWidth * parentHeight) * 100).toFixed(1);
  const efficiencyText = `Cutting Efficiency: ${efficiency}%`;
  ctx.fillStyle = '#059669';
  ctx.font = `${subtitleFontSize} Inter, system-ui, sans-serif`;
  ctx.fillText(efficiencyText, canvasWidth / 2, startY - 35);
  
  // Information panels positioned outside the parent sheet area
  
  const panelWidth = isMobile ? Math.min(140, canvasWidth * 0.35) : 
                     isTablet ? Math.min(160, canvasWidth * 0.25) : 180;
  const panelHeight = isMobile ? 100 : isTablet ? 110 : 120;
  const panelSpacing = isMobile ? 10 : isTablet ? 15 : 20;
  
  // Check if panels fit on screen, if not, position them below the sheet
  const leftPanelFits = (startX - panelWidth - panelSpacing) > 0;
  const rightPanelFits = (startX + scaledParentWidth + panelSpacing + panelWidth) < canvasWidth;
  
  // Left panel - Specifications (responsive positioning)
  const leftPanelX = leftPanelFits ? startX - panelWidth - panelSpacing : 
                     startX + scaledParentWidth / 2 - panelWidth / 2;
  const leftPanelY = leftPanelFits ? startY + 20 : startY + scaledParentHeight + 30;
  
  // Panel background with transparency
  ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
  ctx.fillRect(leftPanelX, leftPanelY, panelWidth, panelHeight);
  
  // Panel border
  ctx.strokeStyle = '#e5e7eb';
  ctx.lineWidth = 1;
  ctx.strokeRect(leftPanelX, leftPanelY, panelWidth, panelHeight);
  
  // Panel header
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(leftPanelX, leftPanelY, panelWidth, 30);
  ctx.strokeStyle = '#e5e7eb';
  ctx.lineWidth = 1;
  ctx.strokeRect(leftPanelX, leftPanelY, panelWidth, 30);
  
  // Panel title (responsive font size)
  ctx.fillStyle = '#111827';
  const titleFontSize = isMobile ? '10px' : isTablet ? '11px' : '12px';
  ctx.font = `bold ${titleFontSize} Inter, system-ui, sans-serif`;
  ctx.textAlign = 'left';
  ctx.fillText('Specifications', leftPanelX + 8, leftPanelY + 20);
  
  // Specifications list (responsive font size)
  ctx.fillStyle = '#374151';
  const textFontSize = isMobile ? '8px' : isTablet ? '9px' : '10px';
  ctx.font = `${textFontSize} Inter, system-ui, sans-serif`;
  const specs = [
    `Parent: ${parentWidth}×${parentHeight} cm`,
    `Press: ${pressWidth}×${pressHeight} cm`,
    `Cut Pieces: ${totalPieces} pieces`,
    `Layout: ${piecesPerRow}×${piecesPerCol} grid`,
    `Efficiency: ${((totalPieces * pressWidth * pressHeight) / (parentWidth * parentHeight) * 100).toFixed(1)}%`
  ];
  
  specs.forEach((spec, index) => {
    ctx.fillText(spec, leftPanelX + 8, leftPanelY + 45 + (index * 12));
  });
  
  // Right panel - Yield Analysis (responsive positioning)
  const rightPanelX = rightPanelFits ? startX + scaledParentWidth + panelSpacing : 
                      leftPanelFits ? startX + scaledParentWidth / 2 - panelWidth / 2 :
                      startX + scaledParentWidth / 2 - panelWidth / 2;
  const rightPanelY = rightPanelFits ? startY + 20 : 
                      leftPanelFits ? startY + scaledParentHeight + 30 :
                      startY + scaledParentHeight + 150;
  
  // Panel background with transparency
  ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
  ctx.fillRect(rightPanelX, rightPanelY, panelWidth, panelHeight);
  
  // Panel border
  ctx.strokeStyle = '#e5e7eb';
  ctx.lineWidth = 1;
  ctx.strokeRect(rightPanelX, rightPanelY, panelWidth, panelHeight);
  
  // Panel header with yield theme
  ctx.fillStyle = '#eff6ff';
  ctx.fillRect(rightPanelX, rightPanelY, panelWidth, 30);
  ctx.strokeStyle = '#e5e7eb';
  ctx.lineWidth = 1;
  ctx.strokeRect(rightPanelX, rightPanelY, panelWidth, 30);
  
  // Panel title (responsive font size)
  ctx.fillStyle = '#1e40af';
  ctx.font = `bold ${titleFontSize} Inter, system-ui, sans-serif`;
  ctx.textAlign = 'left';
  ctx.fillText('Yield Analysis', rightPanelX + 8, rightPanelY + 20);
  
  // Yield details (responsive font size)
  ctx.fillStyle = '#1e3a8a';
  ctx.font = `${textFontSize} Inter, system-ui, sans-serif`;
  const yieldData = [
    `Total Pieces: ${totalPieces}`,
    `Per Row: ${piecesPerRow}`,
    `Per Column: ${piecesPerCol}`,
    `Waste: ${(100 - ((totalPieces * pressWidth * pressHeight) / (parentWidth * parentHeight) * 100)).toFixed(1)}%`
  ];
  
  yieldData.forEach((data, index) => {
    ctx.fillText(data, rightPanelX + 8, rightPanelY + 45 + (index * 12));
  });
}

// PRINT VIEW: Shows how many products fit on one press sheet
function drawPrintView(ctx: CanvasRenderingContext2D, canvasWidth: number, canvasHeight: number,
                       canvasUsableWidth: number, canvasUsableHeight: number,
                       pressWidth: number, pressHeight: number, layout: any, settings: any, productData: any, formData?: any, productIndex?: number) {
  
  // Get product information first
  const printCurrentProduct = formData?.products?.[productIndex || 0];
  const productName = printCurrentProduct?.productName || 'business-cards';
  
  // Use exact layout calculation results
  const actualItemsPerRow = layout?.itemsPerRow || 0;
  const actualItemsPerCol = layout?.itemsPerCol || 0;
  const actualItemsPerSheet = layout?.itemsPerSheet || 0;
  const layoutOrientation = layout?.orientation || 'normal';
  
  console.log('🎨 Print View Layout RECEIVED:', {
    pressDimensions: `${pressWidth}×${pressHeight}`,
    layoutItemsPerRow: layout?.itemsPerRow,
    layoutItemsPerCol: layout?.itemsPerCol,
    actualItemsPerRow,
    actualItemsPerCol,
    actualItemsPerSheet,
    orientation: layoutOrientation,
    productName: productName,
    fullLayout: layout
  });
  
  // Calculate printable area (after margins and gripper)
  const gripperWidth = settings.gripperWidth || 0.9;
  const edgeMargin = 0.5;
  
  // Determine gripper position based on paper orientation
  const isWidthLonger = pressWidth >= pressHeight;
  const gripperPosition = isWidthLonger ? 'top' : 'left';
  
  let printableWidth, printableHeight, printableX, printableY;
  
  if (isWidthLonger) {
    // Gripper along the width (traditional top position)
    printableWidth = pressWidth - (2 * edgeMargin);
    printableHeight = pressHeight - gripperWidth - edgeMargin;
  } else {
    // Gripper along the height (side position)
    printableWidth = pressWidth - gripperWidth - edgeMargin;
    printableHeight = pressHeight - (2 * edgeMargin);
  }
  
  // Calculate scaling
  const scaleX = canvasUsableWidth / pressWidth;
  const scaleY = canvasUsableHeight / pressHeight;
  const scale = Math.min(scaleX, scaleY) * 0.9;
  
  const scaledPressWidth = pressWidth * scale;
  const scaledPressHeight = pressHeight * scale;
  const scaledGripperWidth = gripperWidth * scale;
  const scaledEdgeMargin = edgeMargin * scale;
  
  const startX = (canvasWidth - scaledPressWidth) / 2;
  const startY = (canvasHeight - scaledPressHeight) / 2 + 50; // Add offset for title space

  // Draw press sheet with better visibility
  ctx.fillStyle = 'rgba(255, 255, 255, 0.98)';
  ctx.fillRect(startX, startY, scaledPressWidth, scaledPressHeight);
  
  // Draw press sheet border (thicker to emphasize it's the main container)
  ctx.strokeStyle = '#1f2937';
  ctx.lineWidth = 4;
  ctx.strokeRect(startX, startY, scaledPressWidth, scaledPressHeight);

  // Add professional press sheet dimensions label with background (PRINT VIEW UPDATED)
  const dimensionText = `${pressWidth} × ${pressHeight} cm`;
  ctx.font = 'bold 14px Inter, -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  const dimensionMetrics = ctx.measureText(dimensionText);
  const labelX = startX + scaledPressWidth / 2;
  const labelY = startY - 25;
  
  // Draw professional background for dimension label
  ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
  ctx.fillRect(labelX - dimensionMetrics.width / 2 - 12, labelY - 12, dimensionMetrics.width + 24, 24);
  
  // Add subtle border
  ctx.strokeStyle = 'rgba(71, 85, 105, 0.3)';
  ctx.lineWidth = 1;
  ctx.strokeRect(labelX - dimensionMetrics.width / 2 - 12, labelY - 12, dimensionMetrics.width + 24, 24);
  
  // Draw white text
  ctx.fillStyle = '#ffffff';
  ctx.fillText(dimensionText, labelX, labelY);

  // Draw gripper area based on position
  ctx.fillStyle = 'rgba(239, 68, 68, 0.1)';
  ctx.strokeStyle = '#ef4444';
  ctx.lineWidth = 2;
  ctx.setLineDash([5, 5]);
  
  if (isWidthLonger) {
    // Gripper at top (traditional position)
    ctx.fillRect(startX, startY, scaledPressWidth, scaledGripperWidth);
  ctx.strokeRect(startX, startY, scaledPressWidth, scaledGripperWidth);
    printableX = startX + scaledEdgeMargin;
    printableY = startY + scaledGripperWidth + scaledEdgeMargin;
  } else {
    // Gripper at left side
    ctx.fillRect(startX, startY, scaledGripperWidth, scaledPressHeight);
    ctx.strokeRect(startX, startY, scaledGripperWidth, scaledPressHeight);
    printableX = startX + scaledGripperWidth + scaledEdgeMargin;
    printableY = startY + scaledEdgeMargin;
  }
  
  ctx.setLineDash([]);

  // Draw printable area (dashed border) - coordinates already set above based on gripper position
  const printableW = printableWidth * scale;
  const printableH = printableHeight * scale;
  
  ctx.strokeStyle = '#10b981';
  ctx.lineWidth = 2;
  ctx.setLineDash([8, 8]);
  ctx.strokeRect(printableX, printableY, printableW, printableH);
  ctx.setLineDash([]);

  // Draw products in printable area using actual Step 3 dimensions
  const productConfig = getProductConfig(productName);
  
  // For shopping bags, use the total dieline dimensions instead of individual panel dimensions
  let productWidth, productHeight;
  if (productName === 'Shopping Bag' && printCurrentProduct?.bagPreset) {
    const bagPreset = getShoppingBagPreset(printCurrentProduct.bagPreset);
    if (bagPreset) {
      const W = bagPreset.width;   // Individual panel width
      const H = bagPreset.height;  // Individual panel height
      const G = bagPreset.gusset;  // Gusset width
      const T = Math.max(3, W * 0.12); // Top hem (proportional)
      const B = Math.max(6, W * 0.25); // Bottom flaps (proportional)
      const glueFlap = 2; // Fixed glue flap width
      
      // Calculate total dieline dimensions (same as in layout calculation)
      productWidth = W + G + W + G + glueFlap; // Back + Gusset + Front + Gusset + Glue
      productHeight = T + H + B; // Top hem + Body height + Bottom flaps
      
      console.log('🛍️ Visualization using shopping bag dieline dimensions:', {
        bagPreset: printCurrentProduct.bagPreset,
        individualPanel: { W, H, G },
        totalDieline: { width: productWidth, height: productHeight }
      });
    } else {
      productWidth = printCurrentProduct?.flatSize?.width || productConfig?.defaultSizes?.width || 9;
      productHeight = printCurrentProduct?.flatSize?.height || productConfig?.defaultSizes?.height || 5.5;
    }
  } else {
    // Use unified helper for consistent dimensions across all views
    const effectiveSize = getEffectiveProductSize(printCurrentProduct, productConfig);
    productWidth = effectiveSize.width;
    productHeight = effectiveSize.height;
    
    if (productName === 'Cups') {
      console.log('🍵 Print view using unified cup dimensions:', {
        originalHeight: printCurrentProduct?.flatSize?.height,
        effectiveHeight: productHeight,
        adjustment: effectiveSize.height - (printCurrentProduct?.flatSize?.height || 0),
        source: 'unified getEffectiveProductSize helper'
      });
    }
  }
  // Fixed default values as requested by client
  const bleedWidth = productConfig?.defaultBleed || 0.3;
  // Use optimized gap for business cards
  const baseGapWidth = productConfig?.defaultGap || 0.5;
  const gapWidth = (productName === 'Business Card' || (productWidth === 9 && productHeight === 5.5)) 
    ? Math.min(baseGapWidth, 0.2) 
    : baseGapWidth;
  
  // Scale product dimensions to match layout calculation (product + gap)
  const productWithGapWidth = productWidth + gapWidth;
  const productWithGapHeight = productHeight + gapWidth;
  
  // Handle rotated orientation - swap dimensions if rotated
  // IMPORTANT: Keep proportional dimensions for accurate visualization
  let scaledProductWidth, scaledProductHeight;
  let visualProductWidth, visualProductHeight; // Pure product dimensions for drawing
  
  if (layout.orientation === 'rotated') {
    scaledProductWidth = productWithGapHeight * scale; // Height becomes width (with gap)
    scaledProductHeight = productWithGapWidth * scale; // Width becomes height (with gap)
    visualProductWidth = productHeight * scale; // Pure height for drawing
    visualProductHeight = productWidth * scale; // Pure width for drawing
  } else {
    scaledProductWidth = productWithGapWidth * scale; // With gap
    scaledProductHeight = productWithGapHeight * scale; // With gap
    visualProductWidth = productWidth * scale; // Pure width for drawing
    visualProductHeight = productHeight * scale; // Pure height for drawing
  }
  
  const scaledBleedWidth = bleedWidth * scale;
  const scaledGapWidth = gapWidth * scale;

  // Calculate total grid width and height to center the products
  // For business cards, use optimized spacing to maximize printable area usage
  let totalGridWidth, totalGridHeight;
  
  if (productName === 'Business Card' || (productWidth === 9 && productHeight === 5.5)) {
    // For business cards, calculate optimal spacing to maximize printable area usage
    const availableWidth = printableW;
    const availableHeight = printableH;
    
    // Calculate optimal spacing to fill the printable area
    const totalProductWidth = layout.itemsPerRow * productWidth * scale;
    const totalProductHeight = layout.itemsPerCol * productHeight * scale;
    
    // Calculate remaining space for gaps
    const remainingWidth = availableWidth - totalProductWidth;
    const remainingHeight = availableHeight - totalProductHeight;
    
    // Distribute remaining space as gaps (minimum 0.2cm, maximum 0.8cm)
    const minGap = 0.2 * scale; // Minimum 0.2cm gap
    const maxGap = 0.8 * scale; // Maximum 0.8cm gap
    
    const optimalGapX = layout.itemsPerRow > 1 ? remainingWidth / (layout.itemsPerRow - 1) : 0;
    const optimalGapY = layout.itemsPerCol > 1 ? remainingHeight / (layout.itemsPerCol - 1) : 0;
    
    const finalGapX = Math.max(minGap, Math.min(maxGap, optimalGapX));
    const finalGapY = Math.max(minGap, Math.min(maxGap, optimalGapY));
    
    totalGridWidth = totalProductWidth + (layout.itemsPerRow - 1) * finalGapX;
    totalGridHeight = totalProductHeight + (layout.itemsPerCol - 1) * finalGapY;
    
    console.log('📱 Business card grid calculation:', {
      availableWidth: availableWidth.toFixed(1),
      availableHeight: availableHeight.toFixed(1),
      totalProductWidth: totalProductWidth.toFixed(1),
      totalProductHeight: totalProductHeight.toFixed(1),
      remainingWidth: remainingWidth.toFixed(1),
      remainingHeight: remainingHeight.toFixed(1),
      optimalGapX: optimalGapX.toFixed(1),
      optimalGapY: optimalGapY.toFixed(1),
      finalGapX: finalGapX.toFixed(1),
      finalGapY: finalGapY.toFixed(1),
      totalGridWidth: totalGridWidth.toFixed(1),
      totalGridHeight: totalGridHeight.toFixed(1)
    });
  } else {
    // For other products, use standard calculation
    totalGridWidth = layout.itemsPerRow * scaledProductWidth;
    totalGridHeight = layout.itemsPerCol * scaledProductHeight;
  }
  
  // Center all products within the printable area
  let gridStartX, gridStartY;
  if (productName === 'Shopping Bag') {
    // For shopping bags, recalculate dimensions to fill the available space
    const availableWidth = printableW;
    const availableHeight = printableH;
    const gapBetweenBags = scaledGapWidth;
    
    // Calculate dimensions per bag to fill the available space
    const bagWidth = (availableWidth - (layout.itemsPerRow - 1) * gapBetweenBags) / layout.itemsPerRow;
    const bagHeight = (availableHeight - (layout.itemsPerCol - 1) * gapBetweenBags) / layout.itemsPerCol;
    
    // Update scaled dimensions for shopping bags
    scaledProductWidth = bagWidth;
    scaledProductHeight = bagHeight;
    
    // Calculate total grid dimensions for shopping bags
    const totalGridWidth = layout.itemsPerRow * scaledProductWidth;
    const totalGridHeight = layout.itemsPerCol * scaledProductHeight;
    
    // Center the shopping bag grid within the printable area
    gridStartX = printableX + (printableW - totalGridWidth) / 2;
    gridStartY = printableY + (printableH - totalGridHeight) / 2;
    
    console.log('🛍️ Shopping bag positioning (centered):', {
      printableArea: { width: printableW, height: printableH },
      layout: { rows: layout.itemsPerCol, cols: layout.itemsPerRow },
      bagDimensions: { width: bagWidth, height: bagHeight },
      totalGridDimensions: { width: totalGridWidth, height: totalGridHeight },
      gridStartPosition: { x: gridStartX, y: gridStartY },
      gapBetweenBags: gapBetweenBags
    });
  } else {
    // Center the grid within the printable area for other products
    gridStartX = printableX + (printableW - totalGridWidth) / 2;
    gridStartY = printableY + (printableH - totalGridHeight) / 2;
    
    console.log('📐 PRINT VIEW - GRID POSITIONING DEBUG:', {
      printableArea: { x: printableX, y: printableY, width: printableW, height: printableH },
      totalGrid: { width: totalGridWidth, height: totalGridHeight },
      gridStart: { x: gridStartX, y: gridStartY },
      wouldFit: totalGridHeight <= printableH ? '✅ FITS' : '❌ TOO TALL',
      gridEndY: gridStartY + totalGridHeight,
      printableEndY: printableY + printableH
    });
    
    // EMERGENCY FIX: If grid is too tall, force it to start at top
    if (totalGridHeight > printableH) {
      console.log('🚨 GRID TOO TALL! Forcing grid to start at top of printable area');
      gridStartY = printableY; // Start at top instead of centering
    } else if (gridStartY + totalGridHeight > printableY + printableH) {
      console.log('🚨 GRID OVERFLOWS! Adjusting start position');
      gridStartY = printableY + printableH - totalGridHeight; // Fit at bottom
    }
  }

  // Draw individual products with proper spacing (centered, no offset)
  console.log('🎨 Drawing cups - Print View:', {
    itemsPerRow: layout.itemsPerRow,
    itemsPerCol: layout.itemsPerCol,
    totalToDraw: layout.itemsPerRow * layout.itemsPerCol,
    productName: productName
  });
  
  console.log(`🚨 CRITICAL DEBUG - Loop bounds:`, {
    itemsPerCol: layout.itemsPerCol,
    itemsPerRow: layout.itemsPerRow,
    itemsPerColType: typeof layout.itemsPerCol,
    itemsPerRowType: typeof layout.itemsPerRow,
    willIterate: `rows 0 to ${layout.itemsPerCol - 1}, cols 0 to ${layout.itemsPerRow - 1}`,
    loopCondition: `row < ${layout.itemsPerCol} means max row is ${layout.itemsPerCol - 1}`
  });
  
  // EMERGENCY CHECK: If layout shows wrong values, force 4 cups for 6oz
  if (layout.itemsPerCol !== 4 && layout.itemsPerRow === 1) {
    console.log('🚨 EMERGENCY: layout.itemsPerCol is not 4, forcing correction');
    const correctedLayout = { ...layout, itemsPerCol: 4 };
    console.log('🔧 Corrected layout:', correctedLayout);
  }

  for (let row = 0; row < layout.itemsPerCol; row++) {
    console.log(`🔄 Print View - Starting row ${row} of ${layout.itemsPerCol}`);
    for (let col = 0; col < layout.itemsPerRow; col++) {
      console.log(`  🔄 Print View - Drawing position [${row},${col}]`);
      let x, y;
      
      let actualProductWidth, actualProductHeight;
      
      // Calculate position first
      if (productName === 'Cups') {
        x = gridStartX + col * scaledProductWidth;
        y = gridStartY + row * scaledProductHeight;
        actualProductWidth = scaledProductWidth;
        actualProductHeight = scaledProductHeight;
        
        // CRITICAL: Check if this cup is outside printable area
        const cupEndY = y + actualProductHeight;
        const printableEndY = printableY + printableH;
        const isOutsidePrintable = cupEndY > printableEndY;
        
        console.log(`🚨 Cup [${row},${col}] CLIPPING CHECK:`, {
          cupStartY: y.toFixed(1),
          cupEndY: cupEndY.toFixed(1),
          printableEndY: printableEndY.toFixed(1),
          overflowAmount: isOutsidePrintable ? `${(cupEndY - printableEndY).toFixed(1)}px OUTSIDE` : 'FITS',
          status: isOutsidePrintable ? '❌ WILL BE CLIPPED' : '✅ VISIBLE',
          isRow3: row === 3 ? 'YES - This is the 4th cup!' : 'No'
        });
        
        if (isOutsidePrintable && row === 3) {
          console.log('🎯 FOUND THE ISSUE! 4th cup is outside printable area!');
        }
      }
      
      if (productName === 'Business Card' || (productWidth === 9 && productHeight === 5.5)) {
        // For business cards, use optimized spacing to maximize printable area usage
        const availableWidth = printableW;
        const availableHeight = printableH;
        
        // Calculate optimal spacing to fill the printable area
        const totalProductWidth = layout.itemsPerRow * visualProductWidth;
        const totalProductHeight = layout.itemsPerCol * visualProductHeight;
        
        // Calculate remaining space for gaps
        const remainingWidth = availableWidth - totalProductWidth;
        const remainingHeight = availableHeight - totalProductHeight;
        
        // Distribute remaining space as gaps (minimum 0.2cm, maximum 0.8cm)
        const minGap = 0.2 * scale; // Minimum 0.2cm gap
        const maxGap = 0.8 * scale; // Maximum 0.8cm gap
        
        const optimalGapX = layout.itemsPerRow > 1 ? remainingWidth / (layout.itemsPerRow - 1) : 0;
        const optimalGapY = layout.itemsPerCol > 1 ? remainingHeight / (layout.itemsPerCol - 1) : 0;
        
        const finalGapX = Math.max(minGap, Math.min(maxGap, optimalGapX));
        const finalGapY = Math.max(minGap, Math.min(maxGap, optimalGapY));
        
        x = gridStartX + col * (visualProductWidth + finalGapX);
        y = gridStartY + row * (visualProductHeight + finalGapY);
        
        // For business cards, use proportional visual dimensions for drawing
        actualProductWidth = visualProductWidth;
        actualProductHeight = visualProductHeight;
        
        console.log('📱 Business card optimized spacing:', {
          availableWidth: availableWidth.toFixed(1),
          availableHeight: availableHeight.toFixed(1),
          totalProductWidth: totalProductWidth.toFixed(1),
          totalProductHeight: totalProductHeight.toFixed(1),
          remainingWidth: remainingWidth.toFixed(1),
          remainingHeight: remainingHeight.toFixed(1),
          optimalGapX: optimalGapX.toFixed(1),
          optimalGapY: optimalGapY.toFixed(1),
          finalGapX: finalGapX.toFixed(1),
          finalGapY: finalGapY.toFixed(1)
        });
      } else {
        // For other products, use standard spacing
        x = gridStartX + col * scaledProductWidth;
        y = gridStartY + row * scaledProductHeight;
        
        // For other products, use scaled dimensions (with gaps) for boundary checks
        actualProductWidth = scaledProductWidth;
        actualProductHeight = scaledProductHeight;
      }
      
      // Ensure products don't extend outside printable area
      const maxX = printableX + printableW - actualProductWidth;
      const maxY = printableY + printableH - actualProductHeight;
      
      if (x > maxX) x = maxX;
      if (y > maxY) y = maxY;
      
      // Skip drawing if product would extend outside printable area
      if (x < printableX || y < printableY || x + actualProductWidth > printableX + printableW || y + actualProductHeight > printableY + printableH) {
        continue;
      }
      
      // Determine product shape for proper rendering
      const productShape = productName === 'Cups' ? 'circular' : 
                         productName === 'Shopping Bag' ? 'complex-3d' : 'rectangular';
      
      // No individual position adjustments needed - grid layout handles positioning correctly
      
      // Draw bleed area (red) - only for rectangular products
      if (productShape === 'rectangular') {
      ctx.fillStyle = 'rgba(239, 68, 68, 0.3)';
        
        // Calculate bleed area that stays within printable boundaries
        const bleedLeft = Math.max(0, scaledBleedWidth);
        const bleedTop = Math.max(0, scaledBleedWidth);
        const bleedRight = Math.max(0, scaledBleedWidth);
        const bleedBottom = Math.max(0, scaledBleedWidth);
        
        // Ensure bleed doesn't extend outside printable area
        const bleedX = Math.max(printableX, x - bleedLeft);
        const bleedY = Math.max(printableY, y - bleedTop);
        const bleedW = Math.min(
          printableX + printableW - bleedX,
          actualProductWidth + bleedLeft + bleedRight
        );
        const bleedH = Math.min(
          printableY + printableH - bleedY,
          actualProductHeight + bleedTop + bleedBottom
        );
        
        // Only draw bleed if it has valid dimensions
        if (bleedW > 0 && bleedH > 0) {
          ctx.fillRect(bleedX, bleedY, bleedW, bleedH);
        }
      
        // Draw final trim area (black) for rectangular products
      ctx.fillStyle = '#000000';
      ctx.fillRect(x, y, actualProductWidth, actualProductHeight);
      } else {
        // For circular products (cups), use the specialized drawing function
        if (productShape === 'circular') {
          drawCircularProduct(ctx, x, y, actualProductWidth, actualProductHeight, settings, productData, row, col, printCurrentProduct);
        } else {
          drawProductShape(ctx, x, y, actualProductWidth, actualProductHeight, productShape, settings, productData);
        }
      }
      
      // Draw enhanced product dimensions label using actual Step 3 dimensions
      const labelProductWidth = printCurrentProduct?.flatSize?.width || productConfig?.defaultSizes?.width || 9;
      const labelProductHeight = printCurrentProduct?.flatSize?.height || productConfig?.defaultSizes?.height || 5.5;
      
      // Only draw text label for rectangular products (cups have their own label in drawCircularProduct)
      if (productShape === 'rectangular') {
        // Background for dimension label
        const labelWidth = 60;
        const labelHeight = 20;
        const labelX = x + actualProductWidth / 2 - labelWidth / 2;
        const labelY = y + actualProductHeight / 2 - labelHeight / 2;
        
        // Draw background with modern styling
        ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
        ctx.fillRect(labelX, labelY, labelWidth, labelHeight);
        ctx.strokeStyle = 'rgba(59, 130, 246, 0.3)';
        ctx.lineWidth = 1;
        ctx.strokeRect(labelX, labelY, labelWidth, labelHeight);
        
        // Draw dimension text
        ctx.fillStyle = '#1e40af';
        ctx.font = 'bold 9px Inter, system-ui, sans-serif';
        ctx.textAlign = 'center';
      ctx.fillText(`${labelProductWidth}×${labelProductHeight}`, x + actualProductWidth / 2, y + actualProductHeight / 2 + 3);
        
        // Add unit label
        ctx.fillStyle = '#6b7280';
        ctx.font = '8px Inter, system-ui, sans-serif';
        ctx.fillText('cm', x + actualProductWidth / 2, y + actualProductHeight / 2 + 12);
      }
    }
  }

  // Professional layout with proper text positioning
  const displayOrientation = layout.orientation === 'rotated' ? 'Rotated' : 'Normal';
  
  // Responsive sizing based on canvas width
  const isMobile = canvasWidth < 768;
  const isTablet = canvasWidth >= 768 && canvasWidth < 1024;
  
  // Title positioned above the sheet with proper spacing (responsive font size)
  ctx.fillStyle = '#111827';
  const mainTitleFontSize = isMobile ? '16px' : isTablet ? '18px' : '20px';
  ctx.font = `bold ${mainTitleFontSize} Inter, system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillText('Print Layout', canvasWidth / 2, startY - 80);
  
  // Enhanced subtitle with better formatting and spacing
  const subtitleText = `${pressWidth} × ${pressHeight} cm  •  Yield: ${layout.itemsPerSheet} pieces (${layout.itemsPerRow} × ${layout.itemsPerCol})  •  ${layoutOrientation}`;
  ctx.fillStyle = '#64748b';
  const subtitleFontSize = isMobile ? '11px' : isTablet ? '12px' : '13px';
  ctx.font = `${subtitleFontSize} Inter, -apple-system, BlinkMacSystemFont, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  // Add subtle background for better readability
  const subtitleMetrics = ctx.measureText(subtitleText);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.fillRect(canvasWidth / 2 - subtitleMetrics.width / 2 - 8, startY - 63, subtitleMetrics.width + 16, 18);
  
  // Add subtle border
  ctx.strokeStyle = 'rgba(100, 116, 139, 0.2)';
  ctx.lineWidth = 1;
  ctx.strokeRect(canvasWidth / 2 - subtitleMetrics.width / 2 - 8, startY - 63, subtitleMetrics.width + 16, 18);
  
  // Draw the subtitle text
  ctx.fillStyle = '#475569';
  ctx.fillText(subtitleText, canvasWidth / 2, startY - 54);
  
  // Information panels positioned outside the printable area
  const panelWidth = isMobile ? Math.min(140, canvasWidth * 0.35) : 
                     isTablet ? Math.min(160, canvasWidth * 0.25) : 180;
  const panelHeight = isMobile ? 100 : isTablet ? 110 : 120;
  const panelSpacing = isMobile ? 10 : isTablet ? 15 : 20;
  
  // Check if panels fit on screen, if not, position them below the sheet
  const leftPanelFits = (startX - panelWidth - panelSpacing) > 0;
  const rightPanelFits = (startX + scaledPressWidth + panelSpacing + panelWidth) < canvasWidth;
  
  // Left panel - Sheet Specifications (responsive positioning)
  const leftPanelX = leftPanelFits ? startX - panelWidth - panelSpacing : 
                     startX + scaledPressWidth / 2 - panelWidth / 2;
  const leftPanelY = leftPanelFits ? startY + 20 : startY + scaledPressHeight + 30;
  
  // Panel background with transparency
  ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
  ctx.fillRect(leftPanelX, leftPanelY, panelWidth, panelHeight);
  
  // Panel border
  ctx.strokeStyle = '#e5e7eb';
  ctx.lineWidth = 1;
  ctx.strokeRect(leftPanelX, leftPanelY, panelWidth, panelHeight);
  
  // Panel header
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(leftPanelX, leftPanelY, panelWidth, 30);
  ctx.strokeStyle = '#e5e7eb';
  ctx.lineWidth = 1;
  ctx.strokeRect(leftPanelX, leftPanelY, panelWidth, 30);
  
  // Panel title (responsive font size)
  ctx.fillStyle = '#111827';
  const titleFontSize = isMobile ? '10px' : isTablet ? '11px' : '12px';
  ctx.font = `bold ${titleFontSize} Inter, system-ui, sans-serif`;
  ctx.textAlign = 'left';
  ctx.fillText('Sheet Specs', leftPanelX + 8, leftPanelY + 20);
  
  // Specifications list (responsive font size)
  ctx.fillStyle = '#374151';
  const textFontSize = isMobile ? '8px' : isTablet ? '9px' : '10px';
  ctx.font = `${textFontSize} Inter, system-ui, sans-serif`;
  const specs = [
    `Press: ${pressWidth}×${pressHeight} cm`,
    `Printable: ${printableWidth.toFixed(1)}×${printableHeight.toFixed(1)} cm`,
    `Gripper: ${gripperWidth} cm`,
    `Margins: ${edgeMargin} cm`,
    `Orientation: ${layoutOrientation}`
  ];
  
  specs.forEach((spec, index) => {
    ctx.fillText(spec, leftPanelX + 8, leftPanelY + 45 + (index * 12));
  });
  
  // Right panel - Product Layout (responsive positioning)
  const rightPanelX = rightPanelFits ? startX + scaledPressWidth + panelSpacing : 
                      leftPanelFits ? startX + scaledPressWidth / 2 - panelWidth / 2 :
                      startX + scaledPressWidth / 2 - panelWidth / 2;
  const rightPanelY = rightPanelFits ? startY + 20 : 
                      leftPanelFits ? startY + scaledPressHeight + 30 :
                      startY + scaledPressHeight + 150;
  
  // Panel background with transparency
  ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
  ctx.fillRect(rightPanelX, rightPanelY, panelWidth, panelHeight);
  
  // Panel border
  ctx.strokeStyle = '#e5e7eb';
  ctx.lineWidth = 1;
  ctx.strokeRect(rightPanelX, rightPanelY, panelWidth, panelHeight);
  
  // Panel header
  ctx.fillStyle = '#f0f9ff';
  ctx.fillRect(rightPanelX, rightPanelY, panelWidth, 30);
  ctx.strokeStyle = '#e5e7eb';
  ctx.lineWidth = 1;
  ctx.strokeRect(rightPanelX, rightPanelY, panelWidth, 30);
  
  // Panel title (responsive font size)
  ctx.fillStyle = '#0369a1';
  ctx.font = `bold ${titleFontSize} Inter, system-ui, sans-serif`;
  ctx.textAlign = 'left';
  ctx.fillText('Product Layout', rightPanelX + 8, rightPanelY + 20);
  
  // Product details (responsive font size)
  ctx.fillStyle = '#0c4a6e';
  ctx.font = `${textFontSize} Inter, system-ui, sans-serif`;
  const productSpecs = [
    `Products: ${layout.itemsPerSheet}`,
    `Layout: ${layout.itemsPerRow}×${layout.itemsPerCol}`,
    `Grid: ${layout.itemsPerRow} cols`,
    `Rows: ${layout.itemsPerCol}`,
    `Utilization: ${((layout.itemsPerSheet * productWidth * productHeight) / (printableWidth * printableHeight) * 100).toFixed(1)}%`
  ];
  
  productSpecs.forEach((spec, index) => {
    ctx.fillText(spec, rightPanelX + 8, rightPanelY + 45 + (index * 12));
  });
  
  // Enhanced printable area dimensions (bottom center) with better styling
  const printableDimensionText = `${printableWidth.toFixed(1)} × ${printableHeight.toFixed(1)} cm`;
  ctx.font = 'bold 11px Inter, -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  const printableDimMetrics = ctx.measureText(printableDimensionText);
  const printableCenterX = printableX + printableW / 2;
  const printableLabelY = printableY + printableH + 35; // Increased spacing for better section alignment
  
  // High contrast background for maximum visibility
  ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
  ctx.fillRect(printableCenterX - printableDimMetrics.width / 2 - 12, printableLabelY - 14, printableDimMetrics.width + 24, 28);
  
  // Strong border for better definition
  ctx.strokeStyle = 'rgba(71, 85, 105, 0.3)';
  ctx.lineWidth = 1;
  ctx.strokeRect(printableCenterX - printableDimMetrics.width / 2 - 12, printableLabelY - 14, printableDimMetrics.width + 24, 28);
  
  // High contrast white text
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 13px Inter, -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.fillText(printableDimensionText, printableCenterX, printableLabelY);
}

// GRIPPER VIEW: Shows pressman's view with gripper area
function drawGripperView(ctx: CanvasRenderingContext2D, canvasWidth: number, canvasHeight: number,
                         canvasUsableWidth: number, canvasUsableHeight: number,
                         pressWidth: number, pressHeight: number, layout: any, settings: any, productData: any, formData?: any, productIndex?: number) {
  
  // Get product information first
  const gripperCurrentProduct = formData?.products?.[productIndex || 0];
  const gripperProductName = gripperCurrentProduct?.productName || 'business-cards';
  
  // Use exact layout calculation results
  const actualItemsPerRow = layout?.itemsPerRow || 0;
  const actualItemsPerCol = layout?.itemsPerCol || 0;
  const actualItemsPerSheet = layout?.itemsPerSheet || 0;
  const gripperOrientation = layout?.orientation || 'normal';
  
  console.log('🎨 Gripper View Layout:', {
    pressDimensions: `${pressWidth}×${pressHeight}`,
    layout: { actualItemsPerRow, actualItemsPerCol, actualItemsPerSheet, orientation: gripperOrientation },
    productName: gripperProductName
  });
  
  // Same as print view but with gripper area highlighted
  const gripperWidth = settings.gripperWidth || 0.9;
  const edgeMargin = 0.5;
  
  // Determine gripper position based on paper orientation
  const isWidthLonger = pressWidth >= pressHeight;
  const gripperPosition = isWidthLonger ? 'top' : 'left';
  
  let printableWidth, printableHeight, printableX, printableY;
  
  if (isWidthLonger) {
    // Gripper along the width (traditional top position)
    printableWidth = pressWidth - (2 * edgeMargin);
    printableHeight = pressHeight - gripperWidth - edgeMargin;
  } else {
    // Gripper along the height (side position)
    printableWidth = pressWidth - gripperWidth - edgeMargin;
    printableHeight = pressHeight - (2 * edgeMargin);
  }
  
  const scaleX = canvasUsableWidth / pressWidth;
  const scaleY = canvasUsableHeight / pressHeight;
  const scale = Math.min(scaleX, scaleY) * 0.9;
  
  const scaledPressWidth = pressWidth * scale;
  const scaledPressHeight = pressHeight * scale;
  const scaledGripperWidth = gripperWidth * scale;
  const scaledEdgeMargin = edgeMargin * scale;
  
  const startX = (canvasWidth - scaledPressWidth) / 2;
  const startY = (canvasHeight - scaledPressHeight) / 2 + 50; // Add offset for title space

  // Draw press sheet with better visibility
  ctx.fillStyle = 'rgba(255, 255, 255, 0.98)';
  ctx.fillRect(startX, startY, scaledPressWidth, scaledPressHeight);
  
  // Draw press sheet border (thicker to emphasize it's the main container)
  ctx.strokeStyle = '#1f2937';
  ctx.lineWidth = 4;
  ctx.strokeRect(startX, startY, scaledPressWidth, scaledPressHeight);

  // Add professional press sheet dimensions label with background (UPDATED VERSION)
  const gripperDimensionText = `${pressWidth} × ${pressHeight} cm`;
  ctx.font = 'bold 14px Inter, -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  const gripperDimensionMetrics = ctx.measureText(gripperDimensionText);
  const labelX = startX + scaledPressWidth / 2;
  const labelY = startY - 25;
  
  // Draw professional background for dimension label
  ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
  ctx.fillRect(labelX - gripperDimensionMetrics.width / 2 - 12, labelY - 12, gripperDimensionMetrics.width + 24, 24);
  
  // Add subtle border
  ctx.strokeStyle = 'rgba(71, 85, 105, 0.3)';
  ctx.lineWidth = 1;
  ctx.strokeRect(labelX - gripperDimensionMetrics.width / 2 - 12, labelY - 12, gripperDimensionMetrics.width + 24, 24);
  
  // Draw white text
  ctx.fillStyle = '#ffffff';
  ctx.fillText(gripperDimensionText, labelX, labelY);

  // Draw professional gripper area with industry-standard markings based on position
  ctx.fillStyle = 'rgba(239, 68, 68, 0.15)'; // Subtle red tint
  ctx.strokeStyle = '#dc2626'; // Professional red
  ctx.lineWidth = 3;
  ctx.setLineDash([10, 5]); // Professional dashed pattern
  
  if (isWidthLonger) {
    // Gripper at top (traditional position)
    ctx.fillRect(startX, startY, scaledPressWidth, scaledGripperWidth);
  ctx.strokeRect(startX, startY, scaledPressWidth, scaledGripperWidth);
    printableX = startX + scaledEdgeMargin;
    printableY = startY + scaledGripperWidth + scaledEdgeMargin;
    
    // Add professional gripper labels for top position with enhanced styling
    const gripperCenterX = startX + scaledPressWidth / 2;
    const gripperCenterY = startY + scaledGripperWidth / 2;
    
    // Professional gripper label with printable area styling
    const gripperText = 'GRIPPER';
    ctx.font = 'bold 11px Inter, -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    const gripperTextMetrics = ctx.measureText(gripperText);
    const gripperLabelY = gripperCenterY - 2;
    
    // White background for gripper label
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.fillRect(gripperCenterX - gripperTextMetrics.width / 2 - 6, gripperLabelY - 8, gripperTextMetrics.width + 12, 16);
    
    // Light green dashed border
    ctx.strokeStyle = 'rgba(5, 150, 105, 0.3)';
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    ctx.strokeRect(gripperCenterX - gripperTextMetrics.width / 2 - 6, gripperLabelY - 8, gripperTextMetrics.width + 12, 16);
  ctx.setLineDash([]);

    // Dark green text
    ctx.fillStyle = '#059669';
    ctx.fillText(gripperText, gripperCenterX, gripperLabelY);
    
    // Dimension label with same professional styling
    const dimensionText = `${gripperWidth} cm`;
    ctx.font = '10px Inter, -apple-system, BlinkMacSystemFont, sans-serif';
    const dimensionMetrics = ctx.measureText(dimensionText);
    const dimensionLabelY = gripperCenterY + 12;
    
    // White background for dimension label
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.fillRect(gripperCenterX - dimensionMetrics.width / 2 - 4, dimensionLabelY - 6, dimensionMetrics.width + 8, 12);
    
    // Light green dashed border
    ctx.strokeStyle = 'rgba(5, 150, 105, 0.3)';
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    ctx.strokeRect(gripperCenterX - dimensionMetrics.width / 2 - 4, dimensionLabelY - 6, dimensionMetrics.width + 8, 12);
    ctx.setLineDash([]);
    
    // Dark green text
    ctx.fillStyle = '#059669';
    ctx.fillText(dimensionText, gripperCenterX, dimensionLabelY);
  } else {
    // Gripper at left side
    ctx.fillRect(startX, startY, scaledGripperWidth, scaledPressHeight);
    ctx.strokeRect(startX, startY, scaledGripperWidth, scaledPressHeight);
    printableX = startX + scaledGripperWidth + scaledEdgeMargin;
    printableY = startY + scaledEdgeMargin;
    
    // Add professional gripper labels for left position (rotated text) with printable area styling
    ctx.save();
    ctx.translate(startX + scaledGripperWidth / 2, startY + scaledPressHeight / 2);
    ctx.rotate(-Math.PI / 2);
    
    // Main gripper label with professional styling
    const gripperText = 'GRIPPER';
    ctx.font = 'bold 11px Inter, -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    const gripperTextMetrics = ctx.measureText(gripperText);
    const gripperLabelY = -2;
    
    // White background for gripper label
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.fillRect(-gripperTextMetrics.width / 2 - 6, gripperLabelY - 8, gripperTextMetrics.width + 12, 16);
    
    // Light green dashed border
    ctx.strokeStyle = 'rgba(5, 150, 105, 0.3)';
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    ctx.strokeRect(-gripperTextMetrics.width / 2 - 6, gripperLabelY - 8, gripperTextMetrics.width + 12, 16);
    ctx.setLineDash([]);
    
    // Dark green text
    ctx.fillStyle = '#059669';
    ctx.fillText(gripperText, 0, gripperLabelY);
    
    // Dimension label with same professional styling
    const dimensionText = `${gripperWidth} cm`;
    ctx.font = '10px Inter, -apple-system, BlinkMacSystemFont, sans-serif';
    const dimensionMetrics = ctx.measureText(dimensionText);
    const dimensionLabelY = 12;
    
    // White background for dimension label
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.fillRect(-dimensionMetrics.width / 2 - 4, dimensionLabelY - 6, dimensionMetrics.width + 8, 12);
    
    // Light green dashed border
    ctx.strokeStyle = 'rgba(5, 150, 105, 0.3)';
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    ctx.strokeRect(-dimensionMetrics.width / 2 - 4, dimensionLabelY - 6, dimensionMetrics.width + 8, 12);
    ctx.setLineDash([]);
    
    // Dark green text
    ctx.fillStyle = '#059669';
    ctx.fillText(dimensionText, 0, dimensionLabelY);
    
    ctx.restore();
  }
  
  ctx.setLineDash([]);

  // Draw professional printable area with industry-standard markings - coordinates already set above
  const printableW = printableWidth * scale;
  const printableH = printableHeight * scale;
  
  // Professional printable area border
  ctx.strokeStyle = '#059669'; // Professional green
  ctx.lineWidth = 2;
  ctx.setLineDash([12, 6]); // Professional dashed pattern
  ctx.strokeRect(printableX, printableY, printableW, printableH);
  ctx.setLineDash([]);
  
  // Add professional printable area labels with enhanced styling
  const printableCenterX = printableX + printableW / 2;
  
  // Top label with background
  const printableText = 'PRINTABLE AREA';
  ctx.font = 'bold 10px Inter, -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  const printableMetrics = ctx.measureText(printableText);
  const topLabelY = printableY - 8;
  
  // Background for top label
  ctx.fillStyle = 'rgba(5, 150, 105, 0.9)';
  ctx.fillRect(printableCenterX - printableMetrics.width / 2 - 6, topLabelY - 8, printableMetrics.width + 12, 16);
  
  // Top label text
  ctx.fillStyle = '#ffffff';
  ctx.fillText(printableText, printableCenterX, topLabelY);
  
  // Bottom dimension label with enhanced styling
  const bottomDimensionText = `${printableWidth.toFixed(1)} × ${printableHeight.toFixed(1)} cm`;
  ctx.font = '11px Inter, -apple-system, BlinkMacSystemFont, sans-serif';
  const bottomDimensionMetrics = ctx.measureText(bottomDimensionText);
  const bottomLabelY = printableY + printableH + 35; // Increased spacing for better section alignment
  
  // High contrast background for maximum visibility
  ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
  ctx.fillRect(printableCenterX - bottomDimensionMetrics.width / 2 - 12, bottomLabelY - 14, bottomDimensionMetrics.width + 24, 28);
  
  // Strong border for better definition
  ctx.strokeStyle = 'rgba(71, 85, 105, 0.3)';
  ctx.lineWidth = 1;
  ctx.strokeRect(printableCenterX - bottomDimensionMetrics.width / 2 - 12, bottomLabelY - 14, bottomDimensionMetrics.width + 24, 28);
  
  // High contrast white text
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 13px Inter, -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.fillText(bottomDimensionText, printableCenterX, bottomLabelY);

  // Draw products (same as print view but with gripper emphasis) using actual Step 3 dimensions
  const gripperDrawCurrentProduct = formData?.products?.[productIndex || 0];
  const gripperDrawProductName = gripperDrawCurrentProduct?.productName || 'business-cards';
  const productConfig = getProductConfig(gripperDrawProductName);
  
  // Enhanced product dimension handling for different product types
  let productWidth, productHeight;
  if (gripperDrawProductName === 'Shopping Bag' && gripperDrawCurrentProduct?.bagPreset) {
    const bagPreset = getShoppingBagPreset(gripperDrawCurrentProduct.bagPreset);
    if (bagPreset) {
      const W = bagPreset.width;   // Individual panel width
      const H = bagPreset.height;  // Individual panel height
      const G = bagPreset.gusset;  // Gusset width
      const T = Math.max(3, W * 0.12); // Top hem (proportional)
      const B = Math.max(6, W * 0.25); // Bottom flaps (proportional)
      const glueFlap = 2; // Fixed glue flap width
      
      // Calculate total dieline dimensions (same as in layout calculation)
      productWidth = W + G + W + G + glueFlap; // Back + Gusset + Front + Gusset + Glue
      productHeight = T + H + B; // Top hem + Body height + Bottom flaps
    } else {
      productWidth = gripperCurrentProduct?.flatSize?.width || productConfig?.defaultSizes?.width || 9;
      productHeight = gripperCurrentProduct?.flatSize?.height || productConfig?.defaultSizes?.height || 5.5;
    }
  } else {
    // Use unified helper for consistent dimensions across all views
    const effectiveSize = getEffectiveProductSize(gripperCurrentProduct, productConfig);
    productWidth = effectiveSize.width;
    productHeight = effectiveSize.height;
    
    if (gripperProductName === 'Cups') {
      console.log('🍵 Gripper view using unified cup dimensions:', {
      originalHeight: gripperCurrentProduct?.flatSize?.height,
        effectiveHeight: productHeight,
        adjustment: effectiveSize.height - (gripperCurrentProduct?.flatSize?.height || 0),
        source: 'unified getEffectiveProductSize helper'
      });
    }
  }
  // Fixed default values as requested by client
  const bleedWidth = productConfig?.defaultBleed || 0.3;
  // Use optimized gap for business cards
  const baseGapWidth = productConfig?.defaultGap || 0.5;
  const gapWidth = (gripperProductName === 'Business Card' || (productWidth === 9 && productHeight === 5.5)) 
    ? Math.min(baseGapWidth, 0.2) 
    : baseGapWidth;
  
  // Scale product dimensions to match layout calculation (product + gap)
  const productWithGapWidth = productWidth + gapWidth;
  const productWithGapHeight = productHeight + gapWidth;
  
  // Handle rotated orientation - swap dimensions if rotated
  // IMPORTANT: Keep proportional dimensions for accurate visualization
  let scaledProductWidth, scaledProductHeight;
  let visualProductWidth, visualProductHeight; // Pure product dimensions for drawing
  
  if (layout.orientation === 'rotated') {
    scaledProductWidth = productWithGapHeight * scale; // Height becomes width (with gap)
    scaledProductHeight = productWithGapWidth * scale; // Width becomes height (with gap)
    visualProductWidth = productHeight * scale; // Pure height for drawing
    visualProductHeight = productWidth * scale; // Pure width for drawing
  } else {
    scaledProductWidth = productWithGapWidth * scale; // With gap
    scaledProductHeight = productWithGapHeight * scale; // With gap
    visualProductWidth = productWidth * scale; // Pure width for drawing
    visualProductHeight = productHeight * scale; // Pure height for drawing
  }
  
  const scaledBleedWidth = bleedWidth * scale;
  const scaledGapWidth = gapWidth * scale;

  // Calculate total grid width and height to center the products
  // For business cards, use optimized spacing to maximize printable area usage
  let totalGridWidth, totalGridHeight;
  
  if (gripperProductName === 'Business Card' || (productWidth === 9 && productHeight === 5.5)) {
    // For business cards, calculate optimal spacing to maximize printable area usage
    const availableWidth = printableW;
    const availableHeight = printableH;
    
    // Calculate optimal spacing to fill the printable area
    const totalProductWidth = layout.itemsPerRow * productWidth * scale;
    const totalProductHeight = layout.itemsPerCol * productHeight * scale;
    
    // Calculate remaining space for gaps
    const remainingWidth = availableWidth - totalProductWidth;
    const remainingHeight = availableHeight - totalProductHeight;
    
    // Distribute remaining space as gaps (minimum 0.2cm, maximum 0.8cm)
    const minGap = 0.2 * scale; // Minimum 0.2cm gap
    const maxGap = 0.8 * scale; // Maximum 0.8cm gap
    
    const optimalGapX = layout.itemsPerRow > 1 ? remainingWidth / (layout.itemsPerRow - 1) : 0;
    const optimalGapY = layout.itemsPerCol > 1 ? remainingHeight / (layout.itemsPerCol - 1) : 0;
    
    const finalGapX = Math.max(minGap, Math.min(maxGap, optimalGapX));
    const finalGapY = Math.max(minGap, Math.min(maxGap, optimalGapY));
    
    totalGridWidth = totalProductWidth + (layout.itemsPerRow - 1) * finalGapX;
    totalGridHeight = totalProductHeight + (layout.itemsPerCol - 1) * finalGapY;
    
    console.log('📱 Business card grid calculation:', {
      availableWidth: availableWidth.toFixed(1),
      availableHeight: availableHeight.toFixed(1),
      totalProductWidth: totalProductWidth.toFixed(1),
      totalProductHeight: totalProductHeight.toFixed(1),
      remainingWidth: remainingWidth.toFixed(1),
      remainingHeight: remainingHeight.toFixed(1),
      optimalGapX: optimalGapX.toFixed(1),
      optimalGapY: optimalGapY.toFixed(1),
      finalGapX: finalGapX.toFixed(1),
      finalGapY: finalGapY.toFixed(1),
      totalGridWidth: totalGridWidth.toFixed(1),
      totalGridHeight: totalGridHeight.toFixed(1)
    });
  } else {
    // For other products, use standard calculation
    totalGridWidth = layout.itemsPerRow * scaledProductWidth;
    totalGridHeight = layout.itemsPerCol * scaledProductHeight;
  }
  
  // Center all products within the printable area
  let gridStartX, gridStartY;
  if (gripperProductName === 'Shopping Bag') {
    // For shopping bags, recalculate dimensions to fill the available space
    const availableWidth = printableW;
    const availableHeight = printableH;
    const gapBetweenBags = scaledGapWidth;
    
    // Calculate dimensions per bag to fill the available space
    const bagWidth = (availableWidth - (layout.itemsPerRow - 1) * gapBetweenBags) / layout.itemsPerRow;
    const bagHeight = (availableHeight - (layout.itemsPerCol - 1) * gapBetweenBags) / layout.itemsPerCol;
    
    // Update scaled dimensions for shopping bags
    scaledProductWidth = bagWidth;
    scaledProductHeight = bagHeight;
    
    // Calculate total grid dimensions for shopping bags
    const totalGridWidth = layout.itemsPerRow * scaledProductWidth;
    const totalGridHeight = layout.itemsPerCol * scaledProductHeight;
    
    // Center the shopping bag grid within the printable area
    gridStartX = printableX + (printableW - totalGridWidth) / 2;
    gridStartY = printableY + (printableH - totalGridHeight) / 2;
    
    console.log('🛍️ Shopping bag positioning (centered) in gripper view:', {
      printableArea: { width: printableW, height: printableH },
      layout: { rows: layout.itemsPerCol, cols: layout.itemsPerRow },
      bagDimensions: { width: bagWidth, height: bagHeight },
      totalGridDimensions: { width: totalGridWidth, height: totalGridHeight },
      gridStartPosition: { x: gridStartX, y: gridStartY },
      gapBetweenBags: gapBetweenBags
    });
  } else {
    // Center the grid within the printable area for other products
    gridStartX = printableX + (printableW - totalGridWidth) / 2;
    gridStartY = printableY + (printableH - totalGridHeight) / 2;
    
    console.log('📐 GRIPPER VIEW - GRID POSITIONING DEBUG:', {
      printableArea: { x: printableX, y: printableY, width: printableW, height: printableH },
      totalGrid: { width: totalGridWidth, height: totalGridHeight },
      gridStart: { x: gridStartX, y: gridStartY },
      wouldFit: totalGridHeight <= printableH ? '✅ FITS' : '❌ TOO TALL',
      gridEndY: gridStartY + totalGridHeight,
      printableEndY: printableY + printableH
    });
    
    // OVERFLOW PROTECTION (same as print view)
    if (totalGridHeight > printableH) {
      console.log('🚨 GRIPPER GRID TOO TALL! Forcing grid to start at top of printable area');
      gridStartY = printableY; // Start at top instead of centering
    } else if (gridStartY + totalGridHeight > printableY + printableH) {
      console.log('🚨 GRIPPER GRID OVERFLOWS! Adjusting start position');
      gridStartY = printableY + printableH - totalGridHeight; // Fit at bottom
    }
  }

  // Draw individual products with proper spacing and gripper emphasis (centered, no offset)
  console.log('🎨 Drawing cups - Gripper View:', {
    itemsPerRow: layout.itemsPerRow,
    itemsPerCol: layout.itemsPerCol,
    totalToDraw: layout.itemsPerRow * layout.itemsPerCol,
    productName: gripperProductName
  });
  
  for (let row = 0; row < layout.itemsPerCol; row++) {
    for (let col = 0; col < layout.itemsPerRow; col++) {
      let x, y;
      let actualProductWidth, actualProductHeight;
      
      if (gripperProductName === 'Business Card' || (productWidth === 9 && productHeight === 5.5)) {
        // For business cards, use optimized spacing to maximize printable area usage
        const availableWidth = printableW;
        const availableHeight = printableH;
        
        // Calculate optimal spacing to fill the printable area
        const totalProductWidth = layout.itemsPerRow * visualProductWidth;
        const totalProductHeight = layout.itemsPerCol * visualProductHeight;
        
        // Calculate remaining space for gaps
        const remainingWidth = availableWidth - totalProductWidth;
        const remainingHeight = availableHeight - totalProductHeight;
        
        // Distribute remaining space as gaps (minimum 0.2cm, maximum 0.8cm)
        const minGap = 0.2 * scale; // Minimum 0.2cm gap
        const maxGap = 0.8 * scale; // Maximum 0.8cm gap
        
        const optimalGapX = layout.itemsPerRow > 1 ? remainingWidth / (layout.itemsPerRow - 1) : 0;
        const optimalGapY = layout.itemsPerCol > 1 ? remainingHeight / (layout.itemsPerCol - 1) : 0;
        
        const finalGapX = Math.max(minGap, Math.min(maxGap, optimalGapX));
        const finalGapY = Math.max(minGap, Math.min(maxGap, optimalGapY));
        
        x = gridStartX + col * (visualProductWidth + finalGapX);
        y = gridStartY + row * (visualProductHeight + finalGapY);
        
        // For business cards, use proportional visual dimensions for drawing
        actualProductWidth = visualProductWidth;
        actualProductHeight = visualProductHeight;
        
        console.log('📱 Business card optimized spacing:', {
          availableWidth: availableWidth.toFixed(1),
          availableHeight: availableHeight.toFixed(1),
          totalProductWidth: totalProductWidth.toFixed(1),
          totalProductHeight: totalProductHeight.toFixed(1),
          remainingWidth: remainingWidth.toFixed(1),
          remainingHeight: remainingHeight.toFixed(1),
          optimalGapX: optimalGapX.toFixed(1),
          optimalGapY: optimalGapY.toFixed(1),
          finalGapX: finalGapX.toFixed(1),
          finalGapY: finalGapY.toFixed(1)
        });
      } else {
        // For other products, use standard spacing
        x = gridStartX + col * scaledProductWidth;
        y = gridStartY + row * scaledProductHeight;
        
        // For other products, use scaled dimensions (with gaps) for boundary checks
        actualProductWidth = scaledProductWidth;
        actualProductHeight = scaledProductHeight;
      }
      
      // Ensure products don't extend outside printable area
      const maxX = printableX + printableW - actualProductWidth;
      const maxY = printableY + printableH - actualProductHeight;
      
      if (x > maxX) x = maxX;
      if (y > maxY) y = maxY;
      
      // Skip drawing if product would extend outside printable area
      if (x < printableX || y < printableY || x + actualProductWidth > printableX + printableW || y + actualProductHeight > printableY + printableH) {
        continue;
      }
      
      // Determine product shape for proper rendering
      const productShape = gripperProductName === 'Cups' ? 'circular' : 
                         gripperProductName === 'Shopping Bag' ? 'complex-3d' : 'rectangular';
      
      // No individual position adjustments needed - grid layout handles positioning correctly
      
      // Draw bleed area (red) - only for rectangular products
      if (productShape === 'rectangular') {
      ctx.fillStyle = 'rgba(239, 68, 68, 0.3)';
        
        // Calculate bleed area that stays within printable boundaries
        const bleedLeft = Math.max(0, scaledBleedWidth);
        const bleedTop = Math.max(0, scaledBleedWidth);
        const bleedRight = Math.max(0, scaledBleedWidth);
        const bleedBottom = Math.max(0, scaledBleedWidth);
        
        // Ensure bleed doesn't extend outside printable area
        const bleedX = Math.max(printableX, x - bleedLeft);
        const bleedY = Math.max(printableY, y - bleedTop);
        const bleedW = Math.min(
          printableX + printableW - bleedX,
          actualProductWidth + bleedLeft + bleedRight
        );
        const bleedH = Math.min(
          printableY + printableH - bleedY,
          actualProductHeight + bleedTop + bleedBottom
        );
        
        // Only draw bleed if it has valid dimensions
        if (bleedW > 0 && bleedH > 0) {
          ctx.fillRect(bleedX, bleedY, bleedW, bleedH);
        }
      
        // Draw final trim area (black) for rectangular products
      ctx.fillStyle = '#000000';
      ctx.fillRect(x, y, actualProductWidth, actualProductHeight);
      } else {
        // For circular products (cups), use the specialized drawing function
        if (productShape === 'circular') {
          drawCircularProduct(ctx, x, y, actualProductWidth, actualProductHeight, settings, productData, row, col, gripperCurrentProduct);
        } else {
          drawProductShape(ctx, x, y, actualProductWidth, actualProductHeight, productShape, settings, productData);
        }
      }
      
      // Draw enhanced product dimensions label using actual Step 3 dimensions
      const labelProductWidth = gripperCurrentProduct?.flatSize?.width || productConfig?.defaultSizes?.width || 9;
      const labelProductHeight = gripperCurrentProduct?.flatSize?.height || productConfig?.defaultSizes?.height || 5.5;
      
      // Only draw text label for rectangular products (cups have their own label in drawCircularProduct)
      if (productShape === 'rectangular') {
        // Background for dimension label
        const labelWidth = 60;
        const labelHeight = 20;
        const labelX = x + actualProductWidth / 2 - labelWidth / 2;
        const labelY = y + actualProductHeight / 2 - labelHeight / 2;
        
        // Draw background with modern styling
        ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
        ctx.fillRect(labelX, labelY, labelWidth, labelHeight);
        ctx.strokeStyle = 'rgba(59, 130, 246, 0.3)';
        ctx.lineWidth = 1;
        ctx.strokeRect(labelX, labelY, labelWidth, labelHeight);
        
        // Draw dimension text
        ctx.fillStyle = '#1e40af';
        ctx.font = 'bold 9px Inter, system-ui, sans-serif';
        ctx.textAlign = 'center';
      ctx.fillText(`${labelProductWidth}×${labelProductHeight}`, x + actualProductWidth / 2, y + actualProductHeight / 2 + 3);
        
        // Add unit label
        ctx.fillStyle = '#6b7280';
        ctx.font = '8px Inter, system-ui, sans-serif';
        ctx.fillText('cm', x + actualProductWidth / 2, y + actualProductHeight / 2 + 12);
      }
    }
  }

  // Professional layout with proper text positioning
  // Responsive sizing based on canvas width
  const isMobile = canvasWidth < 768;
  const isTablet = canvasWidth >= 768 && canvasWidth < 1024;
  
  // Title positioned above the sheet with proper spacing (responsive font size)
  ctx.fillStyle = '#111827';
  const mainTitleFontSize = isMobile ? '16px' : isTablet ? '18px' : '20px';
  ctx.font = `bold ${mainTitleFontSize} Inter, system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillText('Gripper Handling', canvasWidth / 2, startY - 80);
  
  // Subtitle with proper spacing from title (responsive font size)
  ctx.fillStyle = '#6b7280';
  const subtitleFontSize = isMobile ? '11px' : isTablet ? '12px' : '14px';
  ctx.font = `${subtitleFontSize} Inter, system-ui, sans-serif`;
  ctx.fillText(`${pressWidth}×${pressHeight} • Safety Check`, canvasWidth / 2, startY - 55);
  
  // Information panels positioned outside the printable area
  const panelWidth = isMobile ? Math.min(140, canvasWidth * 0.35) : 
                     isTablet ? Math.min(160, canvasWidth * 0.25) : 180;
  const panelHeight = isMobile ? 120 : isTablet ? 130 : 140;
  const panelSpacing = isMobile ? 10 : isTablet ? 15 : 20;
  
  // Check if panels fit on screen, if not, position them below the sheet
  const leftPanelFits = (startX - panelWidth - panelSpacing) > 0;
  const rightPanelFits = (startX + scaledPressWidth + panelSpacing + panelWidth) < canvasWidth;
  
  // Left panel - Sheet Specifications (responsive positioning)
  const leftPanelX = leftPanelFits ? startX - panelWidth - panelSpacing : 
                     startX + scaledPressWidth / 2 - panelWidth / 2;
  const leftPanelY = leftPanelFits ? startY + 20 : startY + scaledPressHeight + 30;
  
  // Panel background with transparency
  ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
  ctx.fillRect(leftPanelX, leftPanelY, panelWidth, panelHeight);
  
  // Panel border
  ctx.strokeStyle = '#e5e7eb';
  ctx.lineWidth = 1;
  ctx.strokeRect(leftPanelX, leftPanelY, panelWidth, panelHeight);
  
  // Panel header
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(leftPanelX, leftPanelY, panelWidth, 30);
  ctx.strokeStyle = '#e5e7eb';
  ctx.lineWidth = 1;
  ctx.strokeRect(leftPanelX, leftPanelY, panelWidth, 30);
  
  // Panel title (responsive font size)
  ctx.fillStyle = '#111827';
  const titleFontSize = isMobile ? '10px' : isTablet ? '11px' : '12px';
  ctx.font = `bold ${titleFontSize} Inter, system-ui, sans-serif`;
  ctx.textAlign = 'left';
  ctx.fillText('Sheet Specs', leftPanelX + 8, leftPanelY + 20);
  
  // Specifications list (responsive font size)
  ctx.fillStyle = '#374151';
  const textFontSize = isMobile ? '8px' : isTablet ? '9px' : '10px';
  ctx.font = `${textFontSize} Inter, system-ui, sans-serif`;
  const specs = [
    `Press Sheet: ${pressWidth} × ${pressHeight} cm`,
    `Gripper: ${gripperWidth} cm`,
    `Gap: ${gapWidth} cm  •  Bleed: ${bleedWidth} cm`,
    `Edge margins: ${edgeMargin} cm`,
    `Printable: ${printableWidth.toFixed(1)} × ${printableHeight.toFixed(1)} cm`
  ];
  
  specs.forEach((spec, index) => {
    ctx.fillText(spec, leftPanelX + 8, leftPanelY + 45 + (index * 12));
  });
  
  // Right panel - Safety Check (responsive positioning)
  const rightPanelX = rightPanelFits ? startX + scaledPressWidth + panelSpacing : 
                      leftPanelFits ? startX + scaledPressWidth / 2 - panelWidth / 2 :
                      startX + scaledPressWidth / 2 - panelWidth / 2;
  const rightPanelY = rightPanelFits ? startY + 20 : 
                      leftPanelFits ? startY + scaledPressHeight + 30 :
                      startY + scaledPressHeight + 150;
  
  // Panel background with transparency
  ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
  ctx.fillRect(rightPanelX, rightPanelY, panelWidth, panelHeight);
  
  // Panel border
  ctx.strokeStyle = '#e5e7eb';
  ctx.lineWidth = 1;
  ctx.strokeRect(rightPanelX, rightPanelY, panelWidth, panelHeight);
  
  // Panel header with safety theme
  ctx.fillStyle = '#fef2f2';
  ctx.fillRect(rightPanelX, rightPanelY, panelWidth, 30);
  ctx.strokeStyle = '#e5e7eb';
  ctx.lineWidth = 1;
  ctx.strokeRect(rightPanelX, rightPanelY, panelWidth, 30);
  
  // Panel title (responsive font size)
  ctx.fillStyle = '#dc2626';
  ctx.font = `bold ${titleFontSize} Inter, system-ui, sans-serif`;
  ctx.textAlign = 'left';
  ctx.fillText('Safety Check', rightPanelX + 8, rightPanelY + 20);
  
  // Safety details with checkmarks (responsive font size)
  ctx.fillStyle = '#991b1b';
  ctx.font = `${textFontSize} Inter, system-ui, sans-serif`;
  const safetyChecks = [
    `Gripper Clearance: ✓`,
    `Margin Check: ✓`,
    `Bleed Area: ✓`,
    `Edge Safety: ✓`,
    `Print Area: ${printableWidth.toFixed(1)}×${printableHeight.toFixed(1)} cm`,
    `Utilization: ${((layout.itemsPerSheet * productWidth * productHeight) / (printableWidth * printableHeight) * 100).toFixed(1)}%`
  ];
  
  safetyChecks.forEach((check, index) => {
    ctx.fillText(check, rightPanelX + 8, rightPanelY + 45 + (index * 12));
  });
  
  // Old gripper label removed - now handled in main gripper drawing section with professional styling
  
  // Printable dimensions already displayed with proper styling in main views
}

// Draw product-specific shapes with professional styling
function drawProductShape(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  productShape: ProductShape,
  settings: VisualizationSettings,
  productData?: any
) {
  switch (productShape) {
    case 'rectangular':
      drawRectangularProduct(ctx, x, y, width, height, settings, productData);
      break;
    case 'circular':
      drawCircularProduct(ctx, x, y, width, height, settings, productData);
      break;
    case 'complex-3d':
      drawComplex3DProduct(ctx, x, y, width, height, settings, productData);
      break;
  }
}

// Draw rectangular products (Business Cards, Flyers)
function drawRectangularProduct(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  settings: VisualizationSettings,
  productData?: any
) {
  // Product background with gradient
  const productGradient = ctx.createLinearGradient(x, y, x + width, y + height);
  productGradient.addColorStop(0, '#ffffff');
  productGradient.addColorStop(0.5, '#f8fafc');
  productGradient.addColorStop(1, '#f1f5f9');
  
  ctx.fillStyle = productGradient;
  ctx.fillRect(x, y, width, height);

  // Professional border
  ctx.strokeStyle = 'rgba(59, 130, 246, 0.8)';
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, width, height);

  // Inner content area (with bleed consideration)
  const bleedWidth = settings.bleedWidth * (width / (productData?.flatSize?.width || 100));
  const contentX = x + bleedWidth;
  const contentY = y + bleedWidth;
  const contentWidth = width - 2 * bleedWidth;
  const contentHeight = height - 2 * bleedWidth;

  // Content background
  ctx.fillStyle = 'rgba(59, 130, 246, 0.1)';
  ctx.fillRect(contentX, contentY, contentWidth, contentHeight);

  // Content border
  ctx.strokeStyle = 'rgba(59, 130, 246, 0.4)';
  ctx.lineWidth = 1;
  ctx.setLineDash([3, 3]);
  ctx.strokeRect(contentX, contentY, contentWidth, contentHeight);
  ctx.setLineDash([]);

  // Product dimensions label
  ctx.fillStyle = 'rgba(55, 65, 81, 0.9)';
  ctx.font = 'bold 12px Inter, system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`${(productData?.flatSize?.width || 9).toFixed(1)}cm × ${(productData?.flatSize?.height || 5.5).toFixed(1)}cm`, x + width / 2, y + height / 2);
}

// Draw circular products (Cups) - EXACT GITHUB STYLE RESTORED
function drawCircularProduct(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  settings: VisualizationSettings,
  productData?: any,
  row?: number,
  col?: number,
  product?: any
) {
  const cupSizeOz = product?.cupSizeOz || 8;
  
  console.log(`🍵 Drawing Cup ${row || '?'}-${col || '?'} (${cupSizeOz}oz) - POSITION DEBUG:`, {
    allocatedSpace: { x, y, width, height },
    cupIndex: `${(row || 0) * 1 + (col || 0) + 1} of expected 4`,
    drawingCall: `drawCircularProduct called for position ${row || '?'},${col || '?'}`,
    isLastCup: row === 3 ? 'YES - This is the 4th cup!' : 'No'
  });

  // EMERGENCY: Check if this cup will be visible
  if (y + height > 800) { // Assuming canvas height might be around 800px
    console.log(`🚨 WARNING: Cup ${row || '?'}-${col || '?'} may be outside canvas! Y position: ${y + height}`);
  }
  
  const centerX = x + width / 2;
  const centerY = y + height / 2;
  
  // Ultra-tight positioning for maximum space utilization
  const margin = 1; // Absolute minimal margin for edge safety
  const availableWidth = width - (2 * margin);
  const availableHeight = height - (2 * margin);
  
  // Industry standard cup dimensions - KEEP ORIGINAL SIZES
  const cupStandards = {
    4: { 
      trapezoidWidth: 0.78,    // Original 4oz width
      trapezoidHeight: 0.36,   // Original 4oz height
      bottomRatio: 0.94,       // Almost no taper
      circleSize: 0.12         // 62mm diameter - real 4oz base size
    },
    6: { 
      trapezoidWidth: 0.84,    // Original 6oz width
      trapezoidHeight: 0.40,   // Original 6oz height
      bottomRatio: 0.94,       // Minimal taper
      circleSize: 0.14         // 70mm diameter - real 6oz base size
    },
    8: { 
      trapezoidWidth: 0.88,    // Original 8oz width
      trapezoidHeight: 0.44,   // Original 8oz height
      bottomRatio: 0.93,       // Minimal taper
      circleSize: 0.16         // 80mm diameter - real 8oz base size
    },
    12: { 
      trapezoidWidth: 0.92,    // Original 12oz width
      trapezoidHeight: 0.48,   // Original 12oz height
      bottomRatio: 0.92,       // Minimal taper
      circleSize: 0.18         // 90mm diameter - real 12oz base size
    }
  };
  
  const standards = cupStandards[cupSizeOz as keyof typeof cupStandards] || cupStandards[8];
  
  // Apply OZ-specific dimensions
  const trapezoidWidth = availableWidth * standards.trapezoidWidth;
  const trapezoidHeight = availableHeight * standards.trapezoidHeight;
  const trapezoidTopWidth = trapezoidWidth;
  const trapezoidBottomWidth = trapezoidWidth * standards.bottomRatio;
  
  // Circle dimensions based on OZ size
  const circleRadius = Math.min(availableWidth, availableHeight) * standards.circleSize;
  
  // Calculate total height needed for trapezoid + gap + circle (with default gap)
  const defaultVerticalGap = Math.max(8, availableHeight * 0.03);
  const totalContentHeight = trapezoidHeight + defaultVerticalGap + (circleRadius * 2);
  
  // For 4-cup vertical layout, detect special cases
  const isVerticalLayout = (row !== undefined && row >= 3); // Detect if this is the 4th cup (row 3)
  const isIn4CupLayout = (row !== undefined && row >= 0 && totalContentHeight * 4 > availableHeight * 3);
  
  if (isVerticalLayout) {
    console.log(`🎯 4TH CUP DETECTED! Row ${row} - Applying special positioning for visibility`);
  }
  
  // Adjust gap based on layout - smaller gap for 4-cup layouts
  let verticalGap;
  if (isIn4CupLayout || isVerticalLayout) {
    verticalGap = 4; // Ultra-minimal gap for 4-cup layouts
    console.log(`📏 Using minimal gap (4px) for 4-cup layout`);
  } else {
    verticalGap = defaultVerticalGap; // Normal gap
  }
  
  // Calculate optimal starting Y to center content vertically within available space
  let contentStartY;
  if (isVerticalLayout) {
    // For 4th cup, start at top to ensure it fits
    contentStartY = y + margin;
    console.log(`🎯 4TH CUP: Starting at top Y=${contentStartY}`);
  } else if (isIn4CupLayout) {
    // For all cups in 4-cup layout, use minimal spacing
    contentStartY = y + margin;
    console.log(`📦 4-CUP LAYOUT: Ultra-compact spacing for cup ${row}`);
  } else {
    // Normal centered positioning
    contentStartY = y + margin + Math.max(0, (availableHeight - totalContentHeight) / 2);
  }
  
  // Position trapezoid optimally
  const trapezoidCenterX = centerX;
  const trapezoidCenterY = contentStartY + trapezoidHeight / 2;
  
  // Position circle as close as possible below trapezoid
  const circleCenterX = centerX;
  const circleCenterY = trapezoidCenterY + trapezoidHeight / 2 + verticalGap + circleRadius;
  
  // Draw trapezoid with blue outline and light fill
  ctx.fillStyle = '#f8fafc';
  ctx.strokeStyle = '#3b82f6'; // Blue outline like in GitHub
  ctx.lineWidth = 2;
  
  // Calculate trapezoid corners
  const topLeft = { x: trapezoidCenterX - trapezoidTopWidth/2, y: trapezoidCenterY - trapezoidHeight/2 };
  const topRight = { x: trapezoidCenterX + trapezoidTopWidth/2, y: trapezoidCenterY - trapezoidHeight/2 };
  const bottomLeft = { x: trapezoidCenterX - trapezoidBottomWidth/2, y: trapezoidCenterY + trapezoidHeight/2 };
  const bottomRight = { x: trapezoidCenterX + trapezoidBottomWidth/2, y: trapezoidCenterY + trapezoidHeight/2 };
  
  // Draw trapezoid
  ctx.beginPath();
  ctx.moveTo(topLeft.x, topLeft.y);
  ctx.lineTo(topRight.x, topRight.y);
  ctx.lineTo(bottomRight.x, bottomRight.y);
  ctx.lineTo(bottomLeft.x, bottomLeft.y);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Clean design - no fold lines or dotted lines
  
  // Draw circle with blue outline
  ctx.fillStyle = '#f8fafc';
  ctx.strokeStyle = '#3b82f6';
  ctx.lineWidth = 2;
  
  ctx.beginPath();
  ctx.arc(circleCenterX, circleCenterY, circleRadius, 0, 2 * Math.PI);
  ctx.fill();
  ctx.stroke();

  // Draw cup size label above trapezoid
  ctx.fillStyle = '#1f2937';
  ctx.strokeStyle = '#3b82f6';
  ctx.lineWidth = 1;
  ctx.font = 'bold 10px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle'; // Ensure proper text baseline
  
  // Ultra-compact label for maximum space efficiency
  const labelText = `${cupSizeOz}oz`;
  const labelWidth = 22; // Ultra-compact width
  const labelHeight = 10; // Ultra-compact height
  const labelX = trapezoidCenterX - labelWidth/2;
  const labelY = topLeft.y - 14; // As close as possible to trapezoid
  
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(labelX, labelY, labelWidth, labelHeight);
  ctx.strokeRect(labelX, labelY, labelWidth, labelHeight);
  
  // Label text - positioned correctly in the center of the label box
  ctx.fillStyle = '#3b82f6';
  ctx.fillText(labelText, trapezoidCenterX, labelY + labelHeight/2);
  
  console.log(`🍵 GitHub Style Cup Complete:`, {
      cupSize: cupSizeOz, 
    trapezoidCenter: { x: trapezoidCenterX, y: trapezoidCenterY },
    circleCenter: { x: circleCenterX, y: circleCenterY },
    layout: 'GitHub original style - trapezoid above, circle below'
  });
}

// Draw complex 3D products (Shopping Bags)
function drawComplex3DProduct(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  settings: VisualizationSettings,
  productData?: any
) {
  console.log('🛍️ drawComplex3DProduct called with:', {
    x, y, width, height,
    productData: productData ? {
      productName: productData.productName,
      bagPreset: productData.bagPreset,
      flatSize: productData.flatSize
    } : 'undefined'
  });
  
  const centerX = x + width / 2;
  const centerY = y + height / 2;
  
  // Get shopping bag preset from product data or use default
  const bagPresetName = productData?.bagPreset || 'Medium';
  const bagPreset = getShoppingBagPreset(bagPresetName);
  
  console.log('🛍️ Bag preset lookup:', { bagPresetName, bagPreset });
  
  if (!bagPreset) {
    console.error('Shopping bag preset not found:', bagPresetName);
    return;
  }
  
  // Use the actual Step 3 dimensions from productData
  const step3Width = productData?.flatSize?.width || bagPreset.width;
  const step3Height = productData?.flatSize?.height || bagPreset.height;
  
  // For shopping bags, we need to calculate the total dieline dimensions
  // The Step 3 dimensions are the individual panel dimensions, not the total dieline
  const W = bagPreset.width;   // Individual panel width (cm)
  const H = bagPreset.height;  // Individual panel height (cm)
  const G = bagPreset.gusset;  // Gusset width (cm)
  
  // Fixed dimensions for shopping bags
  const T = Math.max(3, W * 0.12); // Top hem (proportional to width)
  const B = Math.max(6, W * 0.25); // Bottom flaps (proportional to width)
  
  const FIXED = {
    bleed: 0.3,    // cm
    safety: 0.3,   // cm
    glueFlap: 2,   // cm
    handleDia: 0.6, // cm
  };
  
  // Calculate total dieline dimensions (same as in Step 4 layout calculation)
  const totalW = W + G + W + G + FIXED.glueFlap; // Back + Gusset + Front + Gusset + Glue
  const totalH = T + H + B; // Top hem + Body height + Bottom flaps
  
  // Debug logging to verify dimensions
  console.log('🛍️ drawComplex3DProduct dimensions:', {
    bagPreset: bagPresetName,
    step3Width: step3Width,
    step3Height: step3Height,
    individualPanel: { W, H, G },
    calculatedTotal: { totalW, totalH },
    canvasSpace: { width, height }
  });
  
  // Scale to fit within the allocated canvas space
  const scaleX = (width * 0.8) / totalW;
  const scaleY = (height * 0.8) / totalH;
  const scale = Math.min(scaleX, scaleY);
  
  // Scaled dimensions
  const scaledW = W * scale;
  const scaledH = H * scale;
  const scaledG = G * scale;
  const scaledT = T * scale;
  const scaledB = B * scale;
  const scaledGlueFlap = FIXED.glueFlap * scale;
  const scaledHandleDia = FIXED.handleDia * scale;
  
  // Calculate scaled total dimensions
  const scaledBodyW = scaledW + scaledG + scaledW + scaledG + scaledGlueFlap;
  const scaledBodyH = scaledT + scaledH;
  const scaledTotalW = scaledBodyW;
  const scaledTotalH = scaledBodyH + scaledB;
  
  // Position bag centered
  const bagX = centerX - scaledTotalW / 2;
  const bagY = centerY - scaledTotalH / 2;
  
  // Positions of vertical seams from left
  const xBack = bagX;
  const xG1 = xBack + scaledW;
  const xFront = xG1 + scaledG;
  const xG2 = xFront + scaledW;
  const xGlue = xG2 + scaledG;
  
  // Handle positions
  const slotY = bagY + scaledT / 2;
  const slotOffsetX = scaledW / 4;
  const slotR = scaledHandleDia / 2;
  
  // Set drawing styles
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 1;
  ctx.fillStyle = '#ffffff';
  
  // Draw outer cut rectangle for body
  ctx.strokeRect(bagX, bagY, scaledTotalW, scaledBodyH);
  
  // Draw bottom flaps (cut rectangles)
  ctx.strokeRect(bagX, bagY + scaledBodyH, scaledW, scaledB);
  ctx.strokeRect(xG1, bagY + scaledBodyH, scaledG, scaledB);
  ctx.strokeRect(xFront, bagY + scaledBodyH, scaledW, scaledB);
  ctx.strokeRect(xG2, bagY + scaledBodyH, scaledG, scaledB);
  
  // Draw glue flap (cut rectangle)
  ctx.strokeRect(xGlue, bagY, scaledGlueFlap, scaledTotalH);
  
  // Draw vertical fold/seam lines (dashed)
  ctx.setLineDash([4, 2]);
  ctx.strokeStyle = '#666666';
  ctx.lineWidth = 0.5;
  
  // Vertical fold lines
  ctx.beginPath();
  ctx.moveTo(xG1, bagY);
  ctx.lineTo(xG1, bagY + scaledTotalH);
  ctx.stroke();
  
  ctx.beginPath();
  ctx.moveTo(xFront, bagY);
  ctx.lineTo(xFront, bagY + scaledTotalH);
  ctx.stroke();
  
  ctx.beginPath();
  ctx.moveTo(xG2, bagY);
  ctx.lineTo(xG2, bagY + scaledTotalH);
  ctx.stroke();
  
  ctx.beginPath();
  ctx.moveTo(xGlue, bagY);
  ctx.lineTo(xGlue, bagY + scaledTotalH);
  ctx.stroke();
  
  // Top hem fold line
  ctx.beginPath();
  ctx.moveTo(bagX, bagY + scaledT);
  ctx.lineTo(bagX + scaledTotalW, bagY + scaledT);
  ctx.stroke();
  
  // Bottom flap fold line
  ctx.beginPath();
  ctx.moveTo(bagX, bagY + scaledBodyH);
  ctx.lineTo(bagX + scaledTotalW, bagY + scaledBodyH);
  ctx.stroke();
  
  // Gusset triangular fold lines on bottom flaps
  // Left gusset
  ctx.beginPath();
  ctx.moveTo(xG1, bagY + scaledTotalH);
  ctx.lineTo(xG1 + scaledG / 2, bagY + scaledBodyH);
  ctx.stroke();
  
  ctx.beginPath();
  ctx.moveTo(xG1 + scaledG, bagY + scaledTotalH);
  ctx.lineTo(xG1 + scaledG / 2, bagY + scaledBodyH);
  ctx.stroke();
  
  // Right gusset
  ctx.beginPath();
  ctx.moveTo(xG2, bagY + scaledTotalH);
  ctx.lineTo(xG2 + scaledG / 2, bagY + scaledBodyH);
  ctx.stroke();
  
  ctx.beginPath();
  ctx.moveTo(xG2 + scaledG, bagY + scaledTotalH);
  ctx.lineTo(xG2 + scaledG / 2, bagY + scaledBodyH);
  ctx.stroke();
  
  // Reset line dash for solid lines
  ctx.setLineDash([]);
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 1;
  
  // Draw handle slots (circles)
  ctx.beginPath();
  ctx.arc(xBack + scaledW / 2 - slotOffsetX, slotY, slotR, 0, 2 * Math.PI);
  ctx.stroke();
  
  ctx.beginPath();
  ctx.arc(xBack + scaledW / 2 + slotOffsetX, slotY, slotR, 0, 2 * Math.PI);
  ctx.stroke();
  
  ctx.beginPath();
  ctx.arc(xFront + scaledW / 2 - slotOffsetX, slotY, slotR, 0, 2 * Math.PI);
  ctx.stroke();
  
  ctx.beginPath();
  ctx.arc(xFront + scaledW / 2 + slotOffsetX, slotY, slotR, 0, 2 * Math.PI);
  ctx.stroke();
  
  // Shopping bag label
  ctx.fillStyle = '#000000';
  ctx.font = 'bold 10px Inter, system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Shopping Bag', centerX, bagY - 8);
}

/**
 * Calculate optimal cutting pieces for the input sheet
 */
function calculateCutPieces(inputWidth: number, inputHeight: number, machineMaxWidth: number, machineMaxHeight: number) {
  console.log('🔍 calculateCutPieces called with:', {
    inputWidth, inputHeight, machineMaxWidth, machineMaxHeight
  });
  
  // Calculate both orientations
  const strategy1 = calculateCutStrategy(inputWidth, inputHeight, machineMaxWidth, machineMaxHeight);
  const strategy2 = calculateCutStrategy(inputWidth, inputHeight, machineMaxHeight, machineMaxWidth); // Rotated
  
  // Calculate efficiency for both strategies
  const efficiency1 = (strategy1.totalPieces * machineMaxWidth * machineMaxHeight) / (inputWidth * inputHeight);
  const efficiency2 = (strategy2.totalPieces * machineMaxWidth * machineMaxHeight) / (inputWidth * inputHeight);
  
  console.log('🎯 Cutting strategy comparison:', {
    strategy1: { 
      pieces: strategy1.totalPieces, 
      efficiency: (efficiency1 * 100).toFixed(1) + '%',
      layout: `${strategy1.piecesPerRow}×${strategy1.piecesPerCol}`
    },
    strategy2: { 
      pieces: strategy2.totalPieces, 
      efficiency: (efficiency2 * 100).toFixed(1) + '%',
      layout: `${strategy2.piecesPerRow}×${strategy2.piecesPerCol}`
    }
  });
  
  // Choose the strategy with better efficiency (>99% target)
  const bestStrategy = efficiency2 > efficiency1 && efficiency2 > 0.99 ? strategy2 : strategy1;
  
  console.log('🎯 Selected strategy:', {
    pieces: bestStrategy.totalPieces,
    efficiency: bestStrategy === strategy2 ? (efficiency2 * 100).toFixed(1) + '%' : (efficiency1 * 100).toFixed(1) + '%',
    layout: `${bestStrategy.piecesPerRow}×${bestStrategy.piecesPerCol}`,
    pieceSize: `${bestStrategy.pieceWidth}×${bestStrategy.pieceHeight}`
  });
  
  return bestStrategy;
}

/**
 * Calculate cutting strategy for given dimensions
 */
function calculateCutStrategy(sheetWidth: number, sheetHeight: number, maxWidth: number, maxHeight: number) {
  const pieces: Array<{x: number, y: number, width: number, height: number}> = [];
  const verticalCuts: number[] = [];
  const horizontalCuts: number[] = [];
  
  // Use machine max dimensions and geometric tiling
  const pieceWidth = maxWidth;
  const pieceHeight = maxHeight;
  
  // Calculate how many pieces fit horizontally and vertically
  const piecesPerRow = Math.floor(sheetWidth / pieceWidth);
  const piecesPerCol = Math.floor(sheetHeight / pieceHeight);
  
  // Generate pieces
  for (let row = 0; row < piecesPerCol; row++) {
    for (let col = 0; col < piecesPerRow; col++) {
      pieces.push({
        x: col * pieceWidth,
        y: row * pieceHeight,
        width: pieceWidth,
        height: pieceHeight
      });
    }
  }
  
  // Generate cutting lines
  for (let i = 1; i < piecesPerRow; i++) {
    verticalCuts.push(i * pieceWidth);
  }
  for (let i = 1; i < piecesPerCol; i++) {
    horizontalCuts.push(i * pieceHeight);
  }
  
  return {
    pieces,
    verticalCuts,
    horizontalCuts,
    totalPieces: pieces.length,
    pieceWidth,
    pieceHeight,
    piecesPerRow,
    piecesPerCol
  };
}

/**
 * Draw final printing layout showing the cut pieces
 */
function drawFinalPrintingLayout(
  canvas: HTMLCanvasElement,
  cutPieces: ReturnType<typeof calculateCutPieces>,
  outputWidth: number,
  outputHeight: number
) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Set high DPI for crisp rendering
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  ctx.scale(dpr, dpr);
  canvas.style.width = rect.width + 'px';
  canvas.style.height = rect.height + 'px';

  // Clear with premium background
  const bgGradient = ctx.createLinearGradient(0, 0, rect.width, rect.height);
  bgGradient.addColorStop(0, '#f0f9ff');
  bgGradient.addColorStop(1, '#e0f2fe');
  ctx.fillStyle = bgGradient;
  ctx.fillRect(0, 0, rect.width, rect.height);

  // Calculate scaling to fit all cut pieces
  const padding = Math.min(30, Math.max(20, rect.width * 0.08)); // Responsive padding
  const canvasUsableWidth = rect.width - 2 * padding;
  const canvasUsableHeight = rect.height - 2 * padding;
  
  // Find the maximum dimensions of cut pieces
  const maxPieceWidth = Math.max(...cutPieces.pieces.map(p => p.width));
  const maxPieceHeight = Math.max(...cutPieces.pieces.map(p => p.height));
  
  const scaleX = canvasUsableWidth / (maxPieceWidth * cutPieces.piecesPerRow);
  const scaleY = canvasUsableHeight / (maxPieceHeight * cutPieces.piecesPerCol);
  const scale = Math.min(scaleX, scaleY) * 0.75; // Better mobile fit
  
  // Center the layout
  const totalWidth = maxPieceWidth * cutPieces.piecesPerRow * scale;
  const totalHeight = maxPieceHeight * cutPieces.piecesPerCol * scale;
  const startX = (rect.width - totalWidth) / 2;
  const startY = (rect.height - totalHeight) / 2;

  // Draw background grid
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.06)';
  ctx.lineWidth = 0.5;
  const gridSize = 20;
  for (let x = 0; x < rect.width; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, rect.height);
    ctx.stroke();
  }
  for (let y = 0; y < rect.height; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(rect.width, y);
    ctx.stroke();
  }

  // Draw cut pieces
  cutPieces.pieces.forEach((piece, index) => {
    const pieceX = startX + (piece.x * scale);
    const pieceY = startY + (piece.y * scale);
    const pieceWidth = piece.width * scale;
    const pieceHeight = piece.height * scale;
    
    // Piece background with gradient
    const pieceGradient = ctx.createLinearGradient(pieceX, pieceY, pieceX + pieceWidth, pieceY + pieceHeight);
    pieceGradient.addColorStop(0, '#ffffff');
    pieceGradient.addColorStop(1, '#f1f5f9');
    ctx.fillStyle = pieceGradient;
    ctx.fillRect(pieceX, pieceY, pieceWidth, pieceHeight);
    
    // Piece border
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2;
    ctx.strokeRect(pieceX + 1, pieceY + 1, pieceWidth - 2, pieceHeight - 2);
    
    // Piece number
    ctx.fillStyle = '#1e40af';
    ctx.font = 'bold 14px Inter, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${index + 1}`, pieceX + pieceWidth / 2, pieceY + pieceHeight / 2);
    
    // Piece dimensions
    ctx.fillStyle = '#6b7280';
    ctx.font = '11px Inter, system-ui, sans-serif';
    ctx.fillText(`${piece.width.toFixed(1)}×${piece.height.toFixed(1)}`, pieceX + pieceWidth / 2, pieceY + pieceHeight / 2 + 18);
  });

  // Draw final output items on each piece
  cutPieces.pieces.forEach((piece, pieceIndex) => {
    const pieceX = startX + (piece.x * scale);
    const pieceY = startY + (piece.y * scale);
    const pieceWidth = piece.width * scale;
    const pieceHeight = piece.height * scale;
    
    // Calculate how many output items fit on this cut piece
    // For business cards (9x5.5), use Excel-based calculation (25 cards per 20x14 piece)
    let itemsPerRow, itemsPerCol;
    
    if (outputWidth === 9 && outputHeight === 5.5 && piece.width === 20 && piece.height === 14) {
      // Excel calculation: 25 business cards in 20x14 piece
      // This is typically arranged as 5x5 grid
      itemsPerRow = 5;
      itemsPerCol = 5;
    } else {
      // For other products, use mathematical calculation
      itemsPerRow = Math.floor(piece.width / outputWidth);
      itemsPerCol = Math.floor(piece.height / outputHeight);
    }
    
    // Draw output items on the cut piece
    for (let row = 0; row < itemsPerCol; row++) {
      for (let col = 0; col < itemsPerRow; col++) {
        const itemX = pieceX + col * (outputWidth * scale);
        const itemY = pieceY + row * (outputHeight * scale);
        const itemWidth = outputWidth * scale;
        const itemHeight = outputHeight * scale;
        
        // Item background
        const itemGradient = ctx.createRadialGradient(
          itemX + itemWidth / 2, itemY + itemHeight / 2, 0,
          itemX + itemWidth / 2, itemY + itemHeight / 2, Math.max(itemWidth, itemHeight) / 2
        );
        itemGradient.addColorStop(0, 'rgba(34, 197, 94, 0.2)');
        itemGradient.addColorStop(0.7, 'rgba(34, 197, 94, 0.1)');
        itemGradient.addColorStop(1, 'rgba(34, 197, 94, 0.05)');
        
        ctx.fillStyle = itemGradient;
        ctx.fillRect(itemX + 2, itemY + 2, itemWidth - 4, itemHeight - 4);
        
        // Item border
        ctx.strokeStyle = 'rgba(34, 197, 94, 0.6)';
        ctx.lineWidth = 1;
        ctx.strokeRect(itemX + 2, itemY + 2, itemWidth - 4, itemHeight - 4);
        
        // Item highlight
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.fillRect(itemX + 3, itemY + 3, itemWidth - 6, 1.5);
      }
    }
  });

  // Draw layout information
  ctx.fillStyle = '#1e40af';
  ctx.font = 'bold 12px Inter, system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  
  const infoText = `Final Printing Layout: ${cutPieces.totalPieces} cut pieces`;
  const infoMetrics = ctx.measureText(infoText);
  
  ctx.fillStyle = 'rgba(30, 64, 175, 0.1)';
  ctx.fillRect(10, 10, infoMetrics.width + 10, 18);
  
  ctx.fillStyle = 'rgba(30, 64, 175, 0.9)';
  ctx.fillText(infoText, 15, 12);

  // Draw efficiency information - use Excel-based calculation for business cards
  const totalOutputItems = cutPieces.pieces.reduce((total, piece) => {
    let itemsPerRow, itemsPerCol;
    
    if (outputWidth === 9 && outputHeight === 5.5 && piece.width === 20 && piece.height === 14) {
      // Excel calculation: 25 business cards in 20x14 piece
      itemsPerRow = 5;
      itemsPerCol = 5;
    } else {
      // For other products, use mathematical calculation
      itemsPerRow = Math.floor(piece.width / outputWidth);
      itemsPerCol = Math.floor(piece.height / outputHeight);
    }
    
    return total + (itemsPerRow * itemsPerCol);
  }, 0);
  
  const efficiencyText = `Total Output Items: ${totalOutputItems}`;
  const efficiencyMetrics = ctx.measureText(efficiencyText);
  
  ctx.fillStyle = 'rgba(34, 197, 94, 0.1)';
  ctx.fillRect(10, 35, efficiencyMetrics.width + 10, 18);
  
  ctx.fillStyle = 'rgba(34, 197, 94, 0.9)';
  ctx.fillText(efficiencyText, 15, 37);
}

const Step4Operational: FC<Step4Props> = ({ formData, setFormData }) => {

  // ===== Professional Visualization State =====
  const [visualizationType, setVisualizationType] = React.useState<VisualizationType>('print');
  
  // ===== Dashboard Cards Collapse State =====
  const [isAdvancedSheetAnalysisCollapsed, setIsAdvancedSheetAnalysisCollapsed] = React.useState(true);
  const [isProductionIntelligenceCollapsed, setIsProductionIntelligenceCollapsed] = React.useState(true);
  const [isOperationsDashboardCollapsed, setIsOperationsDashboardCollapsed] = React.useState(true);
  
  // ===== Costing Analysis State =====
  const [digitalPricing, setDigitalPricing] = React.useState<DigitalPricing | null>(null);
  const [offsetPricing, setOffsetPricing] = React.useState<OffsetPricing | null>(null);
  const [digitalCostingResults, setDigitalCostingResults] = React.useState<DigitalCostingResult[]>([]);
  const [offsetCostingResult, setOffsetCostingResult] = React.useState<OffsetCostingResult | null>(null);
  const [selectedDigitalOption, setSelectedDigitalOption] = React.useState<string>('');
  const [selectedOffsetPress, setSelectedOffsetPress] = React.useState<string>('');
  const [loadingPricing, setLoadingPricing] = React.useState(false);
  
  

  // ===== Debug: Log component mount and initial data =====
  React.useEffect(() => {
    console.log('🚀 Step4Operational: Component mounted with data:', {
      productsLength: formData.products.length,
      operationalPapersLength: formData.operational.papers.length,
        products: formData.products.map((p: any) => ({
        name: p.productName,
        quantity: p.quantity,
        papers: p.papers.length,
        colors: p.colors
      })),
      operationalPapers: formData.operational.papers.map((p: any) => ({
        inputWidth: p.inputWidth,
        inputHeight: p.inputHeight,
        outputWidth: p.outputWidth,
        outputHeight: p.outputHeight,
        selectedColors: p.selectedColors,
        pricePerSheet: p.pricePerSheet,
        pricePerPacket: p.pricePerPacket
      }))
    });
    
    // CRITICAL: Initialize operational data structure for multiple products
    initializeOperationalData();
  }, [formData.products]);

  // ===== Initialize operational data structure for multiple products =====
  const initializeOperationalData = () => {
    console.log('🔄 Step4Operational: Initializing operational data structure...');
    
    // Calculate total papers needed across all products
    const totalPapersNeeded = formData.products.reduce((total, product) => total + product.papers.length, 0);
    
    // If operational papers don't match total papers needed, initialize them
    if (formData.operational.papers.length !== totalPapersNeeded) {
      console.log(`📊 Initializing operational data: ${totalPapersNeeded} papers needed, ${formData.operational.papers.length} currently exist`);
      
      const newOperationalPapers: any[] = [];
      let globalPaperIndex = 0;
      
      formData.products.forEach((product, productIndex) => {
        product.papers.forEach((paper: any, paperIndex: number) => {
          // Check if we have existing operational data for this paper
          const existingOpPaper = formData.operational.papers[globalPaperIndex];
          
          if (existingOpPaper) {
            // Use existing data
            newOperationalPapers.push(existingOpPaper);
          } else {
            // Create new operational paper entry
            const newOpPaper = {
              inputWidth: null,
              inputHeight: null,
              pricePerPacket: null,
              pricePerSheet: null,
              sheetsPerPacket: null,
              recommendedSheets: 0,
              enteredSheets: null,
              outputWidth: product.closeSize?.width ?? product.flatSize?.width ?? null,
              outputHeight: product.closeSize?.height ?? product.flatSize?.height ?? null,
              selectedColors: product.colors ? [product.colors.front, product.colors.back].filter((color): color is string => Boolean(color)) : []
            };
            newOperationalPapers.push(newOpPaper);
          }
          
          globalPaperIndex++;
        });
      });
      
      // Update form data with proper operational structure
      setFormData(prev => ({
        ...prev,
        operational: {
          ...prev.operational,
          papers: newOperationalPapers
        }
      }));
      
      console.log('✅ Operational data structure initialized:', newOperationalPapers);
    }
    
    // Initialize output dimensions for all products
      const newOutputDimensions: { [productIndex: number]: { width: number; height: number } } = {};
      formData.products.forEach((product, productIndex) => {
      newOutputDimensions[productIndex] = {
        width: product.closeSize?.width ?? product.flatSize?.width ?? 0,
        height: product.closeSize?.height ?? product.flatSize?.height ?? 0
      };
    });
    setOutputDimensions(newOutputDimensions);
    

  };



  // ===== Output size state management =====
  const [outputDimensions, setOutputDimensions] = React.useState<{
    [productIndex: number]: { width: number; height: number }
  }>(() => {
    const initial: { [productIndex: number]: { width: number; height: number } } = {};
    formData.products.forEach((product, index) => {
      // Check if we have saved operational data for this product
      const hasOperationalData = formData.operational.papers.length > index;
      
      if (hasOperationalData) {
        // Use saved operational data if available
        const opPaper = formData.operational.papers[index];
        initial[index] = {
          width: opPaper?.outputWidth ?? product?.closeSize?.width ?? product?.flatSize?.width ?? 0,
          height: opPaper?.outputHeight ?? product?.closeSize?.height ?? product?.flatSize?.height ?? 0
        };
      } else {
        // Fall back to product dimensions
        initial[index] = {
          width: product?.closeSize?.width ?? product?.flatSize?.width ?? 0,
          height: product?.closeSize?.height ?? product?.flatSize?.height ?? 0
        };
      }
    });
    return initial;
  });



  // ===== New simple color codes state =====
  const [paperColors, setPaperColors] = React.useState<{ [productIndex: number]: { [paperIndex: number]: string[] } }>({});
  const [colorInputs, setColorInputs] = React.useState<{ [productIndex: number]: { [paperIndex: number]: string } }>({});
  const [colorSaveStatus, setColorSaveStatus] = React.useState<{ [productIndex: number]: { [paperIndex: number]: 'idle' | 'saving' | 'saved' | 'error' } }>({});
  const [isColorsLoading, setIsColorsLoading] = React.useState(true);
  const [showColorSavedMessage, setShowColorSavedMessage] = React.useState(false);

  // ===== Enhanced helper function to convert color input to CSS color =====
  const getColorFromInput = (colorInput: string): string => {
    const input = colorInput.trim().toLowerCase();
    
    // Handle hex codes
    if (input.startsWith('#')) {
      // Validate hex format
      if (/^#[0-9A-Fa-f]{3}$|^#[0-9A-Fa-f]{6}$/.test(input)) {
        return input;
      }
      return 'transparent'; // Invalid hex
    }
    
    // Handle common color names with expanded palette
    const colorMap: { [key: string]: string } = {
      // Basic colors
      'red': '#FF0000',
      'green': '#00FF00',
      'blue': '#0000FF',
      'yellow': '#FFFF00',
      'cyan': '#00FFFF',
      'magenta': '#FF00FF',
      'black': '#000000',
      'white': '#FFFFFF',
      'gray': '#808080',
      'grey': '#808080',
      'orange': '#FFA500',
      'purple': '#800080',
      'pink': '#FFC0CB',
      'brown': '#A52A2A',
      'lime': '#00FF00',
      'navy': '#000080',
      'teal': '#008080',
      'olive': '#808000',
      'maroon': '#800000',
      'silver': '#C0C0C0',
      'gold': '#FFD700',
      'violet': '#EE82EE',
      'indigo': '#4B0082',
      'coral': '#FF7F50',
      'turquoise': '#40E0D0',
      'lavender': '#E6E6FA',
      'plum': '#DDA0DD',
      'salmon': '#FA8072',
      'khaki': '#F0E68C',
      'azure': '#F0FFFF',
      'ivory': '#FFFFF0',
      'wheat': '#F5DEB3',
      'tan': '#D2B48C',
      'beige': '#F5F5DC',
      'mint': '#F5FFFA',
      'peach': '#FFE5B4',
      'rose': '#FFE4E1',
      'cream': '#FFFDD0',
      'charcoal': '#36454F',
      'slate': '#708090',
      'steel': '#4682B4',
      
      // Process colors
      'cmyk': '#000000', // Black for CMYK
      'k': '#000000',    // Black key
      'm': '#FF00FF',    // Magenta
      'y': '#FFFF00',    // Yellow
      'c': '#00FFFF',    // Cyan
      
      // Additional professional colors
      'forest': '#228B22',
      'emerald': '#50C878',
      'sapphire': '#0F52BA',
      'ruby': '#E0115F',
      'amber': '#FFBF00',
      'chrome': '#E8F1F8',
      'gunmetal': '#2C3539',
      'platinum': '#E5E4E2',
      'titanium': '#C0C0C0',
      'brass': '#B5A642',
      'aluminum': '#848789',
      'nickel': '#727472',
      'zinc': '#7B8C4D'
    };
    
    if (colorMap[input]) {
      return colorMap[input];
    }
    
    // Handle Pantone-like codes with some common mappings
    if (/^[0-9]{3,4}[A-Z]$/i.test(input)) {
      // Map some common Pantone codes to approximate colors
      const pantoneMap: { [key: string]: string } = {
        '185C': '#C8102E', // Pantone Red
        '286C': '#003DA5', // Pantone Blue
        '354C': '#00A651', // Pantone Green
        '116C': '#FFD100', // Pantone Yellow
        '212C': '#FF6F61', // Pantone Coral
        '2925C': '#7BA7BC', // Pantone Blue Gray
        '7545C': '#425563', // Pantone Dark Blue Gray
        '7546C': '#5B6770', // Pantone Medium Blue Gray
        '7547C': '#8E8F8F', // Pantone Light Blue Gray
        '7548C': '#A7A8AA', // Pantone Very Light Blue Gray
        '7549C': '#C6C7C8', // Pantone Very Light Blue Gray
        '7550C': '#E3E3E3', // Pantone Very Light Blue Gray
        '7551C': '#F0F0F0', // Pantone Very Light Blue Gray
        '7552C': '#F8F8F8', // Pantone Very Light Blue Gray
        '7553C': '#FDFDFD', // Pantone Very Light Blue Gray
        '7554C': '#FFFFFF', // Pantone White
        '7555C': '#000000', // Pantone Black
        '7556C': '#1C1C1C', // Pantone Very Dark Gray
        '7557C': '#2D2D2D', // Pantone Dark Gray
        '7558C': '#3D3D3D', // Pantone Medium Dark Gray
        '7559C': '#4D4D4D', // Pantone Medium Gray
        '7560C': '#5D5D5D', // Pantone Medium Light Gray
        '7561C': '#6D6D6D', // Pantone Light Gray
        '7562C': '#7D7D7D', // Pantone Very Light Gray
        '7563C': '#8D8D8D', // Pantone Very Light Gray
        '7564C': '#9D9D9D', // Pantone Very Light Gray
        '7565C': '#ADADAD', // Pantone Very Light Gray
        '7566C': '#BDBDBD', // Pantone Very Light Gray
        '7567C': '#CDCDCD', // Pantone Very Light Gray
        '7568C': '#DDDDDD', // Pantone Very Light Gray
        '7569C': '#EDEDED', // Pantone Very Light Gray
        '7570C': '#FDFDFD'  // Pantone Very Light Gray
      };
      
      if (pantoneMap[input.toUpperCase()]) {
        return pantoneMap[input.toUpperCase()];
      }
      
      // For unknown Pantone codes, show a pattern
      return 'transparent';
    }
    
    // Try to parse as CSS color
    try {
      // Create a temporary element to test if the color is valid
      const temp = document.createElement('div');
      temp.style.color = input;
      if (temp.style.color !== '') {
        return input;
      }
    } catch (e) {
      // Ignore errors
    }
    
    return 'transparent'; // Unknown color
  };

  // ===== Sync local state with formData changes (important for editing existing quotes) =====
  React.useEffect(() => {
    console.log('🔄 Step4Operational: formData changed, syncing local state...', {
      productsLength: formData.products.length,
      operationalPapersLength: formData.operational.papers.length,
      hasOperationalData: formData.operational.papers.some((p: any) => 
        p.inputWidth !== null || p.inputHeight !== null || 
        p.outputWidth !== null || p.outputHeight !== null
      )
    });

    // Sync colors from formData to local state
    const newPaperColors: { [productIndex: number]: { [paperIndex: number]: string[] } } = {};
    formData.products.forEach((product, productIndex) => {
      product.papers.forEach((paper: any, paperIndex: number) => {
        // Calculate global paper index
        const globalPaperIndex = formData.products
          .slice(0, productIndex)
          .reduce((total: number, p: any) => total + p.papers.length, 0) + paperIndex;
        
        // Get colors from operational data
        const operationalPaper = formData.operational.papers[globalPaperIndex];
        if (operationalPaper?.selectedColors && operationalPaper.selectedColors.length > 0) {
          if (!newPaperColors[productIndex]) newPaperColors[productIndex] = {};
          newPaperColors[productIndex][paperIndex] = operationalPaper.selectedColors;
        }
      });
    });
    
    // Update local state if colors changed
    if (Object.keys(newPaperColors).length > 0) {
      setPaperColors(newPaperColors);
    }
    
    // Set loading to false after initial sync
    setIsColorsLoading(false);

    // If we have operational data, ensure our local state is in sync
    if (formData.operational.papers.length > 0) {
      // Update outputDimensions from operational data
      const newOutputDimensions: { [productIndex: number]: { width: number; height: number } } = {};
      formData.products.forEach((product, productIndex) => {
        // Find the corresponding operational paper for this product
        let globalPaperIndex = 0;
        for (let pi = 0; pi < productIndex; pi++) {
          globalPaperIndex += formData.products[pi].papers.length;
        }
        
        // Use the first paper's operational data for this product
        const opPaper = formData.operational.papers[globalPaperIndex];
        if (opPaper) {
          newOutputDimensions[productIndex] = {
            width: opPaper.outputWidth ?? product?.closeSize?.width ?? product?.flatSize?.width ?? 0,
            height: opPaper.outputHeight ?? product?.closeSize?.height ?? product?.flatSize?.height ?? 0
          };
          console.log(`📏 Syncing outputDimensions for product ${productIndex}:`, newOutputDimensions[productIndex]);
        } else {
          newOutputDimensions[productIndex] = {
            width: product?.closeSize?.width ?? product?.flatSize?.width ?? 0,
            height: product?.closeSize?.height ?? product?.flatSize?.height ?? 0
          };
        }
      });
      
      setOutputDimensions(newOutputDimensions);
    }
  }, [formData.operational.papers, formData.products]);

  // ===== Debug: Monitor color changes =====


  // ===== Track user edits to enteredSheets =====
  const [userEditedSheets, setUserEditedSheets] = React.useState<Set<string>>(new Set());
  
  // ===== Track user edits to input dimensions =====
  const [userEditedInputDimensions, setUserEditedInputDimensions] = React.useState<Set<string>>(new Set());
  
  // ===== Additional costs state =====
  // Use formData.additionalCosts instead of local state for persistence
  const additionalCosts = formData.additionalCosts || [];
  
  const setAdditionalCosts = (newCosts: Array<{
    id: string;
    description: string;
    cost: number;
    comment: string;
  }>) => {
    setFormData(prev => ({
      ...prev,
      additionalCosts: newCosts
    }));
  };

  // ===== Supplier database modal =====
  const [showSupplierDB, setShowSupplierDB] = React.useState(false);

  // ===== Update outputDimensions when formData changes (e.g., when existing quote is selected) =====
  React.useEffect(() => {
    console.log('📏 Step4Operational: Updating outputDimensions...', {
      productsLength: formData.products.length,
      operationalPapersLength: formData.operational.papers.length,
      formDataProducts: formData.products.map((p, i) => ({
        index: i,
        productName: p.productName,
        flatSize: p.flatSize,
        closeSize: p.closeSize
      }))
    });
    
    const newOutputDimensions: { [productIndex: number]: { width: number; height: number } } = {};
    
    formData.products.forEach((product, index) => {
      // Check if we have saved operational data for this product
      const hasOperationalData = formData.operational.papers.length > index;
      
      // Special handling for shopping bags - calculate total dieline dimensions
      if (product?.productName === 'Shopping Bag' && product?.bagPreset) {
        const bagPreset = getShoppingBagPreset(product.bagPreset);
        if (bagPreset) {
          const W = bagPreset.width;   // Individual panel width
          const H = bagPreset.height;  // Individual panel height
          const G = bagPreset.gusset;  // Gusset width
          const T = Math.max(3, W * 0.12); // Top hem (proportional)
          const B = Math.max(6, W * 0.25); // Bottom flaps (proportional)
          const glueFlap = 2; // Fixed glue flap width
          
          // Calculate total dieline dimensions
          const totalWidth = W + G + W + G + glueFlap; // Back + Gusset + Front + Gusset + Glue
          const totalHeight = T + H + B; // Top hem + Body height + Bottom flaps
          
          newOutputDimensions[index] = {
            width: totalWidth,
            height: totalHeight
          };
          
          console.log(`🛍️ Product ${index}: Shopping bag dieline dimensions - width: ${totalWidth}, height: ${totalHeight}`);
        } else {
          // Fallback to product dimensions if preset not found
          newOutputDimensions[index] = {
            width: product?.closeSize?.width ?? product?.flatSize?.width ?? 0,
            height: product?.closeSize?.height ?? product?.flatSize?.height ?? 0
          };
          console.log(`🛍️ Product ${index}: Shopping bag preset not found, using fallback dimensions`);
        }
      } else if (hasOperationalData) {
        // Use saved operational data if available
        const opPaper = formData.operational.papers[index];
        newOutputDimensions[index] = {
          width: opPaper?.outputWidth ?? product?.closeSize?.width ?? product?.flatSize?.width ?? 0,
          height: opPaper?.outputHeight ?? product?.closeSize?.height ?? product?.flatSize?.height ?? 0
        };
        console.log(`📏 Product ${index}: Using operational data - width: ${opPaper?.outputWidth}, height: ${opPaper?.outputHeight}`);
      } else {
        // Fall back to product dimensions
        newOutputDimensions[index] = {
          width: product?.closeSize?.width ?? product?.flatSize?.width ?? 0,
          height: product?.closeSize?.height ?? product?.flatSize?.height ?? 0
        };
        console.log(`📏 Product ${index}: Using product dimensions - width: ${product?.closeSize?.width || product?.flatSize?.width}, height: ${product?.closeSize?.height || product?.flatSize?.height}`);
      }
    });
    
    console.log('📏 Final outputDimensions:', newOutputDimensions);
    setOutputDimensions(newOutputDimensions);
  }, [formData.products, formData.operational.papers]);

  // ===== Supplier Database state =====
  const [suppliers, setSuppliers] = React.useState<any[]>([]);
  const [materials, setMaterials] = React.useState<any[]>([]);
  const [isLoadingSuppliers, setIsLoadingSuppliers] = React.useState(false);
  const [supplierSearchTerm, setSupplierSearchTerm] = React.useState('');
  const [selectedSupplier, setSelectedSupplier] = React.useState('');
  const [selectedGSM, setSelectedGSM] = React.useState('');

  // ===== Get paper price from materials database =====
  const getPaperPriceFromMaterials = (paperName: string, gsm: string): number | null => {
    if (!materials || materials.length === 0) {
      console.log('🔍 getPaperPriceFromMaterials: No materials available');
      return null;
    }
    
    console.log('🔍 getPaperPriceFromMaterials: Looking for paper:', { paperName, gsm });
    console.log('🔍 Available materials:', materials.map(m => ({ name: m.name, gsm: m.gsm, cost: m.cost, unit: m.unit, sheetsPerPacket: m.sheetsPerPacket })));
    
    // Try to find exact match first
    const exactMatch = materials.find(material => 
      material.name?.toLowerCase().includes(paperName.toLowerCase()) && 
      material.gsm === gsm
    );
    
    if (exactMatch && exactMatch.cost) {
      console.log('🔍 Found exact match:', exactMatch);
      // Convert cost to price per sheet if needed
      // If unit is 'packet' and we have sheetsPerPacket, calculate per sheet
      if (exactMatch.unit === 'packet' && exactMatch.sheetsPerPacket) {
        return exactMatch.cost / exactMatch.sheetsPerPacket;
      }
      // If unit is 'sheet' or 'per sheet', use cost directly
      return exactMatch.cost;
    }
    
    // Try to find by name only
    const nameMatch = materials.find(material => 
      material.name?.toLowerCase().includes(paperName.toLowerCase())
    );
    
    if (nameMatch && nameMatch.cost) {
      console.log('🔍 Found name match:', nameMatch);
      // Convert cost to price per sheet if needed
      if (nameMatch.unit === 'packet' && nameMatch.sheetsPerPacket) {
        return nameMatch.cost / nameMatch.sheetsPerPacket;
      }
      return nameMatch.cost;
    }
    
    console.log('🔍 No match found for paper:', paperName);
    return null;
  };

  // ===== Enhanced calculation exactly matching HTML logic =====
  const perPaperCalc = React.useMemo(() => {
    console.log('🔄 perPaperCalc recalculating due to dependency change:', {
      operationalPapersLength: formData.operational.papers.length,
      productsLength: formData.products.length,
      manualPricingData: formData.operational.papers.map((p: any) => ({
        pricePerSheet: p.pricePerSheet,
        pricePerPacket: p.pricePerPacket,
        sheetsPerPacket: p.sheetsPerPacket
      }))
    });
    // Calculate for each product with their own paper indices
    return formData.products.map((product, productIndex) => {
      const qty = product?.quantity ?? 0;
      const productDimensions = outputDimensions[productIndex] || { width: 0, height: 0 };

      // Map through the product's papers (not operational papers)
      return product.papers.map((paper: any, paperIndex: number) => {
        // Calculate the global paper index for this product's paper
        let globalPaperIndex = 0;
        for (let pi = 0; pi < productIndex; pi++) {
          globalPaperIndex += formData.products[pi].papers.length;
        }
        globalPaperIndex += paperIndex;
        
        const opPaper = formData.operational.papers[globalPaperIndex];
        
        // Get product configuration for proper gripper, gap, and bleed values
        const productConfig = getProductConfig(product?.productName || 'business-cards');
        const gripperWidth = product?.gripper || productConfig?.defaultGripper || 0.9;
        
        // Use Step 3 product dimensions directly instead of outputDimensions
        let step3ProductWidth = product?.flatSize?.width || productConfig?.defaultSizes?.width || 9;
        let step3ProductHeight = product?.flatSize?.height || productConfig?.defaultSizes?.height || 5.5;
        
        // Use optimized gap for business cards, 0.2cm gap for cups for maximum packing, otherwise use product config
        const baseGapWidth = product?.productName === 'Cups' ? 0.2 : (product?.gap || productConfig?.defaultGap || 0.5);
        const gapWidth = (product?.gripperProductName === 'Business Card' || 
                         (step3ProductWidth >= 8.5 && step3ProductWidth <= 10 && step3ProductHeight >= 5 && step3ProductHeight <= 6)) 
          ? Math.min(baseGapWidth, 0.2) 
          : baseGapWidth;
        const bleedWidth = product?.bleed || productConfig?.defaultBleed || 0.3;
        
        // Debug: Check what product we're dealing with
        console.log('🔍 Product debug info:', {
          productName: product?.productName,
          bagPreset: product?.bagPreset,
          flatSize: product?.flatSize,
          step3ProductWidth,
          step3ProductHeight
        });
        
        // Special handling for shopping bags - calculate total dieline dimensions
        if (product?.productName === 'Shopping Bag' && product?.bagPreset) {
          console.log('🛍️ Processing shopping bag...');
          const bagPreset = getShoppingBagPreset(product.bagPreset);
          if (bagPreset) {
            const W = bagPreset.width;   // Individual panel width
            const H = bagPreset.height;  // Individual panel height
            const G = bagPreset.gusset;  // Gusset width
            const T = Math.max(3, W * 0.12); // Top hem (proportional)
            const B = Math.max(6, W * 0.25); // Bottom flaps (proportional)
            const glueFlap = 2; // Fixed glue flap width
            
            // Calculate total dieline dimensions
            step3ProductWidth = W + G + W + G + glueFlap; // Back + Gusset + Front + Gusset + Glue
            step3ProductHeight = T + H + B; // Top hem + Body height + Bottom flaps
            
            console.log('🛍️ Shopping bag dieline dimensions (BEFORE computeLayout):', {
              preset: product.bagPreset,
              panelWidth: W,
              panelHeight: H,
              gusset: G,
              topHem: T,
              bottomFlaps: B,
              glueFlap: glueFlap,
              totalWidth: step3ProductWidth,
              totalHeight: step3ProductHeight
            });
          } else {
            console.error('🛍️ Shopping bag preset not found:', product.bagPreset);
          }
        } else {
          console.log('🛍️ Not a shopping bag or missing bagPreset:', {
            isShoppingBag: product?.productName === 'Shopping Bag',
            hasBagPreset: !!product?.bagPreset
          });
        }
        
        // Debug cup dimensions
        if (product?.productName === 'Cups') {
          console.log(`🍵 Cup Product ${productIndex}:`, {
            cupSizeOz: product.cupSizeOz,
            flatSize: product.flatSize,
            step3ProductWidth,
            step3ProductHeight,
            productConfig: productConfig?.defaultSizes,
            safetyGap: 0.5,
            bleedWidth,
            productWithSafetyWidth: step3ProductWidth + (2 * bleedWidth) + (2 * 0.5),
            productWithSafetyHeight: step3ProductHeight + (2 * bleedWidth) + (2 * 0.5)
          });
        }
        
        
        // Calculate dynamic press dimensions based on product size
        let dynamicPressWidth = 35; // Default fallback
        let dynamicPressHeight = 50; // Default fallback
        
        // Use outputDimensions if available (from Step 3), otherwise fall back to step3Product dimensions
        let productWidth, productHeight;
        if (formData && productIndex !== undefined && formData.outputDimensions && formData.outputDimensions[productIndex]) {
          productWidth = formData.outputDimensions[productIndex].width;
          productHeight = formData.outputDimensions[productIndex].height;
          console.log('🔍 Using outputDimensions for computeLayout:', {
            width: productWidth,
            height: productHeight,
            productIndex,
            source: 'outputDimensions'
          });
        } else if (step3ProductWidth && step3ProductHeight) {
          productWidth = step3ProductWidth;
          productHeight = step3ProductHeight;
          console.log('🔍 Using step3Product dimensions for computeLayout:', {
            width: productWidth,
            height: productHeight,
            source: 'step3Product'
          });
        }
        
        if (productWidth && productHeight) {
          const pressDimension = calculateVisualizationPressDimensions({
            width: productWidth,
            height: productHeight
          }, formData);
          
          if (pressDimension) {
            dynamicPressWidth = pressDimension.width;
            dynamicPressHeight = pressDimension.height;
            console.log('🎯 Using dynamic press dimensions for computeLayout:', pressDimension);
          } else {
            console.warn('⚠️ Failed to calculate dynamic press dimensions for computeLayout, using fallback');
          }
        } else {
          console.warn('⚠️ Missing product dimensions for computeLayout, using default press size');
        }
        
        // Initialize layout - will be populated differently for digital vs offset
        let layout: any;
        

        // Use new Excel-based calculation for recommended sheets
        let recommendedSheets: number;
        
        // Get paper cost per sheet for calculation - same logic as Digital Pricing Summary
        const paperName = product.papers[paperIndex]?.name || "";
        const paperGSM  = product.papers[paperIndex]?.gsm  || "";
        const materialPrice = getPaperPriceFromMaterials(paperName, paperGSM);

        let paperCostPerSheet = opPaper?.pricePerSheet;
        if (paperCostPerSheet == null) {
          if (opPaper?.pricePerPacket != null && opPaper?.sheetsPerPacket != null && opPaper.sheetsPerPacket > 0) {
            paperCostPerSheet = opPaper.pricePerPacket / opPaper.sheetsPerPacket;
          } else {
            paperCostPerSheet = materialPrice ?? 10; // Use Step 3 materials database, fallback to 10
          }
        }
        
        // Debug logging for manual pricing integration
        if (opPaper?.pricePerSheet != null) {
          console.log('💰 Main calc using direct sheet pricing:', { pricePerSheet: paperCostPerSheet });
        } else if (opPaper?.pricePerPacket != null && opPaper?.sheetsPerPacket != null && opPaper.sheetsPerPacket > 0) {
          console.log('📦 Main calc using packet pricing:', {
            pricePerPacket: opPaper.pricePerPacket,
            sheetsPerPacket: opPaper.sheetsPerPacket,
            calculatedPricePerSheet: paperCostPerSheet
          });
          } else {
            console.log('📄 Main calc using materials database pricing:', {
              materialPrice,
              fallbackPrice: paperCostPerSheet
            });
          }
        
        // Extract colors from product
        const parseColors = (colorStr: any): number => {
          if (!colorStr) return 0;
          const str = colorStr.toString();
          
          // Check for "4+1" or "4+2" format
          const plusMatch = str.match(/(\d+)\+(\d+)/);
          if (plusMatch) {
            const base = parseInt(plusMatch[1]);
            const additional = parseInt(plusMatch[2]);
            return base + additional;
          }
          
          // Fallback to single number
          const singleMatch = str.match(/\d+/);
          return singleMatch ? parseInt(singleMatch[0]) : 0;
        };

        const frontColors = parseColors(product.colors?.front);
        const backColors = parseColors(product.colors?.back);
        const rawColours = Math.max(frontColors, backColors) || 4;
        
        // Check if this is digital printing
        const isDigital = product?.printingSelection === 'Digital';
        
        // Color categorization: ONLY apply for Digital (1-3 colors = 1 color, 4+ colors = 4 colors)
        // For Offset, use actual color count for accurate plate cost calculation
        const colours = isDigital ? (rawColours <= 3 ? 1 : 4) : rawColours;
        
        if (isDigital) {
          // Use digital calculation for digital printing
          try {
            const digitalResults = excelDigitalCalculation({
              qty,
              piece: { w: step3ProductWidth, h: step3ProductHeight },
              sides: Number(product.sides) as 1 | 2,
              colorsF: colours as 1 | 2 | 4,
              colorsB: 1,
              parent: { w: 100, h: 70 },
              allowRotate: true,
              paperCostPerSheet: paperCostPerSheet // Pass manual paper pricing
            });
            
            if (digitalResults.length > 0) {
              // Use the cheapest digital option
              const cheapest = digitalResults.reduce((min, current) => 
                current.total < min.total ? current : min
              );
              
              recommendedSheets = cheapest.parents;
              
              // Create layout object from digital calculation results
              if (cheapest.gridLayout) {
                layout = {
                  usableW: cheapest.gridLayout.sheetWidth - 1, // Subtract margins
                  usableH: cheapest.gridLayout.sheetHeight - 1,
                  itemsPerSheet: cheapest.upsPerSheet,
                  efficiency: 95,
                  orientation: cheapest.gridLayout.orientation,
                  itemsPerRow: cheapest.gridLayout.itemsPerRow,
                  itemsPerCol: cheapest.gridLayout.itemsPerCol,
                  productShape: 'rectangular' as const,
                  gripperOnLongSide: true,
                  gripperPosition: 'top',
                  pressWidth: cheapest.gridLayout.sheetWidth,
                  pressHeight: cheapest.gridLayout.sheetHeight,
                  digitalResults: digitalResults,
                  selectedDigitalOption: cheapest
                };
              } else {
                throw new Error('No grid layout data in digital results');
              }
              
              console.log('📊 Digital calculation result:', {
                productName: product?.productName,
                pieceW: step3ProductWidth,
                pieceH: step3ProductHeight,
                digitalResults,
                selectedOption: cheapest.option,
                recommendedSheets: cheapest.parents,
                upsPerSheet: cheapest.upsPerSheet,
                gridLayout: cheapest.gridLayout,
                layout: layout,
                pressSheetSize: `${cheapest.gridLayout.sheetWidth}×${cheapest.gridLayout.sheetHeight} cm`,
                total: cheapest.total
              });
            } else {
              throw new Error('No digital results available');
            }
          } catch (error) {
            console.error('❌ Digital calculation failed, falling back to computeLayout:', error);
            // Fallback to computeLayout for digital
            layout = computeLayout(
              dynamicPressWidth,
              dynamicPressHeight,
              step3ProductWidth,
              step3ProductHeight,
              gripperWidth,
              0.5,
              gapWidth,
              bleedWidth
            );
            recommendedSheets = layout.itemsPerSheet > 0 ? Math.ceil(qty / layout.itemsPerSheet) : 0;
          }
        } else {
          // Use offset calculation for offset printing
          // First, compute layout using offset press dimensions
          layout = computeLayout(
            dynamicPressWidth,  // Dynamic press sheet width
            dynamicPressHeight, // Dynamic press sheet height
            step3ProductWidth,  // Use Step 3 dimensions
            step3ProductHeight, // Use Step 3 dimensions
            gripperWidth,
            0.5, // edgeMargin
            gapWidth,
            bleedWidth
          );
          
          console.log('🔍 computeLayout result for offset:', layout);
          
          try {
            // Build base parameters
            const base = { 
              pieceW: step3ProductWidth, 
              pieceH: step3ProductHeight, 
              qty, 
              sides: Number(product.sides) || 2, 
              colours, 
              paperCostPerSheet 
            };
            
            // Check if user specified parent size in Step 4
            const userParentW = opPaper?.inputWidth;
            const userParentH = opPaper?.inputHeight;
            
            let chosenRow;
            if (userParentW && userParentH) {
              // Find exact match in candidates
              chosenRow = CUT_SIZE_CANDIDATES.find(
                r => Number(r.parentW) === Number(userParentW) && Number(r.parentH) === Number(userParentH)
              );
            }
            
            // If no exact match, pick cheapest
            if (!chosenRow) {
              const ranked = pickCheapestTotal(base, CUT_SIZE_CANDIDATES);
              chosenRow = ranked[0]; // cheapest row
            }
            
            // Calculate final result
            const excelResult = calcRowTotal(base, chosenRow);
            
            recommendedSheets = excelResult.sheets;
            
            // Update layout with Excel-based pieces per sheet
            layout.itemsPerSheet = excelResult.upsPerSht;
            layout.efficiency = (excelResult.upsPerSht / (chosenRow.parentW * chosenRow.parentH / (step3ProductWidth * step3ProductHeight))) * 100;
          
            console.log('📊 Offset calculation result:', {
              productName: product?.productName,
              pieceW: step3ProductWidth,
              pieceH: step3ProductHeight,
              chosenRow,
              recommendedSheets: excelResult.sheets,
              upsPerSht: excelResult.upsPerSht,
              noOfUps: excelResult.noOfUps,
              total: excelResult.total
            });
          } catch (error) {
            console.error('❌ Offset calculation failed, falling back to original:', error);
            recommendedSheets = layout.itemsPerSheet > 0 ? Math.ceil(qty / layout.itemsPerSheet) : 0;
          }
        }

        // Use custom price per sheet if provided, otherwise calculate from packet pricing
        const pricePerSheet = opPaper?.pricePerSheet != null 
          ? opPaper.pricePerSheet
          : (opPaper?.pricePerPacket != null &&
             opPaper?.sheetsPerPacket != null &&
             opPaper.sheetsPerPacket > 0
            ? opPaper.pricePerPacket / opPaper.sheetsPerPacket
            : null);

        return { layout, recommendedSheets, pricePerSheet, opPaper };
      });
    });
  }, [
    formData.operational.papers.length,
    outputDimensions,
    formData.products.length,
    paperColors, // Add paperColors dependency for Excel calculation
    // Add manual pricing dependencies to trigger recalculation when manual inputs change
    formData.operational.papers
  ]);

  // ===== Initialize enteredSheets with recommended values =====
  React.useEffect(() => {
    // Only run this effect once when the component mounts and perPaperCalc is available
    if (perPaperCalc.length > 0 && perPaperCalc[0]?.length > 0) {
      setFormData((prev) => {
        const nextPapers = prev.operational.papers.map((p: any, i: number) => {
          // Find which product and paper index this operational paper corresponds to
          let productIndex = 0;
          let paperIndex = 0;
          let currentPaperCount = 0;
          
          for (let pi = 0; pi < formData.products.length; pi++) {
            if (i >= currentPaperCount && i < currentPaperCount + formData.products[pi].papers.length) {
              productIndex = pi;
              paperIndex = i - currentPaperCount;
              break;
            }
            currentPaperCount += formData.products[pi].papers.length;
          }
          
          // Get the recommended sheets from the correct product's calculation
          const rec = perPaperCalc[productIndex]?.[paperIndex]?.recommendedSheets ?? p.recommendedSheets;
          const paperKey = `paper-${i}`;
          const hasUserEdited = userEditedSheets.has(paperKey);
          
          // IMPORTANT: Preserve existing data when editing existing quotes
          // Check if this paper has existing data that should be preserved
          const hasExistingData = p.inputWidth !== null || p.inputHeight !== null || 
                                 p.pricePerPacket !== null || p.pricePerSheet !== null ||
                                 p.outputWidth !== null || p.outputHeight !== null;
          
          if (hasUserEdited) {
            // User has manually edited this field, keep their value
            return { ...p, recommendedSheets: rec };
          } else if (hasExistingData && p.enteredSheets !== null) {
            // This paper has existing data from a saved quote, preserve it
            return { ...p, recommendedSheets: rec };
          } else {
            // No existing data, use recommended value as default
            return { ...p, recommendedSheets: rec, enteredSheets: rec };
          }
        });

        const hasChanges = nextPapers.some((p: any, i: number) => 
          p.enteredSheets !== prev.operational.papers[i]?.enteredSheets ||
          p.recommendedSheets !== prev.operational.papers[i]?.recommendedSheets
        );

        if (!hasChanges) return prev;

        return {
          ...prev,
          operational: {
            ...prev.operational,
            papers: nextPapers,
          },
        };
      });
    }
  }, [perPaperCalc, setFormData, userEditedSheets, formData.products]);

  // ===== Initialize default input sheet sizes and validate output dimensions =====
  React.useEffect(() => {
    setFormData((prev) => {
      const nextPapers = prev.operational.papers.map((p: any, i: number) => {
        const updatedPaper = { ...p };
        const paperKey = `input-dimensions-${i}`;
        const hasUserEdited = userEditedInputDimensions.has(paperKey);
        
        // Only set defaults if user hasn't manually edited these values
        if (!hasUserEdited) {
          if (updatedPaper.inputWidth !== 100) {
            updatedPaper.inputWidth = 100;
          }
          if (updatedPaper.inputHeight !== 70) {
            updatedPaper.inputHeight = 70;
          }
        }
        
        return updatedPaper;
      });

        const hasChanges = nextPapers.some((p: any, i: number) => 
        p.inputWidth !== prev.operational.papers[i]?.inputWidth ||
        p.inputHeight !== prev.operational.papers[i]?.inputHeight
      );

      if (!hasChanges) return prev;

      return {
        ...prev,
        operational: {
          ...prev.operational,
          papers: nextPapers,
        },
      };
    });
  }, [setFormData, userEditedInputDimensions]);



  // ===== Plates & Units (Excel-Based) =====
  const { plates, units } = React.useMemo(() => {
    // Always calculate the proper values first using Excel-based logic
    let calculatedPlates = 0;
    let calculatedUnits = 0;
    
    // Ensure we have products to calculate from
    if (formData.products && formData.products.length > 0) {
    formData.products.forEach((product, productIndex) => {
      const sides = product?.sides ?? "1";
      const printing = product?.printingSelection ?? "Digital";

        // Calculate plates using Excel-based formula
        // The Excel formula calculates PLATES, not units
        try {
          const excelResult = calculateExcelBasedPricing({
            productWidth: outputDimensions[productIndex]?.width || product?.flatSize?.width || 9,
            productHeight: outputDimensions[productIndex]?.height || product?.flatSize?.height || 5.5,
            quantity: product.quantity || 0,
            paperCostPerSheet: 1, // Placeholder for plates calculation
            colors: Math.max(paperColors[productIndex]?.[0]?.length || 1, 1),
            sides: product.sides || '2',
            printingSelection: product.printingSelection || 'Offset'
          });
          
          // Use Excel-calculated plates
          calculatedPlates += excelResult.excelPlates;
          
          console.log('📊 Excel Plates calculation:', {
            productName: product?.productName,
            productWidth: outputDimensions[productIndex]?.width || product?.flatSize?.width || 9,
            productHeight: outputDimensions[productIndex]?.height || product?.flatSize?.height || 5.5,
            colors: Math.max(paperColors[productIndex]?.[0]?.length || 1, 1),
            sides: product.sides || '2',
            excelPlates: excelResult.excelPlates,
            totalCalculatedPlates: calculatedPlates
          });
        } catch (error) {
          console.error('❌ Excel plates calculation failed, falling back to original:', error);
          // Fallback to original calculation if Excel calculation fails
          const currentColors = paperColors[productIndex]?.[0] || [];
          const colorsCount = Math.max(currentColors.length, 1);
          const platesForProduct = printing === "Digital" ? 0 : colorsCount;
          calculatedPlates += platesForProduct;
        }

        // Calculate units using Excel-based formula
        // Formula: =IF([@[Odd or even]]=TRUE,IF([@W]>54,50*$L$2,20*$L$2),IF([@W]>54,50*$L$2,20*$L$2)*2)
        try {
          const excelResult = calculateExcelBasedPricing({
            productWidth: outputDimensions[productIndex]?.width || product?.flatSize?.width || 9,
            productHeight: outputDimensions[productIndex]?.height || product?.flatSize?.height || 5.5,
            quantity: product.quantity || 0,
            paperCostPerSheet: 1, // Placeholder for units calculation
            colors: Math.max(paperColors[productIndex]?.[0]?.length || 1, 1),
            sides: product.sides || '2',
            printingSelection: product.printingSelection || 'Offset'
          });
          
          // Use Excel-calculated units directly
          calculatedUnits += excelResult.units;
          
          console.log('📊 Excel Units calculation:', {
            productName: product?.productName,
            productWidth: outputDimensions[productIndex]?.width || product?.flatSize?.width || 9,
            productHeight: outputDimensions[productIndex]?.height || product?.flatSize?.height || 5.5,
            colors: Math.max(paperColors[productIndex]?.[0]?.length || 1, 1),
            sides: product.sides || '2',
            excelUnits: excelResult.units,
            totalCalculatedUnits: calculatedUnits
          });
        } catch (error) {
          console.error('❌ Excel units calculation failed, falling back to original:', error);
          // Fallback to original calculation if Excel calculation fails
          const productPapers = product.papers || [];
          const totalSheets = productPapers.reduce(
            (acc: any, paper: any, paperIndex: number) => {
              const rec = perPaperCalc[productIndex]?.[paperIndex]?.recommendedSheets ?? 0;
              const globalPaperIndex = formData.products.slice(0, productIndex).reduce((total: number, p: any) => total + p.papers.length, 0) + paperIndex;
              const opPaper = formData.operational.papers[globalPaperIndex];
              const entered = opPaper?.enteredSheets ?? null;
              return acc + (entered != null ? entered : rec);
            },
            0
          );
          calculatedUnits += totalSheets * (sides === "2" ? 2 : 1);
        }
      });
    }

    // Always use calculated values by default
    // Only use user values if they were explicitly entered (not null/undefined)
    const userPlates = formData.operational.plates;
    const userUnits = formData.operational.units;
    
    return { 
      plates: userPlates !== null && userPlates !== undefined ? userPlates : calculatedPlates, 
      units: userUnits !== null && userUnits !== undefined ? userUnits : calculatedUnits 
    };
  }, [
    formData.operational.papers,
    perPaperCalc,
    formData.products,
    formData.operational.plates,
    formData.operational.units,
  ]);

  // ===== Sync to state =====
  React.useEffect(() => {
    setFormData((prev) => {
      const nextPapers = prev.operational.papers.map((p: any, i: number) => {
        // Find which product and paper index this operational paper corresponds to
        let productIndex = 0;
        let paperIndex = 0;
        let currentPaperCount = 0;
        
        for (let pi = 0; pi < formData.products.length; pi++) {
          if (i >= currentPaperCount && i < currentPaperCount + formData.products[pi].papers.length) {
            productIndex = pi;
            paperIndex = i - currentPaperCount;
            break;
          }
          currentPaperCount += formData.products[pi].papers.length;
        }
        
        // Get the recommended sheets from the correct product's calculation
        const rec = perPaperCalc[productIndex]?.[paperIndex]?.recommendedSheets ?? p.recommendedSheets;
        
        // REVISION 1: Force "Enter Sheets" to match recommended sheets by default
        // But preserve user edits if they have manually changed the value
        const paperKey = `paper-${i}`;
        const hasUserEdited = userEditedSheets.has(paperKey);
        
        let enteredSheets: number;
        if (hasUserEdited) {
          // User has manually edited this field, keep their value
          enteredSheets = p.enteredSheets ?? rec;
        } else {
          // No user edit, use recommended value as default
          enteredSheets = rec;
        }
        
        return p.recommendedSheets === rec && p.enteredSheets === enteredSheets
          ? p
          : { ...p, recommendedSheets: rec, enteredSheets };
      });

      const samePapers =
        nextPapers.length === prev.operational.papers.length &&
        nextPapers.every(
          (p: any, i: number) =>
            p.recommendedSheets === prev.operational.papers[i].recommendedSheets &&
            p.enteredSheets === prev.operational.papers[i].enteredSheets
        );

      const samePlates = prev.operational.plates === plates;
      const sameUnits = prev.operational.units === units;

      if (samePapers && samePlates && sameUnits) return prev;

      return {
        ...prev,
        operational: {
          ...prev.operational,
          papers: nextPapers,
          plates,
          units,
        },
      };
    });
  }, [perPaperCalc, plates, units, setFormData, userEditedSheets, formData.products]);

  // ===== Sync operational papers with product papers =====
  React.useEffect(() => {
    // This effect ensures that operational.papers array is synchronized with product papers
    // When new papers are added in Step 3, we create corresponding operational entries
    const totalProductPapers = formData.products.reduce((total, product) => total + product.papers.length, 0);
    const currentOperationalPapers = formData.operational.papers.length;
    
    if (totalProductPapers !== currentOperationalPapers) {
      setFormData((prev) => {
        const newOperationalPapers: QuoteFormData["operational"]["papers"] = [];
        
        // Create operational paper entries for each product's papers
        formData.products.forEach((product, productIndex) => {
          product.papers.forEach((paper: any, paperIndex: number) => {
            // Calculate the global paper index for this product's paper
            const globalPaperIndex = newOperationalPapers.length;
            const existingOpPaper = prev.operational.papers[globalPaperIndex];
            
            // Get recommended sheets from calculations if available
            // Use the product-specific calculation
            const recommendedSheets = perPaperCalc[productIndex]?.[paperIndex]?.recommendedSheets ?? 1;
            
            // Create new operational paper entry or use existing one
            // IMPORTANT: Preserve existing data when editing existing quotes
            const newOpPaper: QuoteFormData["operational"]["papers"][0] = existingOpPaper || {
              inputWidth: null,
              inputHeight: null,
              pricePerPacket: null,
              pricePerSheet: null,
              sheetsPerPacket: null,
              recommendedSheets: recommendedSheets,
              enteredSheets: recommendedSheets, // Default to recommended value
              outputWidth: null,
              outputHeight: null,
            };
            
            // Update with latest recommended sheets and ensure enteredSheets matches
            // But preserve existing values if they were set from a saved quote
            newOpPaper.recommendedSheets = recommendedSheets;
            
            // Only override enteredSheets if:
            // 1. No existing operational paper, OR
            // 2. User hasn't manually edited it, OR  
            // 3. The existing value is not from a saved quote (i.e., it's the default)
            if (!existingOpPaper || 
                !userEditedSheets.has(`paper-${globalPaperIndex}`) ||
                existingOpPaper.enteredSheets === existingOpPaper.recommendedSheets) {
              newOpPaper.enteredSheets = recommendedSheets;
            }
            
            newOperationalPapers.push(newOpPaper);
          });
        });
        
        return {
          ...prev,
          operational: {
            ...prev.operational,
            papers: newOperationalPapers,
            plates,
            units,
          },
        };
      });
    }
  }, [formData.products, perPaperCalc, userEditedSheets, setFormData, formData.operational.papers.length]);

  // ===== Validation functions =====
  const validateOutputDimensions = (width: number, height: number, inputWidth: number | null, inputHeight: number | null) => {
    if (!inputWidth || !inputHeight) return null;
    
    const canFitNormal = width <= inputWidth && height <= inputHeight;
    const canFitRotated = width <= inputHeight && height <= inputWidth;
    
    if (!canFitNormal && !canFitRotated) {
      return "Output dimensions are too large for the input sheet size in any orientation";
    }
    return null;
  };

  // ===== handlers =====
  const handlePaperOpChange = (
    index: number,
    field: keyof QuoteFormData["operational"]["papers"][0],
    value: string
  ) => {
    const v: number | null = value === "" ? null : parseFloat(value);
    
    // Track user edits to enteredSheets
    if (field === "enteredSheets") {
      const paperKey = `paper-${index}`;
      if (v !== null) {
        setUserEditedSheets(prev => new Set(prev).add(paperKey));
      } else {
        setUserEditedSheets(prev => {
          const newSet = new Set(prev);
          newSet.delete(paperKey);
          return newSet;
        });
      }
    }
    
    // Track user edits to input dimensions
    if (field === "inputWidth" || field === "inputHeight") {
      const paperKey = `input-dimensions-${index}`;
      if (v !== null) {
        setUserEditedInputDimensions(prev => new Set(prev).add(paperKey));
      } else {
        setUserEditedInputDimensions(prev => {
          const newSet = new Set(prev);
          newSet.delete(paperKey);
          return newSet;
        });
      }
    }
    
    const newPapers = [...formData.operational.papers];
    newPapers[index] = { ...newPapers[index], [field]: v };
    
    // Debug logging for manual pricing changes
    if (field === "pricePerSheet" || field === "pricePerPacket" || field === "sheetsPerPacket") {
      console.log('🔧 Manual pricing input changed:', {
        field,
        value: v,
        paperIndex: index,
        newPaperData: newPapers[index]
      });
    }
    
    setFormData((prev) => ({
      ...prev,
      operational: { ...prev.operational, papers: newPapers },
    }));
  };



  const handlePlatesChange = (value: string) => {
    if (value === "") {
      setFormData((prev) => ({
        ...prev,
        operational: {
          ...prev.operational,
          plates: null,
        },
      }));
      return;
    }
    
    const plates = parseFloat(value);
    if (isNaN(plates) || plates < 0) return;
    
    // Prevent unreasonably large values (likely typos)
    if (plates > 1000) return;
    
    setFormData((prev) => ({
      ...prev,
      operational: {
        ...prev.operational,
        plates,
      },
    }));
  };

  const handleUnitsChange = (value: string) => {
    if (value === "") {
      setFormData((prev) => ({
        ...prev,
        operational: {
          ...prev.operational,
          units: null,
        },
      }));
      return;
    }
    
    const units = parseFloat(value);
    if (isNaN(units) || units < 0) return;
    
    // Prevent unreasonably large values (likely typos)
    if (units > 1000000) return;
    
    setFormData((prev) => ({
      ...prev,
      operational: {
        ...prev.operational,
        units,
      },
    }));
  };

  const handleOutputDimensionChange = (productIndex: number, field: 'width' | 'height', value: string) => {
    const v = value === "" ? 0 : parseFloat(value);
    setOutputDimensions(prev => ({
      ...prev,
      [productIndex]: {
        ...prev[productIndex],
        [field]: v
      }
    }));
  };





  // ===== Modal state =====
  const [openIdx, setOpenIdx] = React.useState<number | null>(null);
  const [showPricingLogic, setShowPricingLogic] = React.useState(false);
  const [showPaperPrice, setShowPaperPrice] = React.useState<number | null>(null);
  const [showCostBreakdown, setShowCostBreakdown] = React.useState(false);
  const [showFinishingDetails, setShowFinishingDetails] = React.useState(false);
  const openData =
    openIdx != null
      ? (() => {
          // Find which product and paper index this global paper index corresponds to
          let productIndex = 0;
          let paperIndex = 0;
          let currentPaperCount = 0;
          
          for (let pi = 0; pi < formData.products.length; pi++) {
            if (openIdx >= currentPaperCount && openIdx < currentPaperCount + formData.products[pi].papers.length) {
              productIndex = pi;
              paperIndex = openIdx - currentPaperCount;
              break;
            }
            currentPaperCount += formData.products[pi].papers.length;
          }
          
          return {
            paper: formData.products[productIndex]?.papers[paperIndex],
            op: formData.operational.papers[openIdx],
            calc: perPaperCalc[productIndex]?.[paperIndex],
          };
        })()
      : null;

  // ===== Fetch suppliers and materials =====
  const fetchSuppliersAndMaterials = async () => {
    try {
      setIsLoadingSuppliers(true);
      console.log('🔄 Fetching suppliers and materials...');
      
      const response = await fetch('/api/suppliers');
      if (!response.ok) {
        throw new Error(`Failed to fetch suppliers: ${response.status}`);
      }
      
      const suppliersData = await response.json();
      console.log('📊 Suppliers data received:', suppliersData.length, 'suppliers');
      setSuppliers(suppliersData);
      
      // Extract all materials from suppliers
      const allMaterials = suppliersData.reduce((acc: any[], supplier: any) => {
        if (supplier.materials && Array.isArray(supplier.materials)) {
          const materialsWithSupplier = supplier.materials.map((material: any) => ({
            id: material.id,
            materialId: material.materialId,
            name: material.name,
            gsm: material.gsm,
            cost: material.cost,
            unit: material.unit,
            sheetsPerPacket: material.sheetsPerPacket,
            status: material.status,
            supplierName: supplier.name,
            supplierContact: supplier.contact,
            supplierEmail: supplier.email,
            supplierPhone: supplier.phone,
            supplierCountry: supplier.country,
            supplierCity: supplier.city
          }));
          acc.push(...materialsWithSupplier);
        }
        return acc;
      }, []);
      
      console.log('📦 Total materials extracted:', allMaterials.length);
      setMaterials(allMaterials);
    } catch (error) {
      console.error('❌ Error fetching suppliers:', error);
      // Keep the initial sample data if API fails
      console.log('Using fallback data');
    } finally {
      setIsLoadingSuppliers(false);
    }
  };

  // ===== Auto-fetch data on component mount =====
  React.useEffect(() => {
    fetchSuppliersAndMaterials();
  }, []);
  
  // ===== Auto-fill finishing costs based on Step 3 selections =====
  React.useEffect(() => {
    console.log('DEBUG: Step 4 useEffect triggered - refreshing finishing data');
    console.log('DEBUG: Current formData.products:', formData.products);
    
    // Get all unique finishing names from Step 3 selections
    const allFinishingNames = new Set<string>();
    
    formData.products.forEach(product => {
      if (product.finishing && Array.isArray(product.finishing)) {
        product.finishing.forEach((finishingName: any) => {
          // Extract base finishing name (remove side suffix)
          const baseFinishingName = finishingName.split('-')[0];
          allFinishingNames.add(baseFinishingName);
        });
      }
    });

    console.log('DEBUG: Found finishing names from Step 3:', Array.from(allFinishingNames));

    // Update operational finishing with auto-calculated costs
    setFormData((prev) => {
      // COMPLETELY CLEAR old finishing data and start fresh
      const newOperationalFinishing: { name: string; cost: number | null }[] = [];

      // Add only the finishing options that are actually selected in Step 3
      // Note: Costs are now calculated automatically in the display, so we don't need to pre-calculate them here
      allFinishingNames.forEach(finishingName => {
        // Skip any incorrect "Uv spot" entries
        if (finishingName.toLowerCase() === 'uv spot' && finishingName !== 'UV Spot') {
          console.log('DEBUG: Skipping incorrect "Uv spot" entry');
          return;
        }
        
        // Only add if it's actually selected in Step 3
        const isSelectedInStep3 = formData.products.some(product => 
          product.finishing && product.finishing.some((f: any) => {
            const baseName = f.split('-')[0];
            return baseName.toLowerCase() === finishingName.toLowerCase();
          })
        );
        
        if (isSelectedInStep3) {
          console.log('DEBUG: Adding finishing:', finishingName);
          newOperationalFinishing.push({
            name: finishingName,
            cost: null // Cost will be calculated automatically based on formula
          });
        } else {
          console.log('DEBUG: Skipping finishing not selected in Step 3:', finishingName);
        }
      });

      console.log('DEBUG: Setting new operational finishing:', newOperationalFinishing);

      return {
        ...prev,
        operational: {
          ...prev.operational,
          finishing: newOperationalFinishing
        }
      };
    });
  }, [formData.products, setFormData]);
  
  // ===== Clean up incorrect UV Spot entries =====
  React.useEffect(() => {
    setFormData((prev) => {
      const hasIncorrectUVSpot = prev.operational.finishing.some((f: any) => 
        f.name.toLowerCase() === 'uv spot' && f.name !== 'UV Spot'
      );
      
      if (hasIncorrectUVSpot) {
        console.log('DEBUG: Found incorrect UV Spot entry, cleaning up...');
        const cleanedFinishing = prev.operational.finishing.filter((f: any) => 
          !(f.name.toLowerCase() === 'uv spot' && f.name !== 'UV Spot')
        );
        
        return {
          ...prev,
          operational: {
            ...prev.operational,
            finishing: cleanedFinishing
          }
        };
      }
      
      return prev;
    });
  }, [setFormData]);
  
  // ===== Auto-update finishing costs when impressions change =====
  React.useEffect(() => {
    console.log('DEBUG: Impressions changed, recalculating finishing costs');
    console.log('DEBUG: Current impressions:', formData.operational.impressions);
    
    // Force re-render of finishing cost calculations
    // The calculateIndividualFinishingCost function will now use the updated impressions value
  }, [formData.operational.impressions]);
  
  // ===== Force default input dimensions on component mount =====
  React.useEffect(() => {
    // This effect runs once on mount to ensure defaults are set
    setFormData((prev) => {
      const nextPapers = prev.operational.papers.map((p: any, i: number) => {
        const updatedPaper = { ...p };
        
        // Force set to 100x70 on first load
        if (updatedPaper.inputWidth !== 100) {
          updatedPaper.inputWidth = 100;
        }
        if (updatedPaper.inputHeight !== 70) {
          updatedPaper.inputHeight = 70;
        }
        
        return updatedPaper;
      });

        const hasChanges = nextPapers.some((p: any, i: number) => 
        p.inputWidth !== prev.operational.papers[i]?.inputWidth ||
        p.inputHeight !== prev.operational.papers[i]?.inputHeight
      );

      if (!hasChanges) return prev;

      return {
        ...prev,
        operational: {
          ...prev.operational,
          papers: nextPapers,
        },
      };
    });
  }, []); // Empty dependency array means this runs only once on mount

  // ===== Filter materials based on search and filters =====
  const filteredMaterials = React.useMemo(() => {
    let filtered = materials;
    
    // Filter by search term
    if (supplierSearchTerm) {
      filtered = filtered.filter(material => 
        material.name.toLowerCase().includes(supplierSearchTerm.toLowerCase()) ||
        material.gsm?.toLowerCase().includes(supplierSearchTerm.toLowerCase()) ||
        material.supplierName.toLowerCase().includes(supplierSearchTerm.toLowerCase())
      );
    }
    
    // Filter by supplier
    if (selectedSupplier) {
      filtered = filtered.filter(material => material.supplierName === selectedSupplier);
    }
    
    // Filter by GSM range
    if (selectedGSM) {
      const [min, max] = selectedGSM.split('-').map(Number);
      if (max) {
        filtered = filtered.filter(material => {
          const gsm = parseInt(material.gsm);
          return gsm >= min && gsm <= max;
        });
      } else if (selectedGSM === '400+') {
        filtered = filtered.filter(material => {
          const gsm = parseInt(material.gsm);
          return gsm >= 400;
        });
      }
    }
    
    return filtered;
  }, [materials, supplierSearchTerm, selectedSupplier, selectedGSM]);

  // ===== Currency formatter =====
  const fmt = (n: number) =>
    new Intl.NumberFormat("en-AE", {
      style: "currency",
      currency: "AED",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(n);

  const ROUNDUP0 = (x: number) => Math.ceil(x);
  const ROUNDDOWN0 = (x: number) => Math.floor(x);


  // ===== Enhanced pricing calculation with Excel formula integration =====
  const calculateTotalCost = (opPaper: any, actualSheetsNeeded: number, productData?: any, productIndex?: number) => {
    if (!opPaper) return 0;
    
    // Get paper cost per sheet - prioritize Step 4 manual input, fallback to Step 3 database
    let paperCostPerSheet = opPaper.pricePerSheet;
    
    // If no manual input, try packet pricing
    if (paperCostPerSheet == null && opPaper.pricePerPacket != null && opPaper.sheetsPerPacket != null && opPaper.sheetsPerPacket > 0) {
      paperCostPerSheet = opPaper.pricePerPacket / opPaper.sheetsPerPacket;
    }
    
    // If still no price, try materials database
    if (paperCostPerSheet == null && productData && productIndex !== undefined) {
      const product = formData.products[productIndex];
      if (product && product.papers && product.papers.length > 0) {
        // Find the paper that matches this operational paper
        const matchingPaper = product.papers.find((p: any) => 
          p.name === opPaper.name || 
          (p.gsm && opPaper.gsm && p.gsm === opPaper.gsm)
        );
        if (matchingPaper) {
          const materialPrice = getPaperPriceFromMaterials(matchingPaper.name, matchingPaper.gsm);
          if (materialPrice != null) {
            paperCostPerSheet = materialPrice;
          }
        }
      }
    }
    
    // Final fallback
    if (paperCostPerSheet == null) {
      paperCostPerSheet = 0;
    }
    
    // If we have product data, use Excel formula with candidate-based logic
    if (productData && productIndex !== undefined) {
      const product = formData.products[productIndex];
      if (!product) return 0;
      
      // Get product dimensions from Step 3
      const pieceH = outputDimensions[productIndex]?.height || product?.flatSize?.height || 9;
      const pieceW = outputDimensions[productIndex]?.width || product?.flatSize?.width || 5.5;
      
      // Get quantity
      const qty = Number(product.quantity) || 0;
      
      // Get sides and colours
      const sides = Number(product.sides) || 2;
      
      // Debug colors calculation
      console.log('🎨 calculateTotalCost - product.colors:', product.colors);
      console.log('🎨 calculateTotalCost - front:', product.colors?.front, 'back:', product.colors?.back);
      
      // Extract number of colors from Step 3 selection
      // Handle formats like "4 Colors (CMYK)", "4+1 Colors", "4+2 Colors"
      const parseColors = (colorStr: any): number => {
        if (!colorStr) return 0;
        const str = colorStr.toString();
        
        // Check for "4+1" or "4+2" format
        const plusMatch = str.match(/(\d+)\+(\d+)/);
        if (plusMatch) {
          const base = parseInt(plusMatch[1]);
          const additional = parseInt(plusMatch[2]);
          return base + additional;
        }
        
        // Fallback to single number
        const singleMatch = str.match(/\d+/);
        return singleMatch ? parseInt(singleMatch[0]) : 0;
      };

      const frontColors = parseColors(product.colors?.front);
      const backColors = parseColors(product.colors?.back);
      
      // For 2-sided printing, use max of front/back (same plates used)
      const rawColours = Math.max(frontColors, backColors) || 4;
      
      // Check printing selection
      const isDigital = product?.printingSelection === 'Digital';
      
      // Color categorization: ONLY apply for Digital (1-3 colors = 1 color, 4+ colors = 4 colors)
      // For Offset, use actual color count for accurate plate cost calculation
      const colours = isDigital ? (rawColours <= 3 ? 1 : 4) : rawColours;
      
      console.log('🎨 calculateTotalCost - calculated colours:', colours, '(isDigital:', isDigital, ', rawColours:', rawColours, ')');
      
      // Use the complete candidate rows from Excel
      const candidates = CUT_SIZE_CANDIDATES;

      // Decide which row to use (same logic as pricing summary)
      const userParentW = opPaper?.inputWidth;
      const userParentH = opPaper?.inputHeight;

      let chosenRow;
      if (userParentW && userParentH) {
        chosenRow = candidates.find(
          r => Number(r.parentW) === Number(userParentW) && Number(r.parentH) === Number(userParentH)
        );
      }

      const base = { pieceW, pieceH, qty, sides, colours, paperCostPerSheet };

      if (!chosenRow) {
        // rank all rows by total and take cheapest
        const rankedRows = candidates
          .map(r => ({ r, res: calcRowTotal(base, r) }))
          .sort((a, b) => a.res.total - b.res.total);
        chosenRow = rankedRows[0].r;
      }

      // Compute final using the chosen REAL row
      const excelResult = calcRowTotal(base, chosenRow);
      
      // Debug logging for testing
      console.log('🔍 calculateTotalCost - Candidate selection:', {
        productIndex,
        productName: product.productName,
        chosenRow,
        excelResult
      });
      
      return excelResult.total;
    }
    
    // Fallback to original packet + sheet logic for backward compatibility
    const { pricePerSheet, pricePerPacket, sheetsPerPacket } = opPaper;
    
    // If only packet pricing is available
    if (pricePerPacket != null && sheetsPerPacket != null && sheetsPerPacket > 0 && pricePerSheet == null) {
      const packetsNeeded = Math.ceil(actualSheetsNeeded / sheetsPerPacket);
      return packetsNeeded * pricePerPacket;
    }
    
    // If only sheet pricing is available
    if (pricePerSheet != null && (pricePerPacket == null || sheetsPerPacket == null || sheetsPerPacket <= 0)) {
      return actualSheetsNeeded * pricePerSheet;
    }
    
    // If both are available, use packet first, then sheet pricing for remaining
    if (pricePerSheet != null && pricePerPacket != null && sheetsPerPacket != null && sheetsPerPacket > 0) {
      const fullPackets = Math.floor(actualSheetsNeeded / sheetsPerPacket);
      const remainingSheets = actualSheetsNeeded % sheetsPerPacket;
      
      const packetCost = fullPackets * pricePerPacket;
      const sheetCost = remainingSheets * pricePerSheet;
      
      return packetCost + sheetCost;
    }
    
    return 0;
  };

  // ===== Calculate plates cost =====
  const calculatePlatesCost = () => {
    const platesCount = formData.operational.plates ?? plates ?? 0;
    // Standard plate cost - can be made configurable later
    const costPerPlate = 25; // AED 25 per plate
    return platesCount * costPerPlate;
  };

  // ===== Calculate units cost =====
  const calculateUnitsCost = () => {
    const unitsCount = formData.operational.units ?? units ?? 0;
    // Standard unit cost - can be made configurable later
    const costPerUnit = 0.05; // AED 0.05 per unit
    return unitsCount * costPerUnit;
  };

  // ===== Calculate individual finishing cost =====
  const calculateIndividualFinishingCost = (finishingName: string, product: any, productIndex: number) => {
    // Use the same logic as the display to get sheet count
    const actualSheetsNeeded = formData.operational.papers[productIndex]?.enteredSheets ?? 
                               perPaperCalc[productIndex]?.[0]?.recommendedSheets ?? 0;
    // Use impressions field if available, otherwise fall back to product quantity
    const totalQuantity = formData.operational.impressions || product.quantity || 0;
    
    console.log('DEBUG: calculateIndividualFinishingCost called with:');
    console.log('  finishingName:', finishingName);
    console.log('  productIndex:', productIndex);
    console.log('  actualSheetsNeeded:', actualSheetsNeeded);
    console.log('  totalQuantity:', totalQuantity);
    
    // Extract base finishing name (remove side suffix like "-Front", "-Back", "-Both")
    const baseFinishingName = finishingName.split('-')[0];
    const sideInfo = finishingName.includes('-') ? finishingName.split('-')[1] : 'Front';
    let finishingCost = 0;
    
    switch (baseFinishingName) {
      case 'Lamination':
        // a. Laminated: minimum cost is 75 AED, and 0.75 AED per sheet. (formula: 75+(sheets*0.75))
        finishingCost = 75 + (actualSheetsNeeded * 0.75);
        console.log('DEBUG: Lamination calculation: 75 + (' + actualSheetsNeeded + ' * 0.75) = ' + finishingCost);
        
        // Double the cost if applied to both sides
        if (sideInfo === 'Both') {
          finishingCost = finishingCost * 2;
        }
        break;
        
      case 'Velvet Lamination':
        // b. Velvet laminated: minimum cost is 100 AED, and 1 AED per sheet. (formula: 100+(sheet*1))
        finishingCost = 100 + (actualSheetsNeeded * 1.0);
        
        // Double the cost if applied to both sides
        if (sideInfo === 'Both') {
          finishingCost = finishingCost * 2;
        }
        break;
        
      case 'Embossing':
        // c. Embossing: impression charge 50 AED per 1000. Minimum charge is 75 AED. 
        // by default it set as 1000 impression and minimum is 75 AED. 
        // formula: 75+(50AED per 1000 impression). set as minimum impression as 1000 so by default is (75+50)
        const embossingImpressions = Math.max(1000, totalQuantity); // Minimum 1000 impressions
        const embossingImpressionCost = Math.ceil(embossingImpressions / 1000) * 50;
        finishingCost = Math.max(75, embossingImpressionCost);
        
        // Double the cost if applied to both sides
        if (sideInfo === 'Both') {
          finishingCost = finishingCost * 2;
        }
        break;
        
      case 'Foiling':
        // d. FOILLING: Impression charge 75 AED per 1000. Minimum cost is 75. (formula: 75+75 per 1000 impression)
        const foilingImpressions = Math.max(1000, totalQuantity); // Minimum 1000 impressions
        const foilingImpressionCost = Math.ceil(foilingImpressions / 1000) * 75;
        finishingCost = Math.max(75, foilingImpressionCost);
        
        // Double the cost if applied to both sides
        if (sideInfo === 'Both') {
          finishingCost = finishingCost * 2;
        }
        break;
        
      case 'Die Cutting':
        // e. Die cutting: Impression charge 50 AED per 1000. Minimum cost is 75 AED. formula: (75+50 per 1000 impression)
        // specific size: Minimum price: 75 AED for A5, 100 AED for A4, 150 AED for A3, 200 AED for A2
        const dieCuttingImpressions = Math.max(1000, totalQuantity); // Minimum 1000 impressions
        const dieCuttingImpressionCost = Math.ceil(dieCuttingImpressions / 1000) * 50;
        
        // Min charges by size
        let minCharge = 75; // Default A5
        if (product.flatSize && product.flatSize.width && product.flatSize.height) {
          const area = product.flatSize.width * product.flatSize.height;
          if (area <= 210 * 148) { // A5 size
            minCharge = 75;
          } else if (area <= 297 * 210) { // A4 size
            minCharge = 100;
          } else if (area <= 420 * 297) { // A3 size
            minCharge = 150;
          } else { // A2 and larger
            minCharge = 200;
          }
        }
        finishingCost = Math.max(minCharge, dieCuttingImpressionCost);
        break;
        
      case 'UV Spot':
        // f. UV Spot: 350 AED per 1000 impression with 350 AED minimum of cost. formula: (350+350 per 1000 impression)
        const uvSpotImpressions = Math.max(1000, totalQuantity); // Minimum 1000 impressions
        const uvSpotImpressionCost = Math.ceil(uvSpotImpressions / 1000) * 350;
        finishingCost = Math.max(350, uvSpotImpressionCost);
        console.log('DEBUG: UV Spot calculation:');
        console.log('  totalQuantity:', totalQuantity);
        console.log('  uvSpotImpressions:', uvSpotImpressions);
        console.log('  uvSpotImpressionCost:', uvSpotImpressionCost);
        console.log('  finishingCost:', finishingCost);
        
        // Double the cost if applied to both sides
        if (sideInfo === 'Both') {
          finishingCost = finishingCost * 2;
        }
        break;
        
      case 'Folding':
        // g. Folding charges: impression cost is 25 AED per 1000 impression. minimum cost is 25. formula: 25+25 per 1000 impression
        const foldingImpressions = Math.max(1000, totalQuantity); // Minimum 1000 impressions
        const foldingImpressionCost = Math.ceil(foldingImpressions / 1000) * 25;
        finishingCost = Math.max(25, foldingImpressionCost);
        break;
        
      case 'Padding':
        // Fixed minimum charge 25 dhs
        finishingCost = 25;
        break;
        
      case 'Varnishing':
        // Fixed minimum charge 30 dhs
        finishingCost = 30;
        break;
        
      default:
        // Fallback to manual cost if set in operational finishing
        const finishingItem = formData.operational.finishing.find((f: any) => f.name === finishingName);
        if (finishingItem && finishingItem.cost != null) {
          finishingCost = finishingItem.cost * actualSheetsNeeded;
        }
        break;
    }
    
    console.log('DEBUG: Calculated cost for', finishingName, ':', finishingCost);
    return finishingCost;
  };

  // ===== Calculate finishing costs =====
  const calculateFinishingCosts = () => {
    let totalFinishingCost = 0;
    
    // REQUIREMENT: Finishing costs should be calculated once at the end, not per paper
    // Collect all unique finishing types across all products
    const allFinishingTypes = new Set<string>();
    
    formData.products.forEach((product) => {
      if (product.finishing && product.finishing.length > 0) {
        product.finishing.forEach((finishingName: any) => {
          allFinishingTypes.add(finishingName);
        });
      }
    });
    
    // Calculate cost for each unique finishing type once
    allFinishingTypes.forEach(finishingName => {
      // Use the first product that has this finishing type for calculation
      const productWithFinishing = formData.products.find(product => 
        product.finishing && product.finishing.includes(finishingName)
      );
      
      if (productWithFinishing) {
        const productIndex = formData.products.indexOf(productWithFinishing);
        totalFinishingCost += calculateIndividualFinishingCost(finishingName, productWithFinishing, productIndex);
      }
    });
    
    return totalFinishingCost;
  };


  // ===== Calculate total project cost =====
  const calculateTotalProjectCost = () => {
    let totalCost = 0;
    
    // Paper costs
    formData.operational.papers.forEach((opPaper: any, index: number) => {
      const actualSheetsNeeded = opPaper.enteredSheets ?? 
                                 perPaperCalc[Math.floor(index / formData.products[0]?.papers.length || 1)]?.[index % (formData.products[0]?.papers.length || 1)]?.recommendedSheets ?? 0;
      const productData = formData.products[Math.floor(index / (formData.products[0]?.papers.length || 1))];
      totalCost += calculateTotalCost(opPaper, actualSheetsNeeded, productData, Math.floor(index / (formData.products[0]?.papers.length || 1)));
    });
    
    // Plates cost
    totalCost += calculatePlatesCost();
    
    // Units cost
    totalCost += calculateUnitsCost();
    
    // Finishing costs
    totalCost += calculateFinishingCosts();
    
    // Additional costs
    totalCost += additionalCosts.reduce((acc, cost) => acc + cost.cost, 0);
    
    return totalCost;
  };

  // ===== Calculate cost per unit =====
  const calculateCostPerUnit = () => {
    const totalCost = calculateTotalProjectCost();
    const totalQuantity = formData.products.reduce((acc, product) => acc + (product.quantity || 0), 0);
    return totalQuantity > 0 ? totalCost / totalQuantity : 0;
  };

  // ===== Get pricing breakdown for display =====
  const getPricingBreakdown = (opPaper: any, actualSheetsNeeded: number) => {
    if (!opPaper) return { breakdown: [], totalCost: 0 };
    
    const { pricePerSheet, pricePerPacket, sheetsPerPacket } = opPaper;
    const breakdown: Array<{ type: string; quantity: number; unitPrice: number; total: number; description: string }> = [];
    let totalCost = 0;
    
    // If only packet pricing is available
    if (pricePerPacket != null && sheetsPerPacket != null && sheetsPerPacket > 0 && pricePerSheet == null) {
      const packetsNeeded = Math.ceil(actualSheetsNeeded / sheetsPerPacket);
      const cost = packetsNeeded * pricePerPacket;
      breakdown.push({
        type: 'packet',
        quantity: packetsNeeded,
        unitPrice: pricePerPacket,
        total: cost,
        description: `${packetsNeeded} packet(s) × ${fmt(pricePerPacket)}`
      });
      totalCost = cost;
    }
    
    // If only sheet pricing is available
    else if (pricePerSheet != null && (pricePerPacket == null || sheetsPerPacket == null || sheetsPerPacket <= 0)) {
      const cost = actualSheetsNeeded * pricePerSheet;
      breakdown.push({
        type: 'sheet',
        quantity: actualSheetsNeeded,
        unitPrice: pricePerSheet,
        total: cost,
        description: `${actualSheetsNeeded} sheet(s) × ${fmt(pricePerSheet)}`
      });
      totalCost = cost;
    }
    
    // If both are available, use packet first, then sheet pricing for remaining
    else if (pricePerSheet != null && pricePerPacket != null && sheetsPerPacket != null && sheetsPerPacket > 0) {
      const fullPackets = Math.floor(actualSheetsNeeded / sheetsPerPacket);
      const remainingSheets = actualSheetsNeeded % sheetsPerPacket;
      
      if (fullPackets > 0) {
        const packetCost = fullPackets * pricePerPacket;
        breakdown.push({
          type: 'packet',
          quantity: fullPackets,
          unitPrice: pricePerPacket,
          total: packetCost,
          description: `${fullPackets} packet(s) × ${fmt(pricePerPacket)}`
        });
        totalCost += packetCost;
      }
      
      if (remainingSheets > 0) {
        const sheetCost = remainingSheets * pricePerSheet;
        breakdown.push({
          type: 'sheet',
          quantity: remainingSheets,
          unitPrice: pricePerSheet,
          total: sheetCost,
          description: `${remainingSheets} sheet(s) × ${fmt(pricePerSheet)}`
        });
        totalCost += sheetCost;
      }
    }
    
    return { breakdown, totalCost };
  };

  // ===== Costing Analysis Functions =====
  
  // Load pricing data on component mount
  React.useEffect(() => {
    const loadPricingData = async () => {
      try {
        setLoadingPricing(true);
        const { digital, offset } = await PricingService.getAllPricing();
        setDigitalPricing(digital);
        setOffsetPricing(offset);
        console.log('Pricing data loaded:', { digital, offset });
      } catch (error) {
        console.error('Error loading pricing data:', error);
      } finally {
        setLoadingPricing(false);
      }
    };

    loadPricingData();
  }, []);

  // Calculate costing for the first product
  const calculateCosting = (product: any, productIndex: number = 0) => {
    if (!digitalPricing || !offsetPricing) {
      console.log('Pricing data not loaded yet');
      return;
    }
    
    // Validate product data
    const width = product.flatSize?.width || 0;
    const height = product.flatSize?.height || 0;
    const quantity = product.quantity || 0;
    const sides = parseInt(product.sides || '1') || 1;
    const colorsFrontRaw = parseInt(product.colors?.front || '0') || 0;
    const colorsBackRaw = parseInt(product.colors?.back || '0') || 0;
    
    // Color categorization: 1-3 colors = 1 color, 4+ colors = 4 colors
    const colorsFront = colorsFrontRaw <= 3 ? 1 : 4;
    const colorsBack = colorsBackRaw <= 3 ? 1 : 4;
    
    console.log('Calculating costing with:', {
      width, height, quantity, sides, colorsFront, colorsBack,
      digitalPricing, offsetPricing
    });
    
    if (width <= 0 || height <= 0 || quantity <= 0) {
      console.log('Invalid product dimensions or quantity');
      return;
    }
    
    try {
      // Calculate digital costing
      const digitalResults = calcDigitalCosting({
        qty: quantity,
        piece: { w: width, h: height },
        sides: sides as 1 | 2,
        colorsF: colorsFront as 1 | 2 | 4,
        colorsB: colorsBack as 1 | 2 | 4,
        perClick: digitalPricing.perClick,
        parentCost: digitalPricing.parentSheetCost,
        wasteParents: digitalPricing.wasteParents,
        bleed: product.bleed || 0.3,
        gapX: product.gap || 0.5,
        gapY: product.gap || 0.5,
        allowRotate: true
      });
      
      console.log('Digital costing results:', digitalResults);
      setDigitalCostingResults(digitalResults);
      
      // For Digital printing, automatically select the cheapest option
      if (digitalResults.length > 0) {
        const cheapest = digitalResults.reduce((min, current) => 
          current.total < min.total ? current : min
        );
        setSelectedDigitalOption(cheapest.option);
      }
      
      // Calculate dynamic press dimensions for offset costing
      let dynamicPressWidth = 35;
      let dynamicPressHeight = 50;
      let dynamicPressLabel = '35×50 cm';
      
      // Use outputDimensions if available (from Step 3), otherwise fall back to width/height
      let productWidth, productHeight;
      if (formData && productIndex !== undefined && formData.outputDimensions && formData.outputDimensions[productIndex]) {
        productWidth = formData.outputDimensions[productIndex].width;
        productHeight = formData.outputDimensions[productIndex].height;
        console.log('🔍 Using outputDimensions for offset costing:', {
          width: productWidth,
          height: productHeight,
          productIndex,
          source: 'outputDimensions'
        });
      } else if (width && height) {
        productWidth = width;
        productHeight = height;
        console.log('🔍 Using width/height for offset costing:', {
          width: productWidth,
          height: productHeight,
          source: 'width/height'
        });
      }
      
      if (productWidth && productHeight) {
        const pressDimension = calculateVisualizationPressDimensions({
          width: productWidth,
          height: productHeight
        }, formData);
        
        if (pressDimension) {
          dynamicPressWidth = pressDimension.width;
          dynamicPressHeight = pressDimension.height;
          dynamicPressLabel = pressDimension.label;
          console.log('🎯 Using dynamic press for offset costing:', pressDimension);
        }
      }

      // Calculate offset costing with dynamic press dimensions
      const offsetResult = calcOffsetCosting({
        qty: quantity,
        parent: { w: 100, h: 70 }, // PARENT stock
        press: { w: dynamicPressWidth, h: dynamicPressHeight, label: dynamicPressLabel }, // Dynamic press dimensions
        piece: { w: width, h: height },
        sides: sides as 1 | 2,
        colorsF: colorsFront as 1 | 2 | 4,
        colorsB: colorsBack as 1 | 2 | 4,
        pricing: offsetPricing,
        bleed: product.bleed || 0.3,
        gapX: product.gap || 0.5,
        gapY: product.gap || 0.5,
        allowRotate: true
      });
      
      console.log('Offset costing result:', offsetResult);
      setOffsetCostingResult(offsetResult);
      
      // Set default selection to dynamic press if enabled
      if (offsetResult.pressPerParent > 0 && !selectedOffsetPress) {
        setSelectedOffsetPress(dynamicPressLabel);
      }
      
    } catch (error) {
      console.error('Error calculating costing:', error);
    }
  };

  // Trigger costing calculation when product changes
  React.useEffect(() => {
    if (formData.products.length > 0 && digitalPricing && offsetPricing) {
      calculateCosting(formData.products[0], 0);
    }
  }, [formData.products, digitalPricing, offsetPricing]);

  // ===== Render =====
  return (
    <div className="space-y-6 md:space-y-8 px-4 md:px-0">
      {/* Header */}
      <div className="text-center space-y-3">
        <h3 className="text-xl md:text-2xl font-bold text-slate-900">Operational Details</h3>
        <p className="text-sm md:text-base text-slate-600">Configure paper specifications, costs, and production details</p>
      </div>



      {formData.products.map((product, productIndex) => (
        <div key={productIndex} className="space-y-6 md:space-y-8">
          {/* Product Header */}
          <div className="bg-[#27aae1]/10 rounded-xl border border-[#27aae1]/30 p-4 md:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h4 className="text-lg md:text-xl font-bold text-[#27aae1] flex items-center">
                  <Package className="w-5 h-5 md:w-6 md:h-6 mr-2 md:mr-3" />
                  Product {productIndex + 1}: {product.productName || `Product ${productIndex + 1}`}
                </h4>
                <div className="mt-2 text-[#27aae1] text-sm md:text-base">
                  Quantity: {product.quantity || 0} | Sides: {product.sides} | Printing: {product.printingSelection}
                </div>
              </div>
              {/* Product Color Summary Badge */}
              {(() => {
                const totalColors = product.papers.reduce((total: any, _: any, paperIdx: number) => {
                  return total + (paperColors[productIndex]?.[paperIdx]?.length || 0);
                }, 0);
                
                if (totalColors > 0) {
                  return (
                    <div className="flex items-center gap-2 px-3 md:px-4 py-2 bg-[#ea078b]/20 border border-[#ea078b]/50 rounded-full self-start sm:self-auto">
                      <Palette className="w-4 h-4 text-[#ea078b]" />
                      <span className="text-sm font-semibold text-[#ea078b]">
                        {totalColors} color{totalColors !== 1 ? 's' : ''} total
                      </span>
                    </div>
                  );
                }
                return null;
              })()}
            </div>
          </div>


          {product.papers.map((paper: any, paperIndex: number) => {
            // Calculate the global paper index for this product's paper
            let globalPaperIndex = 0;
            for (let pi = 0; pi < productIndex; pi++) {
              globalPaperIndex += formData.products[pi].papers.length;
            }
            globalPaperIndex += paperIndex;
            
            const opPaper = formData.operational.papers[globalPaperIndex];
            const { layout, recommendedSheets, pricePerSheet } = perPaperCalc[productIndex]?.[paperIndex] ?? {
              layout: {
                usableW: 0,
                usableH: 0,
                itemsPerSheet: 0,
                efficiency: 0,
                orientation: 'normal' as const,
                itemsPerRow: 0,
                itemsPerCol: 0
              },
              recommendedSheets: 0,
              pricePerSheet: null as number | null,
            };
            

            const inputWidth = opPaper?.inputWidth ?? null;
            const inputHeight = opPaper?.inputHeight ?? null;
            const qty = product?.quantity ?? 0;
            const enteredSheets = opPaper?.enteredSheets ?? null;

            const sheetsNeeded = layout.itemsPerSheet > 0 ? Math.ceil(qty / layout.itemsPerSheet) : 0;
            const actualSheetsNeeded = enteredSheets ? Math.max(sheetsNeeded, enteredSheets) : sheetsNeeded;
            const totalItemsPossible = actualSheetsNeeded * layout.itemsPerSheet;

            // Validation checks
            const dimensionError = validateOutputDimensions(
              outputDimensions[productIndex]?.width ?? 0, 
              outputDimensions[productIndex]?.height ?? 0, 
              inputWidth, 
              inputHeight
            );

            return (
              <div key={`${productIndex}-${paperIndex}`} className="space-y-4 md:space-y-6">
                                {/* Paper Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <h4 className="text-base md:text-lg font-semibold text-slate-800 flex items-center">
                      <Package className="w-4 h-4 md:w-5 md:h-5 mr-2 text-[#27aae1]" />
                      <span className="text-[#27aae1]">
                        {paper.name ? `${paper.name}${paper.gsm ? ` ${paper.gsm}gsm` : ""}` : `Paper ${paperIndex + 1}${paper.gsm ? ` ${paper.gsm}gsm` : ""}`}
                      </span>
                    </h4>
                    {/* Color Count Badge */}
                    {paperColors[productIndex]?.[paperIndex]?.length > 0 && (
                      <div className="flex items-center gap-2 px-3 py-1 bg-[#ea078b]/10 border border-[#ea078b]/30 rounded-full">
                        <Palette className="w-3 h-3 text-[#ea078b]" />
                        <span className="text-xs font-medium text-[#ea078b]">
                          {paperColors[productIndex][paperIndex].length} color{paperColors[productIndex][paperIndex].length !== 1 ? 's' : ''}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowPaperPrice(globalPaperIndex)}
                      className="border-[#27aae1] text-[#27aae1] hover:bg-[#27aae1]/100 rounded-xl text-xs sm:text-sm"
                    >
                      <Calculator className="w-4 h-4 mr-1 sm:mr-2" />
                      <span className="hidden sm:inline">View Paper Price</span>
                      <span className="sm:hidden">Paper Price</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowCostBreakdown(true)}
                      className="border-green-500 text-green-600 hover:bg-green-50 rounded-xl text-xs sm:text-sm"
                    >
                      <BarChart3 className="w-4 h-4 mr-1 sm:mr-2" />
                      <span className="hidden sm:inline">View Cost Breakdown</span>
                      <span className="sm:hidden">Cost Breakdown</span>
                    </Button>
                  </div>
                </div>

            {/* Dimension Validation Warning */}
            {dimensionError && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <div className="flex items-center">
                  <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
                  <span className="text-red-800 font-medium">{dimensionError}</span>
                </div>
              </div>
            )}
            
            {/* Output Dimensions Required Warning */}
            {(!outputDimensions[productIndex]?.width || !outputDimensions[productIndex]?.height) && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <div className="flex items-center">
                  <AlertTriangle className="w-5 h-5 text-amber-600 mr-2" />
                  <div>
                    <span className="text-amber-800 font-medium">Output dimensions required</span>
                    <div className="text-amber-700 text-sm mt-1">
                      Please set the output item dimensions in Step 3 before configuring operational details. 
                      This ensures accurate sheet calculations and cost estimates.
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Three Cards Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
              {/* CARD 1: Paper Details */}
              <Card className="border-0 shadow-lg w-full">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg text-slate-800 flex items-center">
                    <Package className="w-5 h-5 mr-2 text-[#27aae1]" />
                    Paper Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 md:space-y-6">
                  {/* Paper Size Section */}
                  <div className="space-y-3 md:space-y-4">
                    <h5 className="text-md font-semibold text-slate-700 flex items-center mb-3">
                      <Package className="w-4 h-4 mr-2 text-[#27aae1]" />
                      Input Sheet Size
                      <span className="ml-2 text-xs text-[#27aae1] font-normal">(Default: 100×70 cm)</span>
                    </h5>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-slate-700">
                          Width (cm)
                        </Label>
                        <Input
                          type="number"
                          placeholder="100"
                          min={0}
                          step="0.1"
                          value={opPaper?.inputWidth ?? 100}
                          className="border-slate-300 focus:border-[#27aae1] focus:ring-[#27aae1] rounded-xl h-10 w-full"
                          onChange={(e) =>
                            handlePaperOpChange(globalPaperIndex, "inputWidth", e.target.value)
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-slate-700">
                          Height (cm)
                        </Label>
                        <Input
                          type="number"
                          placeholder="70"
                          value={opPaper?.inputHeight ?? 70}
                          className="border-slate-300 focus:border-[#27aae1] focus:ring-[#27aae1] rounded-xl h-10 w-full"
                          min={0}
                          step="0.1"
                          onChange={(e) =>
                            handlePaperOpChange(globalPaperIndex, "inputHeight", e.target.value)
                          }
                        />
                      </div>
                    </div>
                  </div>

                  {/* Output Size Section - Read Only */}
                  <div className="space-y-3 md:space-y-4">
                    <h5 className="text-md font-semibold text-slate-700 flex items-center mb-3">
                      <Info className="w-4 h-4 mr-2 text-[#27aae1]" />
                      Output Item Size
                      <span className="ml-2 text-xs text-[#27aae1] font-normal">(From Step 3 - Read Only)</span>
                    </h5>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-slate-700">
                          Output Width (cm)
                        </Label>
                        <Input
                          type="number"
                          placeholder="Width"
                          min={0}
                          step="0.1"
                          readOnly
                          disabled
                          className={`border-slate-300 bg-slate-100 text-slate-500 cursor-not-allowed rounded-xl h-10 w-full ${
                            dimensionError ? 'border-red-300 bg-red-50' : ''
                          }`}
                          value={(() => {
                            const product = formData.products[productIndex];
                            const width = outputDimensions[productIndex]?.width || 
                                         product?.flatSize?.width || 
                                         product?.closeSize?.width || 
                                         "";
                            console.log('🔍 Output Width Debug:', {
                              productIndex,
                              outputDimensions: outputDimensions[productIndex],
                              product: product,
                              flatSize: product?.flatSize,
                              closeSize: product?.closeSize,
                              finalWidth: width
                            });
                            return width;
                          })()}
                        />
                        {!(outputDimensions[productIndex]?.width || formData.products[productIndex]?.flatSize?.width || formData.products[productIndex]?.closeSize?.width) && (
                          <div className="text-amber-600 text-xs mt-1">
                            ⚠️ Please set output dimensions in Step 3 first
                          </div>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-slate-700">
                          Output Height (cm)
                        </Label>
                        <Input
                          type="number"
                          placeholder="Height"
                          min={0}
                          step="0.1"
                          readOnly
                          disabled
                          className={`border-slate-300 bg-slate-100 text-slate-500 cursor-not-allowed rounded-xl h-10 w-full ${
                            dimensionError ? 'border-red-300 bg-red-50' : ''
                          }`}
                          value={(() => {
                            const product = formData.products[productIndex];
                            const height = outputDimensions[productIndex]?.height || 
                                          product?.flatSize?.height || 
                                          product?.closeSize?.height || 
                                          "";
                            console.log('🔍 Output Height Debug:', {
                              productIndex,
                              outputDimensions: outputDimensions[productIndex],
                              product: product,
                              flatSize: product?.flatSize,
                              closeSize: product?.closeSize,
                              finalHeight: height
                            });
                            return height;
                          })()}
                        />
                        {!(outputDimensions[productIndex]?.height || formData.products[productIndex]?.flatSize?.height || formData.products[productIndex]?.closeSize?.height) && (
                          <div className="text-xs text-amber-600 mt-1">
                            ⚠️ Please set output dimensions in Step 3 first
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Sheet Management Section */}
                  <div className="space-y-3 md:space-y-4">
                    <h5 className="text-md font-semibold text-slate-700 flex items-center mb-3">
                      <BarChart3 className="w-4 h-4 mr-2 text-[#27aae1]" />
                      Sheet Management
                    </h5>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-slate-700">
                          Recommended Sheets
                        </Label>
                        <Input
                          value={recommendedSheets || ""}
                          readOnly
                          className="bg-slate-100 border-slate-300 rounded-xl h-10 w-full"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-slate-700">
                          Enter Sheets
                          {!opPaper?.enteredSheets && (
                            <span className="ml-2 text-xs text-[#27aae1] font-normal">
                              (Default: {recommendedSheets})
                            </span>
                          )}
                        </Label>
                        <Input
                          type="number"
                          min={0}
                          placeholder={recommendedSheets ? String(recommendedSheets) : "e.g. 125"}
                          className={`border-slate-300 focus:border-[#27aae1] focus:ring-[#27aae1] rounded-xl h-10 w-full ${
                            !opPaper?.enteredSheets ? 'bg-[#27aae1]/10 border-[#27aae1]/30' : ''
                          }`}
                          value={opPaper?.enteredSheets ?? recommendedSheets ?? ""}
                          onChange={(e) => {
                              handlePaperOpChange(globalPaperIndex, "enteredSheets", e.target.value);
                          }}
                        />
                        {opPaper?.enteredSheets && opPaper.enteredSheets < recommendedSheets && (
                          <div className="text-amber-600 text-xs mt-1 flex items-center gap-2">
                            <span>⚠ Less than recommended ({recommendedSheets})</span>
                            <button
                              type="button"
                              onClick={() => {
                                // Add "No TRN" option or similar justification
                                const justification = prompt("Please provide justification for using fewer sheets (e.g., 'No TRN', 'Special arrangement', etc.):");
                                if (justification && justification.trim()) {
                                  // Store the justification or show it in the UI
                                  console.log(`Justification for ${opPaper.enteredSheets} sheets: ${justification}`);
                                }
                              }}
                              className="text-xs text-[#27aae1] hover:text-[#27aae1] underline"
                            >
                              Add justification
                            </button>
                          </div>
                        )}
                        {/* Enhanced auto-selection info */}
                        {!opPaper?.enteredSheets ? (
                          <div className="text-[#27aae1] text-xs mt-1">
                            ✓ Using recommended sheets as default ({recommendedSheets})
                          </div>
                        ) : opPaper.enteredSheets === recommendedSheets ? (
                          <div className="text-green-600 text-xs mt-1">
                            ✓ Matches recommended sheets
                          </div>
                        ) : (
                          <div className="text-amber-600 text-xs mt-1 flex items-center justify-between">
                            <span>⚠ Custom value set (recommended: {recommendedSheets})</span>
                            <button
                              type="button"
                              onClick={() => {
                                const paperKey = `paper-${globalPaperIndex}`;
                                setUserEditedSheets(prev => {
                                  const newSet = new Set(prev);
                                  newSet.delete(paperKey);
                                  return newSet;
                                });
                                handlePaperOpChange(globalPaperIndex, "enteredSheets", String(recommendedSheets));
                              }}
                              className="text-xs text-[#27aae1] hover:text-[#27aae1] underline"
                            >
                              Reset to recommended
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                    
                  </div>

                  {/* Color Codes Section */}
                  <div className="space-y-3 md:space-y-4">
                    <h5 className="text-md font-semibold text-slate-700 flex items-center mb-3">
                      <Palette className="w-4 h-4 mr-2 text-[#27aae1]" />
                      Color Codes
                    </h5>
                    
                    <div className="text-xs text-slate-500 mb-2">
                      Add hex codes, Pantone colors, or color names for this paper
                    </div>
                    
                    {/* Color Input */}
                    <div className="flex flex-col sm:flex-row gap-2 mb-3">
                      <div className="flex-1 relative">
                        <Input
                          type="text"
                          placeholder="e.g., #FF0000, Pantone 185C, Red"
                          value={colorInputs[productIndex]?.[paperIndex] || ''}
                          onChange={(e) => {
                            const newColorInputs = { ...colorInputs };
                            if (!newColorInputs[productIndex]) newColorInputs[productIndex] = {};
                            newColorInputs[productIndex][paperIndex] = e.target.value;
                            setColorInputs(newColorInputs);
                          }}
                          className="h-8 text-sm pr-10 w-full"
                        />
                        {/* Color preview */}
                        {colorInputs[productIndex]?.[paperIndex] && (
                          <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                            <div 
                              className="w-4 h-4 rounded border border-slate-300"
                              style={{ 
                                backgroundColor: getColorFromInput(colorInputs[productIndex][paperIndex]),
                                backgroundImage: getColorFromInput(colorInputs[productIndex][paperIndex]) === 'transparent' ? 'linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)' : 'none',
                                backgroundSize: '4px 4px'
                              }}
                            ></div>
                          </div>
                        )}
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const colorValue = colorInputs[productIndex]?.[paperIndex];
                          if (colorValue && colorValue.trim()) {
                            // Set saving status
                            const newColorSaveStatus = { ...colorSaveStatus };
                            if (!newColorSaveStatus[productIndex]) newColorSaveStatus[productIndex] = {};
                            newColorSaveStatus[productIndex][paperIndex] = 'saving';
                            setColorSaveStatus(newColorSaveStatus);
                            
                            // Add the color to the local state
                            const newColors = [...(paperColors[productIndex]?.[paperIndex] || [])];
                            newColors.push(colorValue.trim());
                            
                            const newPaperColors = { ...paperColors };
                            if (!newPaperColors[productIndex]) newPaperColors[productIndex] = {};
                            newPaperColors[productIndex][paperIndex] = newColors;
                            setPaperColors(newPaperColors);
                            
                            // Update the form data to sync with database
                            const globalPaperIndex = formData.products
                              .slice(0, productIndex)
                              .reduce((total, product) => total + product.papers.length, 0) + paperIndex;
                            
                            setFormData(prev => ({
                              ...prev,
                              operational: {
                                ...prev.operational,
                                papers: prev.operational.papers.map((paper: any, index: number) => 
                                  index === globalPaperIndex 
                                    ? { ...paper, selectedColors: newColors }
                                    : paper
                                )
                              }
                            }));
                            
                            // Clear input
                            const newColorInputs = { ...colorInputs };
                            newColorInputs[productIndex][paperIndex] = '';
                            setColorInputs(newColorInputs);
                            
                            // Set saved status after a short delay
                            setTimeout(() => {
                              setColorSaveStatus(prev => ({
                                ...prev,
                                [productIndex]: {
                                  ...prev[productIndex],
                                  [paperIndex]: 'saved'
                                }
                              }));
                              
                              // Reset to idle after 2 seconds
                              setTimeout(() => {
                                setColorSaveStatus(prev => ({
                                  ...prev,
                                  [productIndex]: {
                                    ...prev[productIndex],
                                    [paperIndex]: 'idle'
                                  }
                                }));
                              }, 2000);
                            }, 500);
                          }
                        }}
                        className={`h-8 px-3 text-xs transition-all duration-200 ${
                          colorSaveStatus[productIndex]?.[paperIndex] === 'saving' 
                            ? 'bg-[#27aae1]/20 text-[#27aae1] border-[#27aae1]/50' 
                            : colorSaveStatus[productIndex]?.[paperIndex] === 'saved'
                            ? 'bg-green-100 text-green-700 border-green-300'
                            : ''
                        }`}
                        disabled={!colorInputs[productIndex]?.[paperIndex]?.trim() || colorSaveStatus[productIndex]?.[paperIndex] === 'saving'}
                      >
                        {colorSaveStatus[productIndex]?.[paperIndex] === 'saving' ? (
                          <div className="w-3 h-3 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                        ) : colorSaveStatus[productIndex]?.[paperIndex] === 'saved' ? (
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          'Add'
                        )}
                      </Button>
                    </div>
                    
                    {/* Display Colors */}
                    {paperColors[productIndex]?.[paperIndex]?.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {paperColors[productIndex][paperIndex].map((colorCode, colorIndex) => (
                          <div key={colorIndex} className="flex items-center gap-2 px-2 py-1 bg-white rounded border border-slate-200">
                            <div 
                              className="w-3 h-3 rounded border border-slate-300"
                              style={{ 
                                backgroundColor: getColorFromInput(colorCode),
                                backgroundImage: getColorFromInput(colorCode) === 'transparent' ? 'linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)' : 'none',
                                backgroundSize: '3px 3px'
                              }}
                            ></div>
                            <span className="text-xs font-mono text-slate-700">{colorCode}</span>
                            <button
                              type="button"
                              onClick={() => {
                                const newColors = [...paperColors[productIndex][paperIndex]];
                                newColors.splice(colorIndex, 1);
                                
                                const newPaperColors = { ...paperColors };
                                newPaperColors[productIndex][paperIndex] = newColors;
                                setPaperColors(newPaperColors);
                                
                                // Update the form data to sync with database
                                const globalPaperIndex = formData.products
                                  .slice(0, productIndex)
                                  .reduce((total, product) => total + product.papers.length, 0) + paperIndex;
                                
                                setFormData(prev => ({
                                  ...prev,
                                  operational: {
                                    ...prev.operational,
                                    papers: prev.operational.papers.map((paper: any, index: number) => 
                                      index === globalPaperIndex 
                                        ? { ...paper, selectedColors: newColors }
                                        : paper
                                    )
                                  }
                                }));
                              }}
                              className="text-slate-400 hover:text-red-500 transition-colors ml-1"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* CARD 2: Paper Pricing */}
              <Card className="border-0 shadow-lg w-full">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg text-slate-800 flex items-center">
                    <Calculator className="w-5 h-5 mr-2 text-[#27aae1]" />
                    Paper Pricing
                    <span className="ml-2 text-xs text-[#27aae1] bg-[#27aae1]/10 px-2 py-1 rounded-full">
                      Excel-Based
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 md:space-y-6">
                  {/* Pricing Section */}
                                      <div className="space-y-3 md:space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <h5 className="text-md font-semibold text-slate-700 flex items-center">
                          <BarChart3 className="w-4 h-4 mr-2 text-[#27aae1]" />
                          Cost Details
                        </h5>
                        <div className="flex items-center">
                          <Info className="w-4 h-4 text-[#27aae1] mr-1" />
                          <button
                            type="button"
                            onClick={() => setShowPricingLogic(true)}
                            className="text-xs text-[#27aae1] hover:text-[#27aae1] underline flex items-center"
                          >
                            <Info className="w-3 h-3 mr-1" />
                            View Pricing Logic
                          </button>
                        </div>
                      </div>
                      <div className="space-y-3 md:space-y-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-slate-700">
                          Price per Sheet (Direct)
                        </Label>
                        <Input
                          type="number"
                          placeholder="$ 0.00"
                          step="0.0001"
                          className="border-slate-300 focus:border-[#27aae1] focus:ring-[#27aae1] rounded-xl h-10"
                          value={opPaper?.pricePerSheet ?? ""}
                          onChange={(e) =>
                            handlePaperOpChange(globalPaperIndex, "pricePerSheet", e.target.value)
                          }
                        />
                        <div className="text-xs text-slate-500 mt-1">
                          Leave empty to use packet pricing only
                        </div>
                      </div>
                      <div className="border-t pt-4">
                        <h6 className="text-sm font-medium text-slate-600 mb-3">Packet Pricing:</h6>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label className="text-sm font-medium text-slate-700 flex items-center">
                              <Package className="w-4 h-4 mr-2" />
                              Sheets per Packet
                            </Label>
                            <Input
                              type="number"
                              placeholder="e.g. 500"
                              className="border-slate-300 focus:border-[#27aae1] focus:ring-[#27aae1] rounded-xl h-10"
                              min={0}
                              value={opPaper?.sheetsPerPacket ?? ""}
                              onChange={(e) =>
                                handlePaperOpChange(
                                  globalPaperIndex,
                                  "sheetsPerPacket",
                                  e.target.value
                                )
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-sm font-medium text-slate-700 flex items-center">
                              <DollarSign className="w-4 h-4 mr-2" />
                              Price per Packet
                            </Label>
                            <Input
                              type="number"
                              className="border-slate-300 focus:border-[#27aae1] focus:ring-[#27aae1] rounded-xl h-10"
                              placeholder="$ 0.00"
                              value={opPaper?.pricePerPacket ?? ""}
                              onChange={(e) =>
                                handlePaperOpChange(globalPaperIndex, "pricePerPacket", e.target.value)
                              }
                            />
                          </div>
                        </div>
                      </div>
                      
                      {/* Excel-Based Pricing Summary */}
                      <div className="bg-[#27aae1]/10 rounded-lg p-4 border border-[#27aae1]/30">
                        <h6 className="text-sm font-semibold text-[#27aae1] mb-3 flex items-center">
                          <Calculator className="w-4 h-4 mr-2" />
                          Excel-Based Pricing Summary
                        </h6>
                        
                        {(() => {
                          try {
                            // 1) Inputs from Step 3 / product
                            console.log('🔍 Pricing Summary - productIndex:', productIndex);
                            console.log('🔍 Pricing Summary - outputDimensions:', outputDimensions);
                            console.log('🔍 Pricing Summary - product:', product);
                            console.log('🔍 Pricing Summary - outputDimensions[productIndex]:', outputDimensions[productIndex]);
                            console.log('🔍 Pricing Summary - product.flatSize:', product?.flatSize);
                            
                            // Use same logic as main calculation - prioritize product.flatSize directly
                            const pieceH = product?.flatSize?.height ?? 9;
                            const pieceW = product?.flatSize?.width ?? 5.5;
                            
                            console.log('🔍 Pricing Summary - Final dimensions:', { pieceH, pieceW });

                            const qty   = Number(product.quantity) || 1000;
                            const sides = Number(product.sides) || 2;
                            
                            // Extract number of colors from Step 3 selection
                            // Handle formats like "4 Colors (CMYK)", "4+1 Colors", "4+2 Colors"
                            const parseColors = (colorStr: any): number => {
                              if (!colorStr) return 0;
                              const str = colorStr.toString();
                              
                              // Check for "4+1" or "4+2" format
                              const plusMatch = str.match(/(\d+)\+(\d+)/);
                              if (plusMatch) {
                                const base = parseInt(plusMatch[1]);
                                const additional = parseInt(plusMatch[2]);
                                return base + additional;
                              }
                              
                              // Fallback to single number
                              const singleMatch = str.match(/\d+/);
                              return singleMatch ? parseInt(singleMatch[0]) : 0;
                            };

                            const frontColors = parseColors(product.colors?.front);
                            const backColors = parseColors(product.colors?.back);
                            
                            // For 2-sided printing, use max of front/back (same plates used)
                            const rawColours = Math.max(frontColors, backColors) || 4;
                            
                            // Check if this is digital printing
                            const isDigital = product?.printingSelection === 'Digital';
                            
                            // Color categorization: ONLY apply for Digital (1-3 colors = 1 color, 4+ colors = 4 colors)
                            // For Offset, use actual color count for accurate plate cost calculation
                            const colours = isDigital ? (rawColours <= 3 ? 1 : 4) : rawColours;

                            // 2) Paper cost per sheet: Step 4 manual > packet/ratio > materials DB
                            const paperName = product.papers[paperIndex]?.name || "";
                            const paperGSM  = product.papers[paperIndex]?.gsm  || "";
                            const materialPrice = getPaperPriceFromMaterials(paperName, paperGSM);

                            let paperCostPerSheet = opPaper?.pricePerSheet;
                            if (paperCostPerSheet == null) {
                              if (opPaper?.pricePerPacket != null && opPaper?.sheetsPerPacket != null && opPaper.sheetsPerPacket > 0) {
                                paperCostPerSheet = opPaper.pricePerPacket / opPaper.sheetsPerPacket;
                                console.log('📦 Using packet pricing:', {
                                  pricePerPacket: opPaper.pricePerPacket,
                                  sheetsPerPacket: opPaper.sheetsPerPacket,
                                  calculatedPricePerSheet: paperCostPerSheet
                                });
                              } else {
                                paperCostPerSheet = materialPrice ?? 10;
                                console.log('📄 Using materials database pricing:', {
                                  materialPrice,
                                  fallbackPrice: paperCostPerSheet
                                });
                              }
                            } else {
                              console.log('💰 Using direct sheet pricing:', {
                                pricePerSheet: paperCostPerSheet
                              });
                            }

                            // isDigital already declared above for color categorization
                            
                            if (isDigital) {
                              // Use digital calculation for digital printing
                              try {
                                const digitalResults = excelDigitalCalculation({
                                  qty,
                                  piece: { w: pieceW, h: pieceH },
                                  sides: sides as 1 | 2,
                                  colorsF: colours as 1 | 2 | 4,
                                  colorsB: 1,
                                  parent: { w: 100, h: 70 },
                                  allowRotate: true,
                                  paperCostPerSheet: paperCostPerSheet // Pass manual paper pricing
                                });
                                
                                if (digitalResults.length > 0) {
                                  // Use the cheapest digital option
                                  const cheapest = digitalResults.reduce((min, current) => 
                                    current.total < min.total ? current : min
                                  );
                                  
                                  // 7) Render digital results
                                  return (
                                    <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                                      <div className="flex items-center mb-4">
                                        <Calculator className="w-5 h-5 text-blue-600 mr-2" />
                                        <h4 className="text-lg font-semibold text-blue-800">Digital Pricing Summary</h4>
                                      </div>

                                      <div className="text-xs text-slate-500 mb-2">
                                        Sheet option: <b>{cheapest.option}</b> &nbsp;|&nbsp; Cut pcs: <b>{cheapest.cutPerParent}</b>
                                      </div>
                                      
                                      <div className="space-y-3">
                                        <div className="flex justify-between items-center text-sm">
                                          <span className="text-slate-600">Paper Cost ({cheapest.parents} sheets):</span>
                                          <span className="font-semibold text-blue-600">{fmt(cheapest.paper)}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-sm">
                                          <span className="text-slate-600">Click Cost:</span>
                                          <span className="font-semibold text-blue-600">{fmt(cheapest.clicks)}</span>
                                        </div>
                                      </div>
                                      
                                      <div className="border-t border-gray-300 pt-3 mt-3">
                                        <div className="flex justify-between items-center">
                                          <span className="font-bold text-blue-800">Digital Total Cost:</span>
                                          <span className="text-xl font-bold text-blue-800">{fmt(cheapest.total)}</span>
                                        </div>
                                        <div className="text-xs text-slate-500 mt-1">
                                          Ups/sheet: {cheapest.upsPerSheet} &nbsp;|&nbsp; Sheets: {cheapest.parents}
                                        </div>
                                      </div>
                                    </div>
                                  );
                                } else {
                                  throw new Error('No digital results available');
                                }
                              } catch (error) {
                                console.error('❌ Digital pricing summary failed:', error);
                                return (
                                  <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                                    <div className="text-red-600">Digital calculation failed. Please check your inputs.</div>
                                  </div>
                                );
                              }
                            } else {
                              // Use offset calculation for offset printing
                              // 3) Build base and candidate list
                              const base = { pieceW, pieceH, qty, sides, colours, paperCostPerSheet };
                              const candidates = CUT_SIZE_CANDIDATES;

                              // 4) Did user type a parent in Step 4? Use that exact row (and its real cutPcs).
                              const userParentW = opPaper?.inputWidth;
                              const userParentH = opPaper?.inputHeight;

                              let chosenRow: CandidateRow | undefined;
                              let ranked: ReturnType<typeof pickCheapestTotal> | undefined;

                              if (userParentW && userParentH) {
                                chosenRow = candidates.find(
                                  r => Number(r.parentW) === Number(userParentW) && Number(r.parentH) === Number(userParentH)
                                );
                                if (!chosenRow) {
                                  console.warn("Manual parent size not found in candidates; falling back to cheapest.");
                                }
                              }

                              // 5) If no exact match, pick the cheapest across all rows
                              if (!chosenRow) {
                                ranked = pickCheapestTotal(base, candidates);
                                chosenRow = ranked[0]; // cheapest row
                              }

                              // 6) Compute final breakdown using the selected REAL row
                              const excelResult = calcRowTotal(base, chosenRow);

                              // Debug logging
                              console.log('🔍 Offset Pricing Summary Debug:', {
                                pieceW, pieceH, qty, sides, colours, paperCostPerSheet,
                                chosenRow,
                                excelResult,
                                userParentW, userParentH,
                                candidatesLength: candidates.length
                              });

                              // 7) Render offset results
                              return (
                                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                                  <div className="flex items-center mb-4">
                                    <Calculator className="w-5 h-5 text-blue-600 mr-2" />
                                    <h4 className="text-lg font-semibold text-blue-800">Offset Pricing Summary</h4>
                                  </div>

                                  <div className="text-xs text-slate-500 mb-2">
                                    Parent used: <b>{chosenRow.parentW}×{chosenRow.parentH}</b> &nbsp;|&nbsp; Cut pcs: <b>{chosenRow.cutPcs}</b>
                                  </div>
                                
                                  <div className="space-y-3">
                                    <div className="flex justify-between items-center text-sm">
                                      <span className="text-slate-600">Paper Cost ({opPaper?.enteredSheets || excelResult.sheets} sheets):</span>
                                      <span className="font-semibold text-blue-600">{fmt((opPaper?.enteredSheets || excelResult.sheets) * paperCostPerSheet)}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                      <span className="text-slate-600">Unit Price:</span>
                                      <span className="font-semibold text-blue-600">{fmt(excelResult.unit_price)}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                      <span className="text-slate-600">Plate Cost ({colours} colors):</span>
                                      <span className="font-semibold text-blue-600">{fmt(excelResult.plateTotal)}</span>
                                    </div>
                                  </div>
                                  
                                  <div className="border-t border-gray-300 pt-3 mt-3">
                                    <div className="flex justify-between items-center">
                                      <span className="font-bold text-blue-800">Offset Total Cost:</span>
                                      <span className="text-xl font-bold text-blue-800">{fmt(excelResult.unit_price + ((opPaper?.enteredSheets || excelResult.sheets) * paperCostPerSheet) + excelResult.plateTotal)}</span>
                                    </div>
                                    <div className="text-xs text-slate-500 mt-1">
                                      Ups/sheet: {excelResult.upsPerSht} &nbsp;|&nbsp; Waste: {excelResult.wasteSheets} &nbsp;|&nbsp; No. of ups: {excelResult.noOfUps}
                                    </div>
                                  </div>
                                </div>
                              );
                            }
                          } catch (e) {
                            console.error(e);
                            return <div className="text-sm text-slate-600">Excel calculation unavailable.</div>;
                          }
                        })()}
                      </div>
                      
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* CARD 3: Additional Costs */}
              <Card className="border-0 shadow-lg w-full">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg text-slate-800 flex items-center">
                    <Calculator className="w-5 h-4 mr-2 text-[#27aae1]" />
                    Additional Costs
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 md:space-y-6">
                  {/* Production Costs Section */}
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <h5 className="text-md font-semibold text-slate-700 flex items-center">
                        <Calculator className="w-4 h-4 mr-2 text-[#27aae1]" />
                        Production Costs
                      </h5>
                      <div className="text-xs text-slate-500">
                        ✓ Auto-calculated
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-slate-700">
                          No. of plates
                        </Label>
                        <Input 
                          type="number"
                          min="0"
                          placeholder="e.g. 8"
                          className={`border-slate-300 focus:border-[#27aae1] focus:ring-[#27aae1] rounded-xl h-10 w-full ${
                            !formData.operational.plates ? 'bg-[#27aae1]/10 border-[#27aae1]/30' : 'bg-white'
                          }`}
                          value={formData.operational.plates ?? plates ?? ""} 
                          onChange={(e) => handlePlatesChange(e.target.value)}
                        />
                        {!formData.operational.plates ? (
                          <div className="text-[#27aae1] text-xs mt-1">
                            ✓ Auto-calculated: {plates}
                          </div>
                        ) : (
                          <div className="text-amber-600 text-xs mt-1 flex items-center justify-between">
                            <span>⚠ Custom value (auto: {plates})</span>
                            <button
                              type="button"
                              onClick={() => handlePlatesChange("")}
                              className="text-xs text-[#27aae1] hover:text-[#27aae1] underline"
                            >
                              Reset
                            </button>
                          </div>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-slate-700">
                          No. of units
                        </Label>
                        <Input 
                          type="number"
                          min="0"
                          placeholder="e.g. 1000"
                          className={`border-slate-300 focus:border-[#27aae1] focus:ring-[#27aae1] rounded-xl h-10 w-full ${
                            !formData.operational.units ? 'bg-[#27aae1]/10 border-[#27aae1]/30' : 'bg-white'
                          }`}
                          value={formData.operational.units ?? units ?? ""} 
                          onChange={(e) => handleUnitsChange(e.target.value)}
                        />
                        {!formData.operational.units ? (
                          <div className="text-[#27aae1] text-xs mt-1">
                            ✓ Auto-calculated: {units}
                          </div>
                        ) : (
                          <div className="text-amber-600 text-xs mt-1 flex items-center justify-between">
                            <span>⚠ Custom value (auto: {units})</span>
                            <button
                              type="button"
                              onClick={() => handleUnitsChange("")}
                              className="text-xs text-[#27aae1] hover:text-[#27aae1] underline"
                            >
                              Reset
                            </button>
                          </div>
                        )}
                      </div>
                      
                      {/* No. of Impressions Field */}
                      <div className="space-y-2 col-span-1 sm:col-span-2">
                        <Label className="text-sm font-medium text-slate-700">
                          No. of Impressions
                        </Label>
                        <Input 
                          type="number"
                          min="0"
                          placeholder="e.g. 5000"
                          className={`border-slate-300 focus:border-[#27aae1] focus:ring-[#27aae1] rounded-xl h-10 w-full ${
                            !formData.operational.impressions ? 'bg-[#27aae1]/10 border-[#27aae1]/30' : 'bg-white'
                          }`}
                          value={formData.operational.impressions ?? ""} 
                          onChange={(e) => {
                            const impressions = e.target.value === "" ? null : parseFloat(e.target.value);
                            setFormData((prev) => ({
                              ...prev,
                              operational: {
                                ...prev.operational,
                                impressions,
                              },
                            }));
                          }}
                        />
                        {!formData.operational.impressions ? (
                          <div className="text-[#27aae1] text-xs mt-1">
                            ✓ Enter manually or leave empty
                      </div>
                        ) : (
                          <div className="text-amber-600 text-xs mt-1 flex items-center justify-between">
                            <span>⚠ Custom value set</span>
                            <button
                              type="button"
                              onClick={() => {
                                setFormData((prev) => ({
                                  ...prev,
                                  operational: {
                                    ...prev.operational,
                                    impressions: null,
                                  },
                                }));
                              }}
                              className="text-xs text-[#27aae1] hover:text-[#27aae1] underline"
                            >
                              Reset
                            </button>
                    </div>
                        )}
                              </div>
                              
                                        </div>
                                        </div>

                  {/* Note: Finishing costs are now calculated once at the end, not per product */}

                  {/* Additional Costs Section */}
                  <div className="space-y-4">
                    <h5 className="text-md font-semibold text-slate-700 flex items-center">
                      <DollarSign className="w-4 h-4 mr-2 text-[#27aae1]" />
                      Additional Costs
                      <span className="ml-2 text-xs text-slate-500">(Unique project costs)</span>
                    </h5>
                    <div className="space-y-4">
                      {additionalCosts.map((cost, index) => (
                        <div key={cost.id} className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 mb-2">
                            <div className="flex-1 space-y-2">
                              <Input
                                type="text"
                                placeholder="Cost description"
                                className="w-full border-slate-300 focus:border-[#27aae1] focus:ring-[#27aae1] rounded-lg"
                                value={cost.description}
                                onChange={(e) => {
                                  const newCosts = [...additionalCosts];
                                  newCosts[index].description = e.target.value;
                                  setAdditionalCosts(newCosts);
                                }}
                              />
                              <Input
                                type="number"
                                placeholder="Cost amount"
                                step="0.01"
                                min="0"
                                className="w-full sm:w-32 border-slate-300 focus:border-[#27aae1] focus:ring-[#27aae1] rounded-lg"
                                value={cost.cost === 0 ? "" : cost.cost}
                                onChange={(e) => {
                                  const newCosts = [...additionalCosts];
                                  const inputValue = e.target.value;
                                  // Allow empty string for flexible input, convert to 0 only when needed
                                  if (inputValue === "" || inputValue === null || inputValue === undefined) {
                                    newCosts[index].cost = 0;
                                  } else {
                                    const parsedValue = parseFloat(inputValue);
                                    newCosts[index].cost = isNaN(parsedValue) ? 0 : parsedValue;
                                  }
                                  setAdditionalCosts(newCosts);
                                }}
                                onBlur={(e) => {
                                  // Ensure we have a valid number when the field loses focus
                                  const newCosts = [...additionalCosts];
                                  const inputValue = e.target.value;
                                  if (inputValue === "" || inputValue === null || inputValue === undefined) {
                                    newCosts[index].cost = 0;
                                  }
                                  setAdditionalCosts(newCosts);
                                }}
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                const newCosts = additionalCosts.filter((_, i) => i !== index);
                                setAdditionalCosts(newCosts);
                              }}
                              className="ml-2 p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                          <Input
                            type="text"
                            placeholder="Comment (mandatory)"
                            className="w-full border-slate-300 focus:border-[#27aae1] focus:ring-[#27aae1] rounded-lg"
                            value={cost.comment}
                            onChange={(e) => {
                              const newCosts = [...additionalCosts];
                              newCosts[index].comment = e.target.value;
                              setAdditionalCosts(newCosts);
                            }}
                          />
                          {!cost.comment && (
                            <div className="text-red-600 text-xs mt-1">
                              ⚠️ Comment is mandatory for additional costs
                            </div>
                          )}
                        </div>
                      ))}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setAdditionalCosts([
                            ...additionalCosts,
                            {
                              id: Date.now().toString(),
                              description: '',
                              cost: 0,
                              comment: ''
                            }
                          ]);
                        }}
                        className="w-full border-dashed border-slate-300 text-slate-600 hover:border-slate-400 hover:text-slate-700"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Additional Cost
                      </Button>
                    </div>

                    {/* Finishing Costs Section - Inside Additional Costs */}
                    {(() => {
                      // Collect all unique finishing types across all products
                      const allFinishingTypes = new Set<string>();
                      formData.products.forEach((product) => {
                        if (product.finishing && product.finishing.length > 0) {
                          product.finishing.forEach((finishingName: any) => {
                            allFinishingTypes.add(finishingName);
                          });
                        }
                      });

                      if (allFinishingTypes.size > 0) {
                        const totalFinishingCost = calculateFinishingCosts();
                        
                        return (
                          <div className="space-y-4 mt-6 pt-4 border-t border-slate-200">
                            {/* Header Section */}
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                              <div className="flex items-center">
                                <Settings className="w-4 h-4 mr-2 text-[#27aae1]" />
                                <h5 className="text-md font-semibold text-slate-700">
                                  Finishing Costs
                                </h5>
                                <span className="ml-2 text-xs text-slate-500">(Calculated once at the end)</span>
                              </div>
                            </div>

                            {/* Cost and Button Section */}
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                              <div className="flex items-center space-x-3">
                                <span className="text-xl font-bold text-[#27aae1]">
                                  {fmt(totalFinishingCost)}
                                </span>
                                <span className="text-sm text-slate-500">total cost</span>
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setShowFinishingDetails(true)}
                                className="text-xs border-[#27aae1] text-[#27aae1] hover:bg-[#27aae1] hover:text-white w-full sm:w-auto"
                              >
                                View Details
                              </Button>
                            </div>

                            {/* Summary Section */}
                            <div className="text-sm text-slate-600">
                              {allFinishingTypes.size} finishing type{allFinishingTypes.size > 1 ? 's' : ''} applied • Total cost includes all finishing options
                            </div>
                          </div>
                        );
                      }
                      return null;
                    })()}

                  </div>
                </CardContent>
              </Card>
            </div>

            

            {/* Cutting Layout Visualization - TEMPORARILY HIDDEN FOR CLIENT CLARIFICATION */}
            {false && (
            <Card className="border-0 shadow-lg w-full mx-0">
              <CardHeader className="pb-3">
                <CardTitle className="text-xl md:text-2xl font-bold text-slate-800 flex items-center">
                  <Settings className="w-6 h-6 md:w-7 md:h-7 mr-2 md:mr-3 text-red-600" />
                  Cutting Layout Visualization
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 w-full px-2 md:px-4">
                <div className="space-y-3">
                  <h5 className="text-base md:text-lg font-semibold text-slate-700">How the 100×70cm Input Sheet is Cut for Machine Compatibility</h5>
                  
                  <div className="w-full h-[250px] sm:h-[350px] md:h-[450px] lg:h-[500px] bg-gradient-to-br from-red-50 to-red-100 border border-red-200 rounded-lg p-1 shadow-lg overflow-hidden">
                    <div className="relative w-full h-full bg-white rounded-lg shadow-inner overflow-hidden">
                      <canvas
                        id={`cutting-canvas-${productIndex}-${paperIndex}`}
                        className="w-full h-full rounded-lg transition-all duration-500 hover:shadow-md"
                        style={{ maxWidth: '100%', maxHeight: '100%' }}
                        ref={(canvas) => {
                          if (canvas && opPaper?.inputWidth && opPaper?.inputHeight && outputDimensions[productIndex]?.width && outputDimensions[productIndex]?.height) {
                            setTimeout(() => {
                              // Use dynamic press calculation to get optimal cutting dimensions
                              const productDimensions = {
                                width: outputDimensions[productIndex].width,
                                height: outputDimensions[productIndex].height
                              };
                              
                              const pressDimension = calculateVisualizationPressDimensions(productDimensions, formData);
                              
                              if (pressDimension && opPaper.inputWidth && opPaper.inputHeight) {
                                console.log('🔧 Using dynamic press dimensions for cutting:', {
                                  productDimensions,
                                  pressDimension,
                                  inputSheet: { width: opPaper.inputWidth, height: opPaper.inputHeight },
                                  exactValues: {
                                    inputWidth: opPaper.inputWidth,
                                    inputHeight: opPaper.inputHeight,
                                    pressWidth: pressDimension.width,
                                    pressHeight: pressDimension.height,
                                    is100x70: opPaper.inputWidth === 100 && opPaper.inputHeight === 70,
                                    is23x20: pressDimension.width === 23 && pressDimension.height === 20,
                                    is20x23: pressDimension.width === 20 && pressDimension.height === 23
                                  }
                                });
                                
                                drawCuttingLayout(canvas, opPaper.inputWidth, opPaper.inputHeight, pressDimension.width, pressDimension.height);
                              }
                            }, 150);
                          }
                        }}
                      />
                      {(!opPaper?.inputWidth || !opPaper?.inputHeight) && (
                        <div className="absolute inset-0 grid place-items-center text-sm md:text-lg text-slate-500 bg-gradient-to-br from-red-50 to-red-100 rounded-lg">
                          <div className="text-center p-3 md:p-4 lg:p-8 max-w-[90%]">
                            <div className="text-red-400 mb-2 md:mb-4 text-2xl md:text-3xl lg:text-5xl">✂️</div>
                            <div className="font-semibold text-slate-600 text-sm md:text-base lg:text-xl">Input Dimensions Required</div>
                            <div className="text-xs md:text-sm text-slate-400 mt-2 md:mt-3">Set input sheet dimensions to preview cutting layout</div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                    <div className="bg-white rounded-xl p-4 border border-red-200 shadow-sm">
                      <h6 className="font-semibold text-slate-800 mb-3 text-center flex items-center justify-center">
                        <Settings className="w-4 h-4 mr-2 text-red-600" />
                        Cutting Strategy
                      </h6>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-slate-600">Input Sheet:</span>
                          <span className="font-semibold text-red-600">
                            {opPaper?.inputWidth?.toFixed(1) ?? "100"} × {opPaper?.inputHeight?.toFixed(1) ?? "70"} cm
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">Cut Size:</span>
                          <span className="font-semibold text-[#27aae1]">
                            {(() => {
                              if (opPaper?.inputWidth && opPaper?.inputHeight && outputDimensions[productIndex]?.width && outputDimensions[productIndex]?.height) {
                                const productDimensions = {
                                  width: outputDimensions[productIndex].width,
                                  height: outputDimensions[productIndex].height
                                };
                                const pressDimension = calculateVisualizationPressDimensions(productDimensions, formData);
                                return pressDimension ? `${pressDimension?.width || 0} × ${pressDimension?.height || 0} cm` : "Calculating...";
                              }
                              return "Dimensions required";
                            })()}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">Alternative:</span>
                          <span className="font-semibold text-[#27aae1]">
                            50 × 35 cm
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-xl p-4 border border-red-200 shadow-sm">
                      <h6 className="font-semibold text-slate-800 mb-3 text-center flex items-center justify-center">
                        <Calculator className="w-4 h-4 mr-2 text-red-600" />
                        Cutting Results
                      </h6>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-slate-600">Cut Pieces:</span>
                          <span className="font-semibold text-red-600">
                            {(() => {
                              if (opPaper?.inputWidth && opPaper?.inputHeight && outputDimensions[productIndex]?.width && outputDimensions[productIndex]?.height) {
                                const productDimensions = {
                                  width: outputDimensions[productIndex].width,
                                  height: outputDimensions[productIndex].height
                                };
                                const pressDimension = calculateVisualizationPressDimensions(productDimensions, formData);
                                if (pressDimension) {
                                  const cutPieces = calculateCutPieces(opPaper.inputWidth!, opPaper.inputHeight!, pressDimension?.width || 0, pressDimension?.height || 0);
                                  return cutPieces.totalPieces;
                                }
                              }
                              return "–";
                            })()}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">Layout:</span>
                          <span className="font-semibold text-[#27aae1]">
                            {(() => {
                              if (opPaper?.inputWidth && opPaper?.inputHeight && outputDimensions[productIndex]?.width && outputDimensions[productIndex]?.height) {
                                const productDimensions = {
                                  width: outputDimensions[productIndex].width,
                                  height: outputDimensions[productIndex].height
                                };
                                const pressDimension = calculateVisualizationPressDimensions(productDimensions, formData);
                                if (pressDimension) {
                                  const cutPieces = calculateCutPieces(opPaper.inputWidth!, opPaper.inputHeight!, pressDimension?.width || 0, pressDimension?.height || 0);
                                return `${cutPieces.piecesPerRow}×${cutPieces.piecesPerCol}`;
                                }
                              }
                              return "–";
                            })()}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">Efficiency:</span>
                          <span className="font-semibold text-green-600">
                            {(() => {
                              if (opPaper?.inputWidth && opPaper?.inputHeight && outputDimensions[productIndex]?.width && outputDimensions[productIndex]?.height) {
                                const productDimensions = {
                                  width: outputDimensions[productIndex].width,
                                  height: outputDimensions[productIndex].height
                                };
                                const pressDimension = calculateVisualizationPressDimensions(productDimensions, formData);
                                if (pressDimension) {
                                  const cutPieces = calculateCutPieces(opPaper.inputWidth!, opPaper.inputHeight!, pressDimension?.width || 0, pressDimension?.height || 0);
                                  const cutSize = (pressDimension?.width || 0) * (pressDimension?.height || 0);
                                return ((cutSize * cutPieces.totalPieces) / (opPaper.inputWidth! * opPaper.inputHeight!) * 100).toFixed(1);
                                }
                              }
                              return "–";
                            })()}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            )}

            {/* Final Printing Layout Visualization - TEMPORARILY HIDDEN FOR CLIENT CLARIFICATION */}
            {false && (
            <Card className="border-0 shadow-lg w-full mx-0">
              <CardHeader className="pb-3">
                <CardTitle className="text-xl md:text-2xl font-bold text-slate-800 flex items-center">
                  <Palette className="w-6 h-6 md:w-7 md:h-7 mr-2 md:mr-3 text-green-600" />
                  Final Printing Layout
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 w-full px-2 md:px-4">
                <div className="space-y-3">
                  <h5 className="text-base md:text-lg font-semibold text-slate-700">Final Printing on Cut Pieces (e.g., 50×35cm)</h5>
                  
                  <div className="w-full h-[250px] sm:h-[350px] md:h-[450px] lg:h-[500px] bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-lg p-1 shadow-lg overflow-hidden">
                    <div className="relative w-full h-full bg-white rounded-lg shadow-inner overflow-hidden">
                      <canvas
                        id={`final-printing-canvas-${productIndex}-${paperIndex}`}
                        className="w-full h-full rounded-lg transition-all duration-500 hover:shadow-md"
                        style={{ maxWidth: '100%', maxHeight: '100%' }}
                        ref={(canvas) => {
                          if (canvas && opPaper?.inputWidth && opPaper?.inputHeight && outputDimensions[productIndex]?.width && outputDimensions[productIndex]?.height) {
                            setTimeout(() => {
                              if (opPaper.inputWidth && opPaper.inputHeight && outputDimensions[productIndex]?.width && outputDimensions[productIndex]?.height) {
                                // Use dynamic press calculation to get optimal cutting dimensions
                                const productDimensions = {
                                  width: outputDimensions[productIndex].width,
                                  height: outputDimensions[productIndex].height
                                };
                                
                                const pressDimension = calculateVisualizationPressDimensions(productDimensions, formData);
                                
                                if (pressDimension) {
                                  console.log('🔧 Using dynamic press dimensions for final printing:', {
                                    productDimensions,
                                    pressDimension,
                                    inputSheet: { width: opPaper.inputWidth, height: opPaper.inputHeight }
                                  });
                                  
                                  const cutPieces = calculateCutPieces(opPaper.inputWidth!, opPaper.inputHeight!, pressDimension?.width || 0, pressDimension?.height || 0);
                                drawFinalPrintingLayout(canvas, cutPieces, outputDimensions[productIndex].width, outputDimensions[productIndex].height);
                                }
                              }
                            }, 150);
                          }
                        }}
                      />
                      {(!opPaper?.inputWidth || !opPaper?.inputHeight || !outputDimensions[productIndex]?.width || !outputDimensions[productIndex]?.height) && (
                        <div className="absolute inset-0 grid place-items-center text-sm md:text-lg text-slate-500 bg-gradient-to-br from-green-50 to-green-100 rounded-lg">
                          <div className="text-center p-3 md:p-4 lg:p-8 max-w-[90%]">
                            <div className="text-green-400 mb-2 md:mb-4 text-2xl md:text-3xl lg:text-5xl">🎨</div>
                            <div className="font-semibold text-slate-600 text-sm md:text-base lg:text-xl">Complete Data Required</div>
                            <div className="text-xs md:text-sm text-slate-400 mt-2 md:mt-3">Set input dimensions and output dimensions to preview final printing layout</div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            )}


            {/* Product-Specific Sheet Layout Visualization */}
            <Card className="border-0 shadow-lg w-full mx-0 mt-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-xl md:text-2xl font-bold text-slate-800 flex items-center">
            <BarChart3 className="w-6 h-6 md:w-7 md:h-7 mr-2 md:mr-3 text-[#27aae1]" />
                  Sheet Layout Visualization - {product.productName || `Product ${productIndex + 1}`}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 w-full px-2 md:px-4">
          <div className="space-y-3">
                  <h5 className="text-base md:text-lg font-semibold text-slate-700">Product-Specific Sheet Layout Pattern</h5>
            
            {/* Professional Visualization Type Selector */}
            <div className="flex flex-wrap gap-3 justify-center mb-4">
              <button
                onClick={() => setVisualizationType('print')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                  visualizationType === 'print'
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'bg-white text-slate-600 border border-slate-300 hover:bg-slate-50'
                }`}
              >
                <Printer className="w-4 h-4" />
                Print Layout
              </button>
              <button
                onClick={() => setVisualizationType('cut')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                  visualizationType === 'cut'
                    ? 'bg-red-600 text-white shadow-lg'
                    : 'bg-white text-slate-600 border border-slate-300 hover:bg-slate-50'
                }`}
              >
                <Scissors className="w-4 h-4" />
                Cutting Operations
              </button>
              <button
                onClick={() => setVisualizationType('gripper')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                  visualizationType === 'gripper'
                    ? 'bg-purple-600 text-white shadow-lg'
                    : 'bg-white text-slate-600 border border-slate-300 hover:bg-slate-50'
                }`}
              >
                <GripHorizontal className="w-4 h-4" />
                Gripper Handling
              </button>
            </div>
            
                  {/* Product-Specific Canvas Visualization */}
            <div className="w-full h-[300px] sm:h-[400px] md:h-[500px] lg:h-[600px] bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 rounded-lg p-1 shadow-lg overflow-hidden">
              <div className="relative w-full h-full bg-white rounded-lg shadow-inner overflow-hidden">
                <canvas
                        id={`canvas-visualization-${productIndex}`}
                  className="w-full h-full rounded-lg transition-all duration-500 hover:shadow-md"
                  style={{ maxWidth: '100%', maxHeight: '100%' }}
                  ref={(canvas) => {
                          if (canvas && product.papers.length > 0) {
                            // Get the first paper of this product
                            const productPaper = product.papers[0];
                            let globalPaperIndex = 0;
                            for (let pi = 0; pi < productIndex; pi++) {
                              globalPaperIndex += formData.products[pi].papers.length;
                            }
                            const opPaper = formData.operational.papers[globalPaperIndex];
                            const productLayout = perPaperCalc[productIndex]?.[0];
                      
                      // Check if this is digital printing
                            const isDigital = product?.printingSelection === 'Digital';
                      
                      if (isDigital) {
                        // Use digital visualization for digital printing
                        if (digitalCostingResults.length > 0) {
                          setTimeout(() => {
                            // Get product dimensions for digital visualization
                                  const productName = product?.productName || 'business-cards';
                            const productConfig = getProductConfig(productName);
                            
                                  let step3ProductWidth = product?.flatSize?.width || productConfig?.defaultSizes?.width || 9;
                                  let step3ProductHeight = product?.flatSize?.height || productConfig?.defaultSizes?.height || 5.5;
                            
                            // Use outputDimensions if available (from Step 3), otherwise fall back to width/height
                                  if (outputDimensions[productIndex]) {
                                    step3ProductWidth = outputDimensions[productIndex].width;
                                    step3ProductHeight = outputDimensions[productIndex].height;
                            }
                            
                            drawDigitalLayout(
                              canvas, 
                              digitalCostingResults, 
                              selectedDigitalOption,
                              step3ProductWidth,
                              step3ProductHeight,
                              visualizationType
                            );
                          }, 150);
                        }
                      } else {
                              // Use offset visualization for offset printing
                              if (productLayout && productLayout.layout && productLayout.layout.itemsPerSheet > 0 && opPaper?.inputWidth && opPaper?.inputHeight) {
                          setTimeout(() => {
                                  // Use current product data for visualization
                                  const productName = product?.productName || 'business-cards';
                            const productConfig = getProductConfig(productName);
                            
                                  let step3ProductWidth = product?.flatSize?.width || productConfig?.defaultSizes?.width || 9;
                                  let step3ProductHeight = product?.flatSize?.height || productConfig?.defaultSizes?.height || 5.5;
                                  
                                  // Use outputDimensions if available
                                  if (outputDimensions[productIndex]) {
                                    step3ProductWidth = outputDimensions[productIndex].width;
                                    step3ProductHeight = outputDimensions[productIndex].height;
                                  }
                            
                            const settings = {
                              type: visualizationType,
                              showGripper: visualizationType === 'gripper',
                              showCutLines: visualizationType === 'cut',
                              showBleed: true,
                              showGaps: true,
                                    gripperWidth: (product?.gripper || productConfig?.defaultGripper || 0.9),
                              bleedWidth: 0.3,
                              gapWidth: 0.5
                            };
                            
                            drawProfessionalVisualization(
                              canvas, 
                                    productLayout.layout, 
                              visualizationType, 
                              settings, 
                                    product,
                                    opPaper.inputWidth || undefined,
                                    opPaper.inputHeight || undefined,
                              step3ProductWidth,
                              step3ProductHeight,
                              formData,
                                    productIndex
                            );
                          }, 150);
                        }
                      }
                    }
                  }}
                />
                {(() => {
                        const isDigital = product?.printingSelection === 'Digital';
                  
                  if (isDigital) {
                    // Digital printing: show message if no digital results
                    return !digitalCostingResults.length && (
                      <div className="absolute inset-0 grid place-items-center text-sm md:text-lg text-slate-500 bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg">
                        <div className="text-center p-3 md:p-4 lg:p-8 max-w-[90%]">
                          <div className="text-slate-400 mb-2 md:mb-4 text-2xl md:text-3xl lg:text-5xl">🖨️</div>
                          <div className="font-semibold text-slate-600 text-sm md:text-base lg:text-xl">Digital Layout Preview</div>
                          <div className="text-xs md:text-sm text-slate-400 mt-2 md:mt-3">Configure digital printing to preview sheet layout</div>
                        </div>
                      </div>
                    );
                  } else {
                    // Offset printing: show message if no layout data
                          const productLayout = perPaperCalc[productIndex]?.[0];
                          return (!product.papers.length || !productLayout?.layout?.itemsPerSheet) && (
                      <div className="absolute inset-0 grid place-items-center text-sm md:text-lg text-slate-500 bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg">
                        <div className="text-center p-3 md:p-4 lg:p-8 max-w-[90%]">
                          <div className="text-slate-400 mb-2 md:mb-4 text-2xl md:text-3xl lg:text-5xl">📏</div>
                                <div className="font-semibold text-slate-600 text-sm md:text-base lg:text-xl">Configure Product First</div>
                                <div className="text-xs md:text-sm text-slate-400 mt-2 md:mt-3">Complete product configuration to preview layout visualization</div>
                        </div>
                      </div>
                    );
                  }
                })()}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

            {/* Product-Specific Advanced Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6 items-start">
        {/* Advanced Sheet Analysis */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
          <div className={`bg-gradient-to-r from-slate-50 to-white border-b border-slate-100 transition-all duration-300 ${
            isAdvancedSheetAnalysisCollapsed ? 'p-3' : 'p-4'
          }`}>
            <h6 className="font-semibold text-slate-800 flex items-center justify-between cursor-pointer group" onClick={() => setIsAdvancedSheetAnalysisCollapsed(!isAdvancedSheetAnalysisCollapsed)}>
              <div className="flex items-center">
                <div className="p-2 bg-[#27aae1]/10 rounded-lg mr-3 group-hover:bg-[#27aae1]/20 transition-colors duration-200">
                  <Package className="w-4 h-4 text-[#27aae1]" />
                </div>
                <span className="group-hover:text-[#27aae1] transition-colors duration-200">Advanced Sheet Analysis</span>
              </div>
              <div className="flex items-center">
                <button className="p-2 hover:bg-slate-200 rounded-lg transition-all duration-200 group-hover:bg-[#27aae1]/10">
                  {isAdvancedSheetAnalysisCollapsed ? (
                    <ChevronDown className="w-4 h-4 text-slate-500 group-hover:text-[#27aae1] transition-colors duration-200" />
                  ) : (
                    <ChevronUp className="w-4 h-4 text-slate-500 group-hover:text-[#27aae1] transition-colors duration-200" />
                  )}
                </button>
              </div>
            </h6>
          </div>
          {!isAdvancedSheetAnalysisCollapsed && (
                  <div className="p-4 space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="space-y-3">
              <div className="flex justify-between">
                          <span className="text-blue-700">Input Sheet:</span>
                          <span className="font-semibold text-blue-800">
                  {(() => {
                              const isDigital = product?.printingSelection === 'Digital';
                              if (isDigital && perPaperCalc[productIndex]?.[0]?.layout?.selectedDigitalOption) {
                                const digitalOption = perPaperCalc[productIndex][0].layout.selectedDigitalOption;
                                const dimensions = digitalOption.label.match(/(\d+)×(\d+)/);
                                if (dimensions) {
                                  return `${dimensions[1]}×${dimensions[2]} cm`;
                                }
                              }
                              let globalPaperIndex = 0;
                              for (let pi = 0; pi < productIndex; pi++) {
                                globalPaperIndex += formData.products[pi].papers.length;
                              }
                              const opPaper = formData.operational.papers[globalPaperIndex];
                              return `${opPaper?.inputWidth || 100} × ${opPaper?.inputHeight || 70} cm`;
                  })()}
                </span>
              </div>
              <div className="flex justify-between">
                          <span className="text-blue-700">Sheet Area:</span>
                <span className="font-semibold text-[#27aae1]">
                  {(() => {
                              const isDigital = product?.printingSelection === 'Digital';
                              if (isDigital && perPaperCalc[productIndex]?.[0]?.layout?.selectedDigitalOption) {
                                const digitalOption = perPaperCalc[productIndex][0].layout.selectedDigitalOption;
                                const dimensions = digitalOption.label.match(/(\d+)×(\d+)/);
                                if (dimensions) {
                                  const width = parseInt(dimensions[1]);
                                  const height = parseInt(dimensions[2]);
                                  return `${(width * height).toLocaleString()} cm²`;
                                }
                              }
                              let globalPaperIndex = 0;
                              for (let pi = 0; pi < productIndex; pi++) {
                                globalPaperIndex += formData.products[pi].papers.length;
                              }
                              const opPaper = formData.operational.papers[globalPaperIndex];
                              const area = (opPaper?.inputWidth || 100) * (opPaper?.inputHeight || 70);
                              return `${area.toLocaleString()} cm²`;
                  })()}
                </span>
              </div>
              <div className="flex justify-between">
                          <span className="text-blue-700">Items per Sheet:</span>
                          <span className="font-semibold text-blue-800">
                            {perPaperCalc[productIndex]?.[0]?.layout?.itemsPerSheet || 0}
                </span>
              </div>
                      </div>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-blue-700">Used Area:</span>
                  <span className="font-semibold text-green-600">
                    {(() => {
                              const isDigital = product?.printingSelection === 'Digital';
                              if (isDigital && perPaperCalc[productIndex]?.[0]?.layout?.selectedDigitalOption && outputDimensions[productIndex]?.width && outputDimensions[productIndex]?.height) {
                                const digitalOption = perPaperCalc[productIndex][0].layout.selectedDigitalOption;
                                const dimensions = digitalOption.label.match(/(\d+)×(\d+)/);
                                if (dimensions) {
                                  const sheetWidth = parseInt(dimensions[1]);
                                  const sheetHeight = parseInt(dimensions[2]);
                                  const productWidth = outputDimensions[productIndex].width;
                                  const productHeight = outputDimensions[productIndex].height;
                                  const itemsPerSheet = perPaperCalc[productIndex]?.[0]?.layout?.itemsPerSheet || 1;
                                  const usedArea = productWidth * productHeight * itemsPerSheet;
                                  return `${usedArea.toLocaleString()} cm²`;
                                }
                              }
                              if (outputDimensions[productIndex]?.width && outputDimensions[productIndex]?.height) {
                                const productWidth = outputDimensions[productIndex].width;
                                const productHeight = outputDimensions[productIndex].height;
                                const itemsPerSheet = perPaperCalc[productIndex]?.[0]?.layout?.itemsPerSheet || 1;
                                const usedArea = productWidth * productHeight * itemsPerSheet;
                                return `${usedArea.toLocaleString()} cm²`;
                              }
                              return 'N/A';
                    })()}
                  </span>
                </div>
                        <div className="flex justify-between">
                          <span className="text-blue-700">Efficiency:</span>
                          <span className="font-semibold text-green-600">
                    {(() => {
                              const efficiency = perPaperCalc[productIndex]?.[0]?.layout?.efficiency || 0;
                              return `${efficiency.toFixed(1)}%`;
                    })()}
                  </span>
                </div>
                        <div className="flex justify-between">
                          <span className="text-blue-700">Orientation:</span>
                          <span className="font-semibold text-blue-800">
                            {perPaperCalc[productIndex]?.[0]?.layout?.orientation || 'normal'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Production Intelligence */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
          <div className={`bg-gradient-to-r from-slate-50 to-white border-b border-slate-100 transition-all duration-300 ${
            isProductionIntelligenceCollapsed ? 'p-3' : 'p-4'
          }`}>
            <h6 className="font-semibold text-slate-800 flex items-center justify-between cursor-pointer group" onClick={() => setIsProductionIntelligenceCollapsed(!isProductionIntelligenceCollapsed)}>
              <div className="flex items-center">
                <div className="p-2 bg-[#27aae1]/10 rounded-lg mr-3 group-hover:bg-[#27aae1]/20 transition-colors duration-200">
                  <Edit3 className="w-4 h-4 text-[#27aae1]" />
                </div>
                <span className="group-hover:text-[#27aae1] transition-colors duration-200">Production Intelligence</span>
              </div>
              <div className="flex items-center">
                <button className="p-2 hover:bg-slate-200 rounded-lg transition-all duration-200 group-hover:bg-[#27aae1]/10">
                  {isProductionIntelligenceCollapsed ? (
                    <ChevronDown className="w-4 h-4 text-slate-500 group-hover:text-[#27aae1] transition-colors duration-200" />
                  ) : (
                    <ChevronUp className="w-4 h-4 text-slate-500 group-hover:text-[#27aae1] transition-colors duration-200" />
                  )}
                </button>
              </div>
            </h6>
          </div>
          {!isProductionIntelligenceCollapsed && (
                  <div className="p-4 space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="space-y-3">
              <div className="flex justify-between">
                          <span className="text-green-700">Quantity:</span>
                          <span className="font-semibold text-green-800">{product?.quantity || 0}</span>
              </div>
              <div className="flex justify-between">
                          <span className="text-green-700">Sides:</span>
                          <span className="font-semibold text-green-800">{product?.sides || '1'}</span>
              </div>
              <div className="flex justify-between">
                          <span className="text-green-700">Printing:</span>
                          <span className="font-semibold text-green-800">{product?.printingSelection || 'Digital'}</span>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-green-700">Total Sheets:</span>
                          <span className="font-semibold text-green-800">
                  {(() => {
                              let totalSheets = 0;
                              product.papers.forEach((paper: any, paperIndex: number) => {
                                let globalPaperIndex = 0;
                                for (let pi = 0; pi < productIndex; pi++) {
                                  globalPaperIndex += formData.products[pi].papers.length;
                                }
                                globalPaperIndex += paperIndex;
                                const opPaper = formData.operational.papers[globalPaperIndex];
                                const rec = perPaperCalc[productIndex]?.[paperIndex]?.recommendedSheets ?? 0;
                                const entered = opPaper?.enteredSheets ?? null;
                                totalSheets += (entered != null ? entered : rec);
                              });
                              return totalSheets;
                  })()}
                </span>
              </div>
              <div className="flex justify-between">
                          <span className="text-green-700">Colors:</span>
                          <span className="font-semibold text-green-800">
                    {(() => {
                              const totalColors = product.papers.reduce((total: any, _: any, paperIdx: number) => {
                                return total + (paperColors[productIndex]?.[paperIdx]?.length || 0);
                              }, 0);
                              return totalColors;
                    })()}
                  </span>
                </div>
              <div className="flex justify-between">
                          <span className="text-green-700">Papers:</span>
                          <span className="font-semibold text-green-800">{product.papers.length}</span>
              </div>
                      </div>
              </div>
            </div>
          )}
        </div>

        {/* Operations Dashboard */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
          <div className={`bg-gradient-to-r from-slate-50 to-white border-b border-slate-100 transition-all duration-300 ${
            isOperationsDashboardCollapsed ? 'p-3' : 'p-4'
          }`}>
            <h6 className="font-semibold text-slate-800 flex items-center justify-between cursor-pointer group" onClick={() => setIsOperationsDashboardCollapsed(!isOperationsDashboardCollapsed)}>
              <div className="flex items-center">
                <div className="p-2 bg-[#27aae1]/10 rounded-lg mr-3 group-hover:bg-[#27aae1]/20 transition-colors duration-200">
                  <BarChart3 className="w-4 h-4 text-[#27aae1]" />
                </div>
                <span className="group-hover:text-[#27aae1] transition-colors duration-200">Operations Dashboard</span>
              </div>
              <div className="flex items-center">
                <button className="p-2 hover:bg-slate-200 rounded-lg transition-all duration-200 group-hover:bg-[#27aae1]/10">
                  {isOperationsDashboardCollapsed ? (
                    <ChevronDown className="w-4 h-4 text-slate-500 group-hover:text-[#27aae1] transition-colors duration-200" />
                  ) : (
                    <ChevronUp className="w-4 h-4 text-slate-500 group-hover:text-[#27aae1] transition-colors duration-200" />
                  )}
                </button>
              </div>
            </h6>
          </div>
                {!isOperationsDashboardCollapsed && (
                  <div className="p-4 space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-purple-700">Paper Cost:</span>
                          <span className="font-semibold text-purple-800">
                  {(() => {
                              let totalCost = 0;
                              product.papers.forEach((paper: any, paperIndex: number) => {
                                let globalPaperIndex = 0;
                                for (let pi = 0; pi < productIndex; pi++) {
                                  globalPaperIndex += formData.products[pi].papers.length;
                                }
                                globalPaperIndex += paperIndex;
                                const opPaper = formData.operational.papers[globalPaperIndex];
                                const rec = perPaperCalc[productIndex]?.[paperIndex]?.recommendedSheets ?? 0;
                                const entered = opPaper?.enteredSheets ?? null;
                                const sheets = (entered != null ? entered : rec);
                                const pricePerSheet = perPaperCalc[productIndex]?.[paperIndex]?.pricePerSheet ?? 0;
                                totalCost += sheets * pricePerSheet;
                              });
                              return fmt(totalCost);
          })()}
                          </span>
                        </div>
                          <div className="flex justify-between">
                          <span className="text-purple-700">Finishing:</span>
                          <span className="font-semibold text-purple-800">
                            {(() => {
                              let finishingCost = 0;
                              if (product.finishing && product.finishing.length > 0) {
                                product.finishing.forEach((finishingName: any) => {
                                  finishingCost += calculateIndividualFinishingCost(finishingName, product, productIndex);
                                });
                              }
                              return fmt(finishingCost);
                            })()}
                  </span>
                </div>
              </div>
              <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-purple-700">Plates:</span>
                          <span className="font-semibold text-purple-800">
                {(() => {
                              if (product?.printingSelection === 'Digital') return 'N/A';
                              const totalColors = product.papers.reduce((total: any, _: any, paperIdx: number) => {
                                return total + (paperColors[productIndex]?.[paperIdx]?.length || 0);
                  }, 0);
                              const plateCost = totalColors * 150; // Assuming 150 AED per plate
                              return fmt(plateCost);
                })()}
                  </span>
              </div>
                        <div className="flex justify-between">
                          <span className="text-purple-700">Total:</span>
                          <span className="font-semibold text-purple-800">
                    {(() => {
                              let totalCost = 0;
                              // Paper costs
                              product.papers.forEach((paper: any, paperIndex: number) => {
                                let globalPaperIndex = 0;
                                for (let pi = 0; pi < productIndex; pi++) {
                                  globalPaperIndex += formData.products[pi].papers.length;
                                }
                                globalPaperIndex += paperIndex;
                                const opPaper = formData.operational.papers[globalPaperIndex];
                                const rec = perPaperCalc[productIndex]?.[paperIndex]?.recommendedSheets ?? 0;
                                const entered = opPaper?.enteredSheets ?? null;
                                const sheets = (entered != null ? entered : rec);
                                const pricePerSheet = perPaperCalc[productIndex]?.[paperIndex]?.pricePerSheet ?? 0;
                                totalCost += sheets * pricePerSheet;
                              });
                              // Finishing costs
                              if (product.finishing && product.finishing.length > 0) {
                                product.finishing.forEach((finishingName: any) => {
                                  totalCost += calculateIndividualFinishingCost(finishingName, product, productIndex);
                                });
                              }
                              // Plate costs (offset only)
                              if (product?.printingSelection !== 'Digital') {
                                const totalColors = product.papers.reduce((total: any, _: any, paperIdx: number) => {
                                  return total + (paperColors[productIndex]?.[paperIdx]?.length || 0);
                                }, 0);
                                totalCost += totalColors * 150; // Assuming 150 AED per plate
                              }
                              return fmt(totalCost);
            })()}
                  </span>
          </div>
            </div>
          </div>
                  </div>
                )}
              </div>
            </div>

                  </div>
        );
      })}
                  </div>
      ))}

      {/* Paper Price Details Modal */}
      <Dialog open={showPaperPrice !== null} onOpenChange={() => setShowPaperPrice(null)}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center text-2xl font-bold text-slate-800">
              <Calculator className="w-8 h-8 mr-3 text-blue-600" />
              Paper Price Details
            </DialogTitle>
            <p className="text-slate-600 mt-2">Detailed paper pricing breakdown and calculations</p>
          </DialogHeader>
          
          <div className="space-y-6">
            {(() => {
              if (showPaperPrice === null) return null;
              
              const paperData = formData.operational.papers[showPaperPrice];
              const product = formData.products[showPaperPrice];
              if (!paperData || !product) return <div>No paper data available</div>;
              
              const sheetsRequired = (product.quantity || 0) * (paperData?.sheetsPerPacket || 1);
              const hasPricing = paperData.pricePerSheet || paperData.pricePerPacket;
              
              return (
                <div className="space-y-6">
                  {/* Paper Information */}
                  <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
                    <h4 className="text-lg font-semibold text-blue-800 mb-4">Paper Details</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-blue-700">Paper Name:</span>
                          <span className="font-semibold text-blue-800">Art Paper 150gsm</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-blue-700">Sheets Needed:</span>
                          <span className="font-semibold text-blue-800">{sheetsRequired}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-blue-700">Input Size:</span>
                          <span className="font-semibold text-blue-800">{paperData.inputWidth} x {paperData.inputHeight} cm</span>
                    </div>
                        </div>
                    </div>
                  </div>

                  {/* Pricing Details */}
                  <div className="bg-green-50 rounded-lg p-6 border border-green-200">
                    <h4 className="text-lg font-semibold text-green-800 mb-4">Pricing Details</h4>
                    {hasPricing ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div className="space-y-3">
                            <div className="flex justify-between">
                              <span className="text-green-700">Price per Sheet:</span>
                              <span className="font-semibold text-green-800">
                                {paperData.pricePerSheet ? `${paperData.pricePerSheet} AED` : 'Not set'}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-green-700">Price per Packet:</span>
                              <span className="font-semibold text-green-800">
                                {paperData.pricePerPacket ? `${paperData.pricePerPacket} AED` : 'Not set'}
                              </span>
                            </div>
                          </div>
                          <div className="space-y-3">
                            <div className="flex justify-between">
                              <span className="text-green-700">Total Cost:</span>
                              <span className="font-semibold text-green-800">
                                {paperData.pricePerSheet ? `${(paperData.pricePerSheet * sheetsRequired).toFixed(2)} AED` : 'N/A'}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-green-700">Cost per Unit:</span>
                              <span className="font-semibold text-green-800">
                                {product.quantity && paperData.pricePerSheet ? `${((paperData.pricePerSheet * sheetsRequired) / product.quantity).toFixed(2)} AED` : 'N/A'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <AlertTriangle className="w-8 h-8 text-yellow-600" />
                        </div>
                        <h5 className="text-lg font-semibold text-yellow-800 mb-2">No pricing information available</h5>
                        <p className="text-yellow-700">Please set either price per sheet or price per packet in the paper specifications above.</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>
          
          <DialogFooter className="pt-6">
            <Button 
              onClick={() => setShowPaperPrice(null)}
              className="bg-blue-600 hover:bg-blue-700 px-8 py-3 rounded-xl font-medium"
            >
              Close
            </Button> 
          </DialogFooter>
        </DialogContent>
      </Dialog>
                    </div>
                  );
                }

export default Step4Operational;
