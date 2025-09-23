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
  defaultPrinting: 'Digital' | 'Offset' | 'Either' | 'Both';
  defaultSides: '1' | '2';
  showSpine: boolean;
}

export const PRODUCT_CONFIGS: Record<string, ProductConfig> = {
  'Business Card': {
    name: 'Business Card',
    category: '2D',
    defaultSizes: { width: 9, height: 5.5, spine: 0 },
    defaultColors: { front: '4 Colors (CMYK)', back: '1 Color' },
    defaultPaper: 'Premium Card Stock',
    defaultGSM: '350',
    defaultPrinting: 'Digital',
    defaultSides: '1',
    showSpine: false
  },
  'Flyer A5': {
    name: 'Flyer A5',
    category: '2D',
    defaultSizes: { width: 14.8, height: 21, spine: 0 },
    defaultColors: { front: '4 Colors (CMYK)', back: '1 Color' },
    defaultPaper: 'Art Paper',
    defaultGSM: '150',
    defaultPrinting: 'Digital',
    defaultSides: '2',
    showSpine: false
  },
  'Brochure': {
    name: 'Brochure',
    category: '2D',
    defaultSizes: { width: 21, height: 29.7, spine: 0 },
    defaultColors: { front: '4 Colors (CMYK)', back: '4 Colors (CMYK)' },
    defaultPaper: 'Coated Paper',
    defaultGSM: '200',
    defaultPrinting: 'Offset',
    defaultSides: '2',
    showSpine: false
  },
  'Book': {
    name: 'Book',
    category: '2D',
    defaultSizes: { width: 21, height: 29.7, spine: 1 },
    defaultColors: { front: '4 Colors (CMYK)', back: '4 Colors (CMYK)' },
    defaultPaper: 'Book Paper',
    defaultGSM: '120',
    defaultPrinting: 'Offset',
    defaultSides: '2',
    showSpine: true
  },
  'Poster': {
    name: 'Poster',
    category: '2D',
    defaultSizes: { width: 42, height: 59.4, spine: 0 },
    defaultColors: { front: '4 Colors (CMYK)', back: '1 Color' },
    defaultPaper: 'Glossy Paper',
    defaultGSM: '200',
    defaultPrinting: 'Offset',
    defaultSides: '2',
    showSpine: false
  },
  'Letterhead': {
    name: 'Letterhead',
    category: '2D',
    defaultSizes: { width: 21, height: 29.7, spine: 0 },
    defaultColors: { front: '1 Color', back: '1 Color' },
    defaultPaper: 'Bond Paper',
    defaultGSM: '100',
    defaultPrinting: 'Digital',
    defaultSides: '1',
    showSpine: false
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
