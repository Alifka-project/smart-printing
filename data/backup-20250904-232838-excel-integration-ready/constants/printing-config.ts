import type { Cm, MarginsCm } from '../types';

// === Shop Rules ===
export const PARENT = { w: 100, h: 70 } as const; // 100×70 cm
export const PRESS_35x50 = { w: 35, h: 50, label: "35×50 cm" } as const;
export const PRESS_52x72 = { w: 52, h: 72, label: "52×72 cm" } as const; // disabled for parent 100×70

// === Margins ===
export const MARGINS: MarginsCm = { 
  left: 0.5, 
  right: 0.5, 
  top: 0.5, 
  bottom: 0.5, 
  gripperTop: 0.9 
}; // cm

// === Defaults ===
export const DEFAULT_BLEED: Cm = 0.5; // cm
export const DEFAULT_GAP: Cm = 0.5; // cm
export const CUPS_GAP: Cm = 0.6; // cm (special for cups)

// === Digital Cut-Size Options ===
export const DIGITAL_OPTIONS = [
  { w: 48, h: 33, label: "48×33 cm" },
  { w: 70, h: 33, label: "70×33 cm" },
  { w: 100, h: 33, label: "100×33 cm" }
] as const;

// === Validation Rules ===
export const MIN_BLEED: Cm = 0.3; // cm
export const MIN_GAP: Cm = 0.4; // cm

// === Cup Seam Overlap (cm) ===
export const CUP_SEAM_OVERLAP = {
  '4': 0.4, // 4 oz
  '6': 0.4, // 6 oz
  '8': 0.4, // 8 oz
  '12': 0.4 // 12 oz
} as const;

// === Shopping Bag Defaults ===
export const BAG_LIP: Cm = 3.0; // cm
export const BAG_GLUE_SEAM: Cm = 1.2; // cm

// === Helper Functions ===
export function cmToMm(cm: Cm): number {
  return Math.round(cm * 10);
}

export function mmToCm(mm: number): Cm {
  return mm / 10;
}

// === Press Per Parent Calculation ===
export function pressPerParent(parent: { w: Cm; h: Cm }, press: { w: Cm; h: Cm }): number {
  const fitCount = (pw: number, ph: number, sw: number, sh: number) => 
    Math.floor(pw / sw) * Math.floor(ph / sh);
  
  const a = fitCount(parent.w, parent.h, press.w, press.h);
  const b = fitCount(parent.w, parent.h, press.h, press.w);
  return Math.max(a, b);
}

// === Check if press is enabled for parent ===
export function isPressEnabled(press: { w: Cm; h: Cm }): boolean {
  return pressPerParent(PARENT, press) > 0;
}
