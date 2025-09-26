export interface ProductConfig {
  name: string;
  category: '2D' | '3D';
  defaultSizes: {
    width: number;
    height: number;
    spine: number;
  };
  defaultColors: {
    front: string;
    back: string;
  };
  defaultPaper: string;
  defaultGSM: string;
  defaultPrinting: 'Digital' | 'Offset';
  defaultSides: '1' | '2';
  showSpine: boolean;
  // New fields for special handling
  sizeUnit: 'cm' | 'oz';
  defaultBleed: number; // in cm
  defaultGap: number; // in cm
  defaultGripper: number; // in cm
  defaultOtherEdges: number; // in cm
  // Special handling for cups
  cupSizes?: {
    oz: number;
    bboxWidth: number;
    bboxHeight: number;
  }[];
  // Special handling for shopping bags
  bagPresets?: {
    name: string;
    width: number;
    height: number;
    gusset: number;
  }[];
  // Imposition settings
  impositionSettings?: {
    allowRotate: boolean;
    staggerForDie: boolean;
    mirrorEveryOtherRow?: boolean;
  };
}

export const PRODUCT_CONFIGS: Record<string, ProductConfig> = {
  'Business Card': {
    name: 'Business Card',
    category: '2D',
    defaultSizes: { width: 9, height: 5.5, spine: 0 },
    defaultColors: { front: '4 Colors (CMYK)', back: '4 Colors (CMYK)' },
    defaultPaper: 'Premium Card Stock',
    defaultGSM: '350',
    defaultPrinting: 'Digital',
    defaultSides: '1',
    showSpine: false,
    sizeUnit: 'cm',
    defaultBleed: 0.3, // 3mm
    defaultGap: 0.6, // 6mm
    defaultGripper: 0.9,
    defaultOtherEdges: 0.5,
    impositionSettings: {
      allowRotate: true,
      staggerForDie: false
    }
  },
  'Flyer A5': {
    name: 'Flyer A5',
    category: '2D',
    defaultSizes: { width: 14.8, height: 21, spine: 0 },
    defaultColors: { front: '4 Colors (CMYK)', back: '4 Colors (CMYK)' },
    defaultPaper: 'Art Paper',
    defaultGSM: '150',
    defaultPrinting: 'Digital',
    defaultSides: '2',
    showSpine: false,
    sizeUnit: 'cm',
    defaultBleed: 0.3, // 3mm
    defaultGap: 0.5,
    defaultGripper: 0.9,
    defaultOtherEdges: 0.5,
    impositionSettings: {
      allowRotate: true,
      staggerForDie: false
    }
  },
  'Flyer A6': {
    name: 'Flyer A6',
    category: '2D',
    defaultSizes: { width: 10.5, height: 14.8, spine: 0 },
    defaultColors: { front: '4 Colors (CMYK)', back: '4 Colors (CMYK)' },
    defaultPaper: 'Art Paper',
    defaultGSM: '150',
    defaultPrinting: 'Digital',
    defaultSides: '2',
    showSpine: false,
    sizeUnit: 'cm',
    defaultBleed: 0.3, // 3mm
    defaultGap: 0.5,
    defaultGripper: 0.9,
    defaultOtherEdges: 0.5,
    impositionSettings: {
      allowRotate: true,
      staggerForDie: false
    }
  },
  'Cups': {
    name: 'Cups',
    category: '3D',
    defaultSizes: { width: 23, height: 9, spine: 0 }, // Default 8oz size
    defaultColors: { front: '4 Colors (CMYK)', back: '4 Colors (CMYK)' },
    defaultPaper: 'Cup Stock',
    defaultGSM: '200',
    defaultPrinting: 'Digital',
    defaultSides: '1',
    showSpine: false,
    sizeUnit: 'oz',
    defaultBleed: 0.5,
    defaultGap: 0.6, // Special gap for cups
    defaultGripper: 0.9,
    defaultOtherEdges: 0.5,
    cupSizes: [
      { oz: 4, bboxWidth: 20, bboxHeight: 8 },
      { oz: 6, bboxWidth: 22, bboxHeight: 8.5 },
      { oz: 8, bboxWidth: 23, bboxHeight: 9 },
      { oz: 12, bboxWidth: 26, bboxHeight: 10 }
    ],
    impositionSettings: {
      allowRotate: true,
      staggerForDie: true,
      mirrorEveryOtherRow: true
    }
  },
  'Shopping Bag': {
    name: 'Shopping Bag',
    category: '3D',
    defaultSizes: { width: 25, height: 35, spine: 0 }, // Default Medium size
    defaultColors: { front: '4 Colors (CMYK)', back: '4 Colors (CMYK)' },
    defaultPaper: 'Kraft Paper',
    defaultGSM: '120',
    defaultPrinting: 'Offset',
    defaultSides: '2',
    showSpine: false,
    sizeUnit: 'cm',
    defaultBleed: 0.5,
    defaultGap: 0.5,
    defaultGripper: 0.9,
    defaultOtherEdges: 0.5,
    bagPresets: [
      { name: 'Small', width: 18, height: 23, gusset: 8 },
      { name: 'Medium', width: 25, height: 35, gusset: 10 },
      { name: 'Large', width: 32, height: 43, gusset: 12 }
    ],
    impositionSettings: {
      allowRotate: true,
      staggerForDie: false
    }
  }
};

export const getProductConfig = (productName: string): ProductConfig | null => {
  return PRODUCT_CONFIGS[productName] || null;
};

export const is2DProduct = (productName: string): boolean => {
  const config = getProductConfig(productName);
  return config?.category === '2D';
};

export const shouldShowSpine = (productName: string): boolean => {
  const config = getProductConfig(productName);
  return config?.showSpine || false;
};

// New helper functions for special product handling
export const getCupSizeByOz = (oz: number): { width: number; height: number } | null => {
  const cupsConfig = PRODUCT_CONFIGS['Cups'];
  if (!cupsConfig?.cupSizes) return null;
  
  const cupSize = cupsConfig.cupSizes.find(size => size.oz === oz);
  return cupSize ? { width: cupSize.bboxWidth, height: cupSize.bboxHeight } : null;
};

export const getShoppingBagPreset = (presetName: string): { width: number; height: number; gusset: number } | null => {
  const bagConfig = PRODUCT_CONFIGS['Shopping Bag'];
  if (!bagConfig?.bagPresets) return null;
  
  const preset = bagConfig.bagPresets.find(p => p.name === presetName);
  return preset ? { width: preset.width, height: preset.height, gusset: preset.gusset } : null;
};
