"use client";

import React, { type FC, Dispatch, SetStateAction } from "react";
import { Plus, X, Trash2, Ruler, FileText, Settings, Eye, Palette, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState, useEffect } from "react";
import type { QuoteFormData, Paper, Product, DigitalPricing, OffsetPricing, DigitalCostingResult, OffsetCostingResult } from "@/types";
import { getProductConfig, shouldShowSpine, PRODUCT_CONFIGS, getCupSizeByOz, getShoppingBagPreset } from "@/constants/product-config";
import { PricingService } from "@/lib/pricing-service";
import { calcDigitalCosting, calcOffsetCosting } from "@/lib/imposition";

// Add custom styles to ensure dropdowns are not transparent and improve scrollbars
const customDropdownStyles = `
  /* Fix dropdown transparency */
  .SelectContent {
    background-color: white !important;
    border: 1px solid #e5e7eb !important;
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05) !important;
  }
  .SelectItem {
    background-color: white !important;
  }
  .SelectItem:hover {
    background-color: #f3f4f6 !important;
  }
  [data-radix-select-content] {
    background-color: white !important;
    border: 1px solid #e5e7eb !important;
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05) !important;
  }
  [data-radix-select-item] {
    background-color: white !important;
  }
  [data-radix-select-item]:hover {
    background-color: #f3f4f6 !important;
  }
  
  /* Enhanced dropdown styling */
  .select-content {
    background-color: white !important;
    border: 1px solid #e5e7eb !important;
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05) !important;
  }
  .select-item {
    background-color: white !important;
  }
  .select-item:hover {
    background-color: #f3f4f6 !important;
  }
  
  /* Custom scrollbar styling for all dropdowns */
  .dropdown-scroll::-webkit-scrollbar {
    width: 8px;
  }
  .dropdown-scroll::-webkit-scrollbar-track {
    background: #f1f5f9;
    border-radius: 4px;
  }
  .dropdown-scroll::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 4px;
  }
  .dropdown-scroll::-webkit-scrollbar-thumb:hover {
    background: #94a3b8;
  }
  
  /* Firefox scrollbar */
  .dropdown-scroll {
    scrollbar-width: thin;
    scrollbar-color: #cbd5e1 #f1f5f9;
  }
  
  /* Paper details scrollbar */
  .paper-details-scroll::-webkit-scrollbar {
    width: 8px;
  }
  .paper-details-scroll::-webkit-scrollbar-track {
    background: #f1f5f9;
    border-radius: 4px;
  }
  .paper-details-scroll::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 4px;
  }
  .paper-details-scroll::-webkit-scrollbar-thumb:hover {
    background: #94a3b8;
  }
  
  .paper-details-scroll {
    scrollbar-width: thin;
    scrollbar-color: #cbd5e1 #f1f5f9;
  }
`;

// Standard product list for proper recording - limited to 5 products
const STANDARD_PRODUCTS = ['Business Card', 'Flyer A5', 'Flyer A6', 'Cups', 'Shopping Bag'];



// helper product kosong (sesuai tipe Product)
const createEmptyProduct = (): Product => {
  const defaultConfig = getProductConfig("Business Card");
  return {
    productName: "Business Card", // Set a default product so sizes are auto-populated
    paperName: "",
    quantity: 100,
    sides: defaultConfig?.defaultSides || "1",
    printingSelection: defaultConfig?.defaultPrinting || "Digital",
    flatSize: defaultConfig?.defaultSizes || { width: 9, height: 5.5, spine: 0 },
    closeSize: defaultConfig?.defaultSizes || { width: 9, height: 5.5, spine: 0 },
    useSameAsFlat: true,
    papers: [{ name: "Select Paper", gsm: "Select GSM" }],
    finishing: [],
    finishingComments: '', // Comments for finishing details (e.g., "gold foil", "silver foil")
    colors: defaultConfig?.defaultColors || { front: "", back: "" },
    // New fields with defaults
    cupSizeOz: undefined,
    bagPreset: undefined,
    gusset: undefined,
    bleed: defaultConfig?.defaultBleed || 0.3,
    gap: defaultConfig?.defaultGap || 0.6,
    gripper: defaultConfig?.defaultGripper || 0.9,
    otherEdges: defaultConfig?.defaultOtherEdges || 0.5
  };
};

interface Step3Props {
  formData: QuoteFormData;
  setFormData: Dispatch<SetStateAction<QuoteFormData>>;
}

const Step3ProductSpec: FC<Step3Props> = ({ formData, setFormData }) => {
  const [paperDetailsDialogOpen, setPaperDetailsDialogOpen] = useState(false);
  const [selectedPaperForDetails, setSelectedPaperForDetails] = useState<string>('');
  const [paperDetails, setPaperDetails] = useState<any>(null);
  const [loadingPaperDetails, setLoadingPaperDetails] = useState(false);
  const [availablePapers, setAvailablePapers] = useState<Array<{
    name: string;
    gsmOptions: string[];
    suppliers: string[];
  }>>([]);
  const [loadingPapers, setLoadingPapers] = useState(false);
  
  // === Costing State Management ===
  const [digitalPricing, setDigitalPricing] = useState<DigitalPricing | null>(null);
  const [offsetPricing, setOffsetPricing] = useState<OffsetPricing | null>(null);
  const [digitalCostingResults, setDigitalCostingResults] = useState<DigitalCostingResult[]>([]);
  const [offsetCostingResult, setOffsetCostingResult] = useState<OffsetCostingResult | null>(null);
  const [selectedDigitalOption, setSelectedDigitalOption] = useState<string>('');
  const [selectedOffsetPress, setSelectedOffsetPress] = useState<string>('');
  const [loadingPricing, setLoadingPricing] = useState(false);
  
  // Refs to prevent infinite loops
  const hasMatchedPapers = React.useRef(false);
  const hasInitializedProducts = React.useRef(false);
  const hasInitializedColors = React.useRef(false);
  
  // Debug logging for autofill - run when formData changes
  React.useEffect(() => {
    console.log('Step3ProductSpec received formData:', formData);
    if (formData.products && formData.products.length > 0) {
      formData.products.forEach((product, idx) => {
        console.log(`Product ${idx}:`, {
          name: product.productName,
          papers: product.papers,
          finishing: product.finishing,
          finishingLength: product.finishing ? product.finishing.length : 0,
          finishingType: typeof product.finishing,
          colors: product.colors
        });
        
        // Debug finishing options specifically
        if (product.finishing && product.finishing.length > 0) {
          console.log(`  Finishing options for Product ${idx}:`, product.finishing);
          product.finishing.forEach((finish, fIdx) => {
            console.log(`    Finishing ${fIdx}: "${finish}"`);
          });
        } else {
          console.log(`  No finishing options for Product ${idx}`);
        }
        
        // Debug paper details specifically
        if (product.papers && product.papers.length > 0) {
          product.papers.forEach((paper, pIdx) => {
            console.log(`  Paper ${pIdx}:`, {
              name: paper.name,
              gsm: paper.gsm,
              isCustom: !availablePapers.find(p => p.name === paper.name)
            });
          });
        }
      });
    }
  }, [formData]); // Run when formData changes
  
  // Ensure first product is properly initialized with config
  React.useEffect(() => {
    if (formData.products.length > 0 && !hasInitializedProducts.current) {
      const firstProduct = formData.products[0];
      const config = getProductConfig(firstProduct.productName);
      
      if (config && (
        !firstProduct.flatSize || 
        firstProduct.flatSize.width !== config.defaultSizes.width ||
        firstProduct.flatSize.height !== config.defaultSizes.height
      )) {
        console.log('🔄 Initializing first product with config:', config);
        updateProduct(0, {
          flatSize: config.defaultSizes,
          closeSize: config.defaultSizes,
          sides: config.defaultSides,
          printingSelection: config.defaultPrinting,
          colors: config.defaultColors,
          bleed: config.defaultBleed,
          gap: config.defaultGap,
          gripper: config.defaultGripper,
          otherEdges: config.defaultOtherEdges
        });
      }
      hasInitializedProducts.current = true;
    }
  }, [formData.products]);
  
  // Load pricing data on component mount
  useEffect(() => {
    const loadPricing = async () => {
      setLoadingPricing(true);
      try {
        const { digital, offset } = await PricingService.getAllPricing();
        setDigitalPricing(digital);
        setOffsetPricing(offset);
      } catch (error) {
        console.error('Error loading pricing:', error);
      } finally {
        setLoadingPricing(false);
      }
    };
    
    loadPricing();
  }, []);
  
  // Helper function to find the best matching paper from available options
  const findBestMatchingPaper = (paperName: string, gsm: string) => {
    if (!availablePapers.length) return null;
    
    // Clean the paper name (remove any suffixes like "(Custom)")
    const cleanPaperName = paperName.replace(/\s*\(Custom\)$/, '').trim();
    
    // First try exact match
    let exactMatch = availablePapers.find(p => p.name === cleanPaperName);
    if (exactMatch) return exactMatch;
    
    // Try partial match by name (e.g., "Premium Card Stock" matches "Premium Card Stock 350gsm")
    let partialMatch = availablePapers.find(p => {
      const cleanName = p.name.replace(/\d+gsm$/i, '').trim();
      return cleanName.toLowerCase() === cleanPaperName.toLowerCase();
    });
    if (partialMatch) return partialMatch;
    
    // Try to find by GSM if name doesn't match
    let gsmMatch = availablePapers.find(p => p.gsmOptions.includes(gsm));
    if (gsmMatch) return gsmMatch;
    
    // Try fuzzy matching for similar names
    let fuzzyMatch = availablePapers.find(p => {
      const words1 = p.name.toLowerCase().split(/\s+/);
      const words2 = cleanPaperName.toLowerCase().split(/\s+/);
      const commonWords = words1.filter(w => words2.includes(w));
      return commonWords.length >= Math.min(words1.length, words2.length) * 0.6; // 60% similarity
    });
    if (fuzzyMatch) return fuzzyMatch;
    
    return null;
  };
  
  // Fetch available paper materials from supplier database
  React.useEffect(() => {
    const fetchAvailablePapers = async () => {
      try {
        setLoadingPapers(true);
        const response = await fetch('/api/materials/papers');
        if (response.ok) {
          const papers = await response.json();
          setAvailablePapers(papers);
          console.log('Available papers loaded:', papers);
          
          // After loading papers, try to match existing form data with available options
          if (formData.products && formData.products.length > 0 && !hasMatchedPapers.current) {
            hasMatchedPapers.current = true;
            console.log('🔄 Paper matching: Starting paper matching process');
            console.log('  Original products before matching:', formData.products);
            
            const updatedProducts = formData.products.map(product => ({
              ...product,
              papers: product.papers.map(paper => {
                const bestMatch = findBestMatchingPaper(paper.name, paper.gsm);
                if (bestMatch) {
                  return {
                    name: bestMatch.name,
                    gsm: paper.gsm || bestMatch.gsmOptions[0] || '150'
                  };
                }
                return paper;
              })
            }));
            
            console.log('  Updated products after matching:', updatedProducts);
            
            // Only update if there are actual changes
            if (JSON.stringify(updatedProducts) !== JSON.stringify(formData.products)) {
              console.log('🔄 Paper matching: Updating formData, preserving finishing data');
              console.log('  Before update - finishing:', formData.products[0]?.finishing);
              console.log('  After update - finishing:', updatedProducts[0]?.finishing);
              console.log('  Before update - sizes:', {
                flatSize: formData.products[0]?.flatSize,
                closeSize: formData.products[0]?.closeSize
              });
              console.log('  After update - sizes:', {
                flatSize: updatedProducts[0]?.flatSize,
                closeSize: updatedProducts[0]?.closeSize
              });
              setFormData(prev => ({
                ...prev,
                products: updatedProducts
              }));
            }
          }
        } else {
          console.error('Failed to fetch available papers');
        }
      } catch (error) {
        console.error('Error fetching available papers:', error);
      } finally {
        setLoadingPapers(false);
      }
    };
    
    fetchAvailablePapers();
  }, []); // Only run once on mount
  


  // Ensure we have at least one product, but don't override auto-filled data
  
  React.useEffect(() => {
    if (!hasInitializedProducts.current) {
      // Only create empty product if there are no products OR if the only product is completely empty
      // This prevents overriding auto-filled data from existing quotes
      if (formData.products.length === 0 || 
          (formData.products.length === 1 && 
           !formData.products[0].productName && 
           formData.products[0].papers[0]?.name === "Select Paper" &&
           formData.products[0].quantity === 100)) {
        console.log('Creating empty product - no meaningful data found');
        setFormData(prev => ({
          ...prev,
          products: [createEmptyProduct()]
        }));
      } else {
        console.log('Skipping empty product creation - meaningful data exists:', {
          productCount: formData.products.length,
          firstProduct: formData.products[0] ? {
            name: formData.products[0].productName,
            paperName: formData.products[0].papers[0]?.name,
            quantity: formData.products[0].quantity
          } : null
        });
      }
      hasInitializedProducts.current = true;
    }
  }, []); // Only run once on mount

  // Ensure colors are properly initialized for all products
  
  React.useEffect(() => {
    if (!hasInitializedColors.current) {
      const updatedProducts = formData.products.map(product => {
        if (!product.colors) {
          return { ...product, colors: { front: "", back: "" } };
        }
        return product;
      });
      
      if (updatedProducts.some((p, i) => !p.colors || !formData.products[i].colors)) {
        setFormData(prev => ({
          ...prev,
          products: updatedProducts
        }));
      }
      hasInitializedColors.current = true;
    }
  }, []); // Only run once on mount





  // Check if this is a template-based quote (has pre-filled product data)
  const isTemplateQuote = formData.products.length > 0 && 
    formData.products[0].productName && 
    formData.products[0].productName !== "" &&
    formData.products[0].productName !== "Business Card" && // Exclude default "Business Card"
    (formData.products[0].papers.length > 0 && formData.products[0].papers[0].name !== "") || // Has paper info
    (formData.products[0].finishing.length > 0) || // Has finishing info
    (formData.products[0].colors && (formData.products[0].colors.front || formData.products[0].colors.back)) || // Has color info
    (formData.products[0].quantity && formData.products[0].quantity > 100); // Has meaningful quantity

  const updateProduct = (idx: number, patch: Partial<Product>) => {
    const next = [...formData.products];
    next[idx] = { ...next[idx], ...patch };
    setFormData((prev): QuoteFormData => ({ ...prev, products: next }));
  };

  const handleProductNameChange = (idx: number, productName: string) => {
    console.log(`🔄 handleProductNameChange called: idx=${idx}, productName="${productName}"`);
    console.log(`  Current sizes before change:`, {
      flatSize: formData.products[idx]?.flatSize,
      closeSize: formData.products[idx]?.closeSize
    });
    
    const product = formData.products[idx];
    const config = getProductConfig(productName);
    
    console.log(`  Found config:`, config);
    
    if (config) {
      // Auto-populate sizes and other defaults from product config
      const updates: Partial<Product> = {
        productName,
        flatSize: config.defaultSizes,
        closeSize: config.defaultSizes,
        useSameAsFlat: true,
        printingSelection: config.defaultPrinting,
        sides: config.defaultSides,
        colors: config.defaultColors,
        // Production settings
        bleed: config.defaultBleed,
        gap: config.defaultGap,
        gripper: config.defaultGripper,
        otherEdges: config.defaultOtherEdges
      };
      
      console.log(`  Updates to apply:`, updates);
      
      // Special handling for cups
      if (productName === 'Cups') {
        updates.cupSizeOz = 8; // Default to 8oz
        const cupSize = getCupSizeByOz(8);
        if (cupSize) {
          updates.flatSize = { width: cupSize.width, height: cupSize.height, spine: 0 };
          updates.closeSize = { width: cupSize.width, height: cupSize.height, spine: 0 };
        }
      }
      
      // Special handling for shopping bags
      if (productName === 'Shopping Bag') {
        updates.bagPreset = 'Medium'; // Default to Medium
        const bagPreset = getShoppingBagPreset('Medium');
        if (bagPreset) {
          updates.flatSize = { width: bagPreset.width, height: bagPreset.height, spine: 0 };
          updates.closeSize = { width: bagPreset.width, height: bagPreset.height, spine: 0 };
          updates.gusset = bagPreset.gusset;
        }
      }
      
      console.log(`  Auto-populating with config sizes:`, config.defaultSizes);
      updateProduct(idx, updates);
      console.log(`Auto-populated ${productName} with config:`, config);
    } else {
      // Just update the name if no config found
      updateProduct(idx, { productName });
      console.log(`Updated product name to ${productName} (no config found)`);
    }
  };

  const handleSizeChange = (
    idx: number,
    sizeType: "flatSize" | "closeSize",
    dimension: "width" | "height" | "spine",
    value: string
  ) => {
    const p = formData.products[idx];
    const newSize = {
      ...p[sizeType],
      [dimension]: value !== "" ? parseFloat(value) : null,
    };
    
    // Prepare the update object
    const updateObject: Partial<Product> = { [sizeType]: newSize };
    
    // If flat size is changed and useSameAsFlat is checked, also update close size
    if (sizeType === "flatSize" && p.useSameAsFlat) {
      updateObject.closeSize = {
        width: newSize.width,
        height: newSize.height,
        spine: newSize.spine
      };
    }
    
    // Update both sizes in a single call to prevent state update issues
    updateProduct(idx, updateObject);
  };

  // Handle cup size changes (oz selection)
  const handleCupSizeChange = (idx: number, oz: number) => {
    const cupSize = getCupSizeByOz(oz);
    if (cupSize) {
      updateProduct(idx, {
        cupSizeOz: oz,
        flatSize: { width: cupSize.width, height: cupSize.height, spine: 0 },
        closeSize: { width: cupSize.width, height: cupSize.height, spine: 0 },
        useSameAsFlat: true
      });
    }
  };

  // Handle shopping bag preset changes
  const handleBagPresetChange = (idx: number, presetName: string) => {
    const bagPreset = getShoppingBagPreset(presetName);
    if (bagPreset) {
      updateProduct(idx, {
        bagPreset: presetName,
        flatSize: { width: bagPreset.width, height: bagPreset.height, spine: 0 },
        closeSize: { width: bagPreset.width, height: bagPreset.height, spine: 0 },
        gusset: bagPreset.gusset,
        useSameAsFlat: true
      });
    }
  };

  // DEBUG: Track data changes over time to identify the 10-second reset issue
  React.useEffect(() => {
    const timestamp = new Date().toLocaleTimeString();
    console.log(`[${timestamp}] DEBUG: formData changed`, {
      productsCount: formData.products.length,
      firstProduct: formData.products[0] ? {
        name: formData.products[0].productName,
        finishing: formData.products[0].finishing,
        finishingLength: formData.products[0].finishing?.length || 0,
        flatSize: formData.products[0].flatSize,
        closeSize: formData.products[0].closeSize,
        // Detailed size analysis
        flatSizeWidth: formData.products[0].flatSize?.width,
        flatSizeHeight: formData.products[0].flatSize?.height,
        closeSizeWidth: formData.products[0].closeSize?.width,
        closeSizeHeight: formData.products[0].closeSize?.height,
        useSameAsFlat: formData.products[0].useSameAsFlat
      } : null
    });
    
    // Safety check: If sizes are 0 or null, reset to default values
    if (formData.products[0]?.flatSize) {
      const needsSizeFix = 
        formData.products[0].flatSize.width === 0 || 
        formData.products[0].flatSize.width === null ||
        formData.products[0].flatSize.height === 0 || 
        formData.products[0].flatSize.height === null;
        
      if (needsSizeFix) {
        console.log(`🔧 FIXING SIZES: Resetting to default 9x5.5`);
        updateProduct(0, {
          flatSize: { width: 9, height: 5.5, spine: 0 },
          closeSize: { width: 9, height: 5.5, spine: 0 },
          useSameAsFlat: true
        });
      }
    }
    
    // Detailed finishing analysis - check ALL finishing options
    if (formData.products[0]?.finishing) {
      const allFinishingOptions = [
        "Embossing", "Lamination", "Velvet Lamination", "Foiling", 
        "Die Cutting", "UV Spot", "Folding", "Padding", "Varnishing"
      ];
      
      const finishingChecks = allFinishingOptions.reduce((acc, option) => {
        acc[`${option}CaseInsensitive`] = formData.products[0].finishing.some(f => f.toLowerCase() === option.toLowerCase());
        acc[`${option}StartsWith`] = formData.products[0].finishing.some(f => f.toLowerCase().startsWith(option.toLowerCase()));
        return acc;
      }, {});
      
      console.log(`[${timestamp}] DETAILED FINISHING ANALYSIS:`, {
        rawFinishing: formData.products[0].finishing,
        finishingType: typeof formData.products[0].finishing,
        isArray: Array.isArray(formData.products[0].finishing),
        ...finishingChecks
      });
    }
  }, [formData]);

  // === Costing Calculation Functions ===
  const calculateCosting = (product: Product) => {
    if (!digitalPricing || !offsetPricing) {
      console.log('Pricing data not loaded yet');
      return;
    }
    
    // Validate product data
    const width = product.flatSize?.width || 0;
    const height = product.flatSize?.height || 0;
    const quantity = product.quantity || 0;
    const sides = parseInt(product.sides || '1') || 1;
    const colorsFront = parseInt(product.colors?.front || '0') || 0;
    const colorsBack = parseInt(product.colors?.back || '0') || 0;
    
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
        sides: sides,
        colorsF: colorsFront as 1 | 2 | 4,
        colorsB: colorsBack as 1 | 2 | 4,
        perClick: digitalPricing.perClick,
        parentCost: digitalPricing.parentSheetCost,
        wasteParents: digitalPricing.wasteParents,
        bleed: product.bleed || 0.5,
        gapX: product.gap || 0.5,
        gapY: product.gap || 0.5,
        allowRotate: true
      });
      
      console.log('Digital costing results:', digitalResults);
      setDigitalCostingResults(digitalResults);
      
      // Set default selection to cheapest option
      if (digitalResults.length > 0 && !selectedDigitalOption) {
        const cheapest = digitalResults.reduce((min, current) => 
          current.total < min.total ? current : min
        );
        setSelectedDigitalOption(cheapest.option.label);
      }
      
      // Calculate offset costing
      const offsetResult = calcOffsetCosting({
        qty: quantity,
        parent: { w: 100, h: 70 }, // PARENT stock
        press: { w: 35, h: 50, label: '35×50 cm' }, // 35×50 press
        piece: { w: width, h: height },
        sides: sides as 1 | 2,
        colorsF: colorsFront as 1 | 2 | 4,
        colorsB: colorsBack as 1 | 2 | 4,
        pricing: offsetPricing,
        bleed: product.bleed || 0.5,
        gapX: product.gap || 0.5,
        gapY: product.gap || 0.5,
        allowRotate: true
      });
      
      console.log('Offset costing result:', offsetResult);
      setOffsetCostingResult(offsetResult);
      
      // Set default selection to 35x50 if enabled
      if (offsetResult.pressPerParent > 0 && !selectedOffsetPress) {
        setSelectedOffsetPress('35×50 cm');
      }
      
    } catch (error) {
      console.error('Error calculating costing:', error);
    }
  };

  // Trigger costing calculation when product changes
  useEffect(() => {
    if (formData.products.length > 0 && digitalPricing && offsetPricing) {
      calculateCosting(formData.products[0]);
    }
  }, [formData.products, digitalPricing, offsetPricing]);

  // Helper function to check if a finishing option is selected
  const isFinishingSelected = (product: Product, option: string): boolean => {
    // Simple, direct check without excessive logging
    if (!product.finishing || !Array.isArray(product.finishing) || product.finishing.length === 0) {
      return false;
    }
    
    // Check if any finishing option contains this option name (case-insensitive)
    // This handles both direct matches and side-specific matches (e.g., "UV Spot-Front")
    return product.finishing.some(f => {
      if (typeof f === 'string') {
        // Normalize both strings to lowercase for case-insensitive comparison
        const normalizedFinishing = f.toLowerCase();
        const normalizedOption = option.toLowerCase();
        
        // Check for exact match or if the finishing option starts with the option name
        return normalizedFinishing === normalizedOption || normalizedFinishing.startsWith(normalizedOption + '-');
      }
      return false;
    });
  };

  // paper
  const handlePaperChange = (
    pIdx: number,
    paperIdx: number,
    field: keyof Paper,
    value: string
  ) => {
    const product = formData.products[pIdx];
    const newPapers = [...product.papers];
    newPapers[paperIdx] = { ...newPapers[paperIdx], [field]: value };
    updateProduct(pIdx, { papers: newPapers });
  };

  const addPaper = (pIdx: number) => {
    const product = formData.products[pIdx];
    updateProduct(pIdx, { papers: [...product.papers, { name: "Select Paper", gsm: "Select GSM" }] });
  };

  const removePaper = (pIdx: number, paperIdx: number) => {
    const product = formData.products[pIdx];
    if (product.papers.length <= 1) return;
    updateProduct(pIdx, {
      papers: product.papers.filter((_, i) => i !== paperIdx),
    });
  };

  // finishing with side selection for two-sided products
  const toggleFinishing = (pIdx: number, option: string, side?: string) => {
    const product = formData.products[pIdx];
    const finishingKey = side ? `${option}-${side}` : option;
    const finishing = product.finishing.includes(finishingKey)
      ? product.finishing.filter((x) => x !== finishingKey)
      : [...product.finishing, finishingKey];
    updateProduct(pIdx, { finishing });
  };

  // add/remove product
  const addProduct = () => {
    setFormData(
      (prev): QuoteFormData => ({
        ...prev,
        products: [...prev.products, createEmptyProduct()],
      })
    );
  };

  const removeProduct = (idx: number) => {
    if (formData.products.length <= 1) return;
    setFormData(
      (prev): QuoteFormData => ({
        ...prev,
        products: prev.products.filter((_, i) => i !== idx),
      })
    );
  };

  const handleViewPaperDetails = async (paperName: string) => {
    if (!paperName || paperName === "Select Paper" || paperName.trim() === "") {
      console.log('Paper name is empty or invalid:', paperName);
      return;
    }
    
    // Clean the paper name by removing "(Custom)" suffix and trimming
    const cleanPaperName = paperName.replace(/\s*\(Custom\)$/, '').trim();
    
    if (!cleanPaperName) {
      console.log('Cleaned paper name is empty');
      return;
    }
    
    console.log('Opening paper details for:', cleanPaperName);
    setSelectedPaperForDetails(cleanPaperName);
    setPaperDetailsDialogOpen(true);
    setLoadingPaperDetails(true);
    
    try {
      const response = await fetch(`/api/materials/paper-details/${encodeURIComponent(cleanPaperName)}`);
      if (response.ok) {
        const details = await response.json();
        setPaperDetails(details);
        console.log('Paper details loaded:', details);
      } else {
        console.error('Failed to fetch paper details for:', cleanPaperName);
        setPaperDetails(null);
      }
    } catch (error) {
      console.error('Error fetching paper details for:', cleanPaperName, error);
        setPaperDetails(null);
    } finally {
      setLoadingPaperDetails(false);
    }
  };

  const handleBrowseAvailablePapers = () => {
    console.log('Opening browse available papers dialog');
    setSelectedPaperForDetails(''); // No specific paper selected
    setPaperDetailsDialogOpen(true);
    setLoadingPaperDetails(false);
    
    // Set browse mode to show all available papers
    setPaperDetails({
      browseMode: true,
      availablePapers: availablePapers,
      totalMaterials: availablePapers.length,
      message: `Browse ${availablePapers.length} available papers`
    });
  };

  const handleAddPaperFromBrowse = (paperName: string) => {
    console.log('Adding paper from browse:', paperName);
    // Add the paper to the first product (or you can modify this logic)
    if (formData.products.length > 0) {
      const updatedProducts = [...formData.products];
      const firstProduct = updatedProducts[0];
      
      // Add the paper with default GSM
      const newPaper: Paper = {
        name: paperName,
        gsm: "Select GSM"
      };
      
      firstProduct.papers.push(newPaper);
      setFormData({ ...formData, products: updatedProducts });
      
      // Close the dialog
      setPaperDetailsDialogOpen(false);
      
      console.log('Paper added successfully:', paperName);
    }
  };

  const PaperDetailsDialog = () => {
    if (!paperDetailsDialogOpen) return null;

    return (
      <Dialog open={paperDetailsDialogOpen} onOpenChange={setPaperDetailsDialogOpen}>
        <DialogContent className="max-w-full sm:max-w-5xl max-h-[85vh] overflow-y-auto mx-4 sm:mx-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2 text-sm sm:text-base">
              <div className="w-5 h-5 bg-[#27aae1] rounded flex items-center justify-center flex-shrink-0">
                <span className="text-white text-xs font-bold">P</span>
              </div>
              <span className="break-words">
                {paperDetails && paperDetails.browseMode 
                  ? 'Browse Available Papers' 
                  : `Paper Details: ${selectedPaperForDetails}`
                }
              </span>
            </DialogTitle>
          </DialogHeader>
          
          {loadingPaperDetails ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#27aae1]"></div>
              <span className="ml-2 text-gray-600 text-sm sm:text-base">Loading paper details...</span>
            </div>
          ) : paperDetails ? (
            <div className="space-y-4 sm:space-y-6">
              {paperDetails.browseMode && (
                <div className="space-y-3 sm:space-y-4">
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-3 sm:p-4 rounded-lg border border-green-200">
                    <div className="text-center">
                      <h3 className="text-base sm:text-lg font-semibold text-green-800 mb-2">Browse All Available Papers</h3>
                      <p className="text-xs sm:text-sm text-green-700">{paperDetails.message}</p>
                    </div>
                  </div>
                  
                  <div className="grid gap-3 sm:gap-4">
                    {paperDetails.availablePapers?.map((paper, idx) => (
                      <div key={idx} className="border border-gray-200 rounded-lg p-3 sm:p-4 bg-white shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:justify-between sm:items-start">
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900 text-sm sm:text-lg mb-2">{paper.name}</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 text-xs sm:text-sm text-gray-600">
                              <div>
                                <span className="font-medium">Suppliers:</span>
                                <div className="mt-1">
                                  {paper.suppliers.map((supplier, sIdx) => (
                                    <div key={sIdx} className="text-xs bg-gray-100 px-2 py-1 rounded mb-1">
                                      {supplier}
                                    </div>
                                  ))}
                                </div>
                              </div>
                              <div>
                                <span className="font-medium">GSM Options:</span>
                                <div className="mt-1">
                                  {paper.gsmOptions.map((gsm, gIdx) => (
                                    <div key={gIdx} className="text-xs bg-[#27aae1]/20 px-2 py-1 rounded mb-1">
                                      {gsm} gsm
                                    </div>
                                  ))}
                                </div>
                              </div>
                              <div>
                                <span className="font-medium">Paper Type:</span>
                                <div className="mt-1 text-xs bg-[#ea078b]/20 px-2 py-1 rounded">
                                  {paper.paperType || 'Standard'}
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="flex justify-center sm:ml-4">
                            <Button
                              variant="outline"
                              className="bg-[#27aae1] text-white border-[#27aae1] hover:bg-[#1e8bc3] hover:border-[#1e8bc3] w-full sm:w-auto"
                              size="sm"
                              onClick={() => handleAddPaperFromBrowse(paper.name)}
                              title={`Add ${paper.name} to product`}
                            >
                              <Plus className="w-4 h-4 mr-1" />
                              Add
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {!paperDetails.browseMode && (
                <>
                  {paperDetails.totalMaterials === 0 && paperDetails.message ? (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 sm:p-4">
                      <div className="flex items-start space-x-3">
                        <div className="w-6 h-6 bg-yellow-600 rounded mt-1 flex items-center justify-center flex-shrink-0">
                          <span className="text-white text-xs font-bold">!</span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="font-medium text-yellow-800 mb-2 text-sm sm:text-base">Paper Not Found in Database</h4>
                          <p className="text-xs sm:text-sm text-yellow-700 mb-3 break-words">{paperDetails.message}</p>
                          
                          {paperDetails.similarPapers && paperDetails.similarPapers.length > 0 && (
                            <div className="mt-4 pt-3 border-t border-yellow-200">
                              <p className="text-xs sm:text-sm font-medium text-yellow-800 mb-2">Similar papers found:</p>
                              <div className="space-y-2">
                                {paperDetails.similarPapers.map((paper, idx) => (
                                  <div key={idx} className="bg-yellow-50 p-3 rounded border border-yellow-200">
                                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start space-y-2 sm:space-y-0">
                                      <div className="min-w-0 flex-1">
                                        <p className="text-xs font-medium text-yellow-900 break-words">{paper.name}</p>
                                        <p className="text-xs text-yellow-700">Supplier: {paper.supplier}</p>
                                      </div>
                                      <div className="text-left sm:text-right flex-shrink-0">
                                        <p className="font-bold text-yellow-900 text-sm">AED {paper.cost?.toFixed(2) || '0.00'}</p>
                                        <p className="text-xs text-yellow-700">per {paper.unit}</p>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                              <p className="text-xs text-yellow-600 mt-2 italic">{paperDetails.suggestion}</p>
                            </div>
                          )}
                          
                          {paperDetails.availableAlternatives && paperDetails.availableAlternatives.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-yellow-200">
                              <p className="text-xs sm:text-sm font-medium text-yellow-800 mb-2">Other available papers:</p>
                              <div className="flex flex-wrap gap-2">
                                {paperDetails.availableAlternatives.map((alt, idx) => (
                                  <span key={idx} className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs break-words">
                                    {alt.name}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="bg-[#27aae1]/10 p-3 sm:p-4 rounded-lg border border-[#27aae1]/30">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                          <div className="text-center">
                            <div className="text-xl sm:text-2xl font-bold text-[#27aae1]">{paperDetails.totalMaterials || 0}</div>
                            <div className="text-xs sm:text-sm text-gray-600">Total Materials</div>
                          </div>
                          <div className="text-center">
                            <div className="text-xl sm:text-2xl font-bold text-green-600">{paperDetails.totalSuppliers || 0}</div>
                            <div className="text-xs sm:text-sm text-gray-600">Available Suppliers</div>
                          </div>
                          <div className="text-center">
                            <div className="text-xl sm:text-2xl font-bold text-[#ea078b]">{paperDetails.gsmDetails?.length || 0}</div>
                            <div className="text-xs sm:text-sm text-gray-600">GSM Options</div>
                          </div>
                        </div>
                        
                        <div className="mt-4 pt-4 border-t border-[#27aae1]/30">
                          <div className="text-center">
                            <p className="text-xs sm:text-sm text-gray-600">
                              <span className="font-medium">Paper Type:</span> {paperDetails.paperName || 'Unknown'}
                            </p>
                            <p className="text-xs sm:text-sm text-gray-600 mt-1">
                              <span className="font-medium">Database Status:</span> 
                              <span className="text-green-600 font-medium ml-1">Active</span>
                            </p>
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  {paperDetails.gsmDetails && paperDetails.gsmDetails.length > 0 ? (
                    <div className="space-y-3 sm:space-y-4">
                      <h3 className="text-base sm:text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">
                        Available GSM Options
                      </h3>
                      
                      {paperDetails.gsmDetails.map((gsmDetail, idx) => (
                        <div key={idx} className="border border-gray-200 rounded-lg p-3 sm:p-4 bg-white shadow-sm">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 space-y-2 sm:space-y-0">
                            <h4 className="text-base sm:text-lg font-semibold text-gray-800">
                              {gsmDetail.gsm} GSM
                            </h4>
                            <div className="text-left sm:text-right">
                              <div className="text-xs sm:text-sm text-gray-600">
                                Cost Range: <span className="font-medium text-green-600">
                                  AED {gsmDetail.costRange?.min?.toFixed(2) || '0.00'} - AED {gsmDetail.costRange?.max?.toFixed(2) || '0.00'}
                                </span>
                              </div>
                              <div className="text-xs sm:text-sm text-gray-600">
                                Avg: <span className="font-medium text-[#27aae1]">
                                  AED {gsmDetail.averageCost?.toFixed(2) || '0.00'}
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="space-y-3">
                            <h5 className="font-medium text-gray-700 text-xs sm:text-sm">
                              Suppliers ({gsmDetail.suppliers?.length || 0}):
                            </h5>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                              {gsmDetail.suppliers?.map((supplier, sIdx) => (
                                <div key={sIdx} className="border border-gray-100 rounded-md p-3 bg-gray-50">
                                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-2 space-y-1 sm:space-y-0">
                                    <h6 className="font-medium text-gray-800 text-sm break-words">{supplier.name}</h6>
                                    <span className="text-xs sm:text-sm font-semibold text-green-600">
                                      AED {supplier.cost?.toFixed(2) || '0.00'}/{supplier.unit || 'unit'}
                                    </span>
                                  </div>
                                  
                                  <div className="space-y-1 text-xs text-gray-600">
                                    {supplier.contact && (
                                      <div className="break-words">Contact: {supplier.contact}</div>
                                    )}
                                    {supplier.email && (
                                      <div className="break-words">Email: {supplier.email}</div>
                                    )}
                                    {supplier.phone && (
                                      <div>Phone: {supplier.countryCode} {supplier.phone}</div>
                                    )}
                                    {supplier.address && (
                                      <div className="break-words">Address: {supplier.address}</div>
                                    )}
                                    {supplier.city && supplier.state && (
                                      <div>Location: {supplier.city}, {supplier.state}</div>
                                    )}
                                    {supplier.country && (
                                      <div>Country: {supplier.country}</div>
                                    )}
                                    <div className="text-gray-500">
                                      Last Updated: {supplier.lastUpdated ? new Date(supplier.lastUpdated).toLocaleDateString() : 'Unknown'}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-gray-500">
                      <div className="w-8 h-8 bg-gray-400 rounded mx-auto mb-2 flex items-center justify-center">
                        <span className="text-white text-xs font-bold">P</span>
                      </div>
                      <p className="text-xs sm:text-sm">No GSM options available for this paper</p>
                    </div>
                  )}
                </>
              )}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    );
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: customDropdownStyles }} />
      <div className="space-y-6 sm:space-y-8 px-4 sm:px-0">
        <div className="text-center space-y-2 sm:space-y-3">
          <h3 className="text-xl sm:text-2xl font-bold text-slate-900">Product Specifications</h3>
          <p className="text-sm sm:text-base text-slate-600">
            {isTemplateQuote 
              ? `${formData.products.length} product(s) loaded from selected quote template. You can modify these specifications as needed.`
              : "Define the product specifications for your quote"
            }
          </p>
        </div>

        {/* Template Quote Indicator */}
        {isTemplateQuote && (
          <div className="bg-[#27aae1]/10 border border-[#27aae1]/30 rounded-lg p-3 sm:p-4">
            <div className="flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-start space-x-2">
                <div className="w-5 h-5 rounded-full bg-[#27aae1]/100 flex items-center justify-center mt-0.5 flex-shrink-0">
                  <span className="text-white text-xs font-bold">📋</span>
                </div>
                <div className="text-[#27aae1] min-w-0 flex-1">
                  <p className="font-medium mb-1 text-sm sm:text-base">Quote Template Loaded</p>
                  <p className="text-xs sm:text-sm">
                    Product specifications have been pre-filled from the selected quote template: <strong>{formData.products.length} product(s) loaded</strong>
                  </p>
                  <div className="text-xs sm:text-sm mt-1 space-y-1 max-h-32 overflow-y-auto">
                    {formData.products.map((product, idx) => (
                      <div key={idx} className="border-l-2 border-[#27aae1]/50 pl-2 break-words">
                        <strong>{product.productName}</strong>: {product.quantity} units, {product.sides} side(s), 
                        {product.printingSelection}
                        {product.papers.length > 0 && product.papers[0].name && 
                          `, Paper: ${product.papers[0].name} ${product.papers[0].gsm}gsm`
                        }
                        {product.finishing.length > 0 && 
                          `, Finishing: ${product.finishing.join(', ')}`
                        }
                        {product.colors && (product.colors.front || product.colors.back) && 
                          `, Colors: ${product.colors.front || ''}${product.colors.front && product.colors.back ? ' / ' : ''}${product.colors.back || ''}`
                        }
                        {(product.flatSize.width || product.flatSize.height) && 
                          `, Size: ${product.flatSize.width || 0}×${product.flatSize.height || 0}cm`
                        }
                      </div>
                    ))}
                  </div>
                  <p className="text-xs sm:text-sm mt-1 text-[#27aae1]">
                    You can modify any details to customize for your new quote.
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setFormData(prev => ({
                    ...prev,
                    products: [createEmptyProduct()]
                  }));
                }}
                className="text-[#27aae1] border-[#27aae1]/50 hover:bg-[#27aae1]/10 w-full sm:w-auto flex-shrink-0"
              >
                Clear Template
              </Button>
            </div>
          </div>
        )}

        {/* Products */}
        {formData.products.map((product, idx) => (
          <Card key={idx} className="border-0 shadow-lg">
            <CardHeader className="pb-3 sm:pb-4">
              <div className="flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
                    <div className="w-4 h-4 sm:w-5 sm:h-5 bg-white rounded flex items-center justify-center">
                      <span className="text-[#27aae1] text-xs font-bold">P</span>
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <CardTitle className="text-base sm:text-lg text-slate-900 break-words">
                      {product.productName ? product.productName : `Product ${idx + 1}`}
                    </CardTitle>
                    <p className="text-xs sm:text-sm text-slate-500">Product specifications and details</p>
                  </div>
                </div>
                <div className="flex items-center justify-end space-x-3">
                  {formData.products.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeProduct(idx)}
                      className="text-red-500 hover:text-red-600 hover:bg-red-50 w-full sm:w-auto"
                    >
                      <Trash2 className="h-4 w-4 mr-2" /> Remove
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-6 sm:space-y-8">
              {/* Basic Information and Color Options - Responsive Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
                {/* Basic Product Information */}
                <div className="space-y-3 sm:space-y-4">
                  <h4 className="text-base sm:text-lg font-semibold text-slate-800 flex items-center">
                    <FileText className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-[#27aae1]" />
                    Basic Information
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <Label className="mb-2 block text-xs sm:text-sm font-medium text-slate-700">Product Name</Label>
                      <Select
                        value={product.productName}
                        onValueChange={(v) => handleProductNameChange(idx, v)}
                      >
                        <SelectTrigger className="w-full border-slate-300 focus:border-[#27aae1] focus:ring-[#27aae1] rounded-xl bg-white text-sm">
                          <SelectValue placeholder="Select Product" />
                        </SelectTrigger>
                        <SelectContent className="bg-white border border-gray-200 shadow-lg max-h-60 overflow-y-auto dropdown-scroll">
                          {STANDARD_PRODUCTS.map((productName) => (
                            <SelectItem key={productName} value={productName}>
                              {productName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="mb-2 block text-xs sm:text-sm font-medium text-slate-700">Quantity</Label>
                      <Input
                        type="number"
                        min={1}
                        placeholder="100"
                        className="border-slate-300 focus:border-[#27aae1] focus:ring-[#27aae1] rounded-xl text-sm"
                        value={product.quantity ?? ""}
                        onChange={(e) =>
                          updateProduct(idx, {
                            quantity: e.target.value ? Number(e.target.value) : null,
                          })
                        }
                      />
                    </div>

                    <div>
                      <Label className="mb-2 block text-xs sm:text-sm font-medium text-slate-700">Sides</Label>
                      <Select
                        value={product.sides}
                        onValueChange={(v) =>
                          updateProduct(idx, { sides: v as "1" | "2" })
                        }
                      >
                        <SelectTrigger className="w-full border-slate-300 focus:border-[#27aae1] focus:ring-[#27aae1] rounded-xl bg-white text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-white border border-gray-200 shadow-lg max-h-60 overflow-y-auto dropdown-scroll">
                          <SelectItem value="1">1 Side</SelectItem>
                          <SelectItem value="2">2 Sides</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="mb-2 block text-xs sm:text-sm font-medium text-slate-700">Printing Selection</Label>
                      <Select
                        value={product.printingSelection}
                        onValueChange={(v) =>
                          updateProduct(idx, {
                            printingSelection: v as Product["printingSelection"],
                          })
                        }
                      >
                        <SelectTrigger className="w-full border-slate-300 focus:border-[#27aae1] focus:ring-[#27aae1] rounded-xl bg-white text-sm">
                          <SelectValue placeholder="Select Printing" />
                        </SelectTrigger>
                        <SelectContent className="bg-white border border-gray-200 shadow-lg max-h-60 overflow-y-auto dropdown-scroll">
                          <SelectItem value="Digital">Digital</SelectItem>
                          <SelectItem value="Offset">Offset</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Special Size Handling for Cups */}
                {product.productName === 'Cups' && (
                  <div className="space-y-3 sm:space-y-4">
                    <h4 className="text-base sm:text-lg font-semibold text-slate-800 flex items-center">
                      <Ruler className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-[#27aae1]" />
                      Cup Size (oz)
                    </h4>
                    <div>
                      <Label className="mb-2 block text-xs sm:text-sm font-medium text-slate-700">Cup Size</Label>
                      <Select
                        value={product.cupSizeOz?.toString() || "8"}
                        onValueChange={(v) => handleCupSizeChange(idx, parseInt(v))}
                      >
                        <SelectTrigger className="w-full border-slate-300 focus:border-[#27aae1] focus:ring-[#27aae1] rounded-xl bg-white text-sm">
                          <SelectValue placeholder="Select cup size" />
                        </SelectTrigger>
                        <SelectContent className="bg-white border border-gray-200 shadow-lg max-h-60 overflow-y-auto dropdown-scroll">
                          <SelectItem value="4">4 oz (BBox 20×8 cm)</SelectItem>
                          <SelectItem value="6">6 oz (BBox 22×8.5 cm)</SelectItem>
                          <SelectItem value="8">8 oz (BBox 23×9 cm)</SelectItem>
                          <SelectItem value="12">12 oz (BBox 26×10 cm)</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-slate-500 mt-1">
                        Die-cut cups with staggerForDie: true, seam allowance 3-5mm
                      </p>
                    </div>
                  </div>
                )}

                {/* Special Size Handling for Shopping Bags */}
                {product.productName === 'Shopping Bag' && (
                  <div className="space-y-3 sm:space-y-4">
                    <h4 className="text-base sm:text-lg font-semibold text-slate-800 flex items-center">
                      <Ruler className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-[#27aae1]" />
                      Bag Size & Gusset
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <div>
                        <Label className="mb-2 block text-xs sm:text-sm font-medium text-slate-700">Bag Preset</Label>
                        <Select
                          value={product.bagPreset || "Medium"}
                          onValueChange={(v) => handleBagPresetChange(idx, v)}
                        >
                          <SelectTrigger className="w-full border-slate-300 focus:border-[#27aae1] focus:ring-[#27aae1] rounded-xl bg-white text-sm">
                            <SelectValue placeholder="Select bag size" />
                          </SelectTrigger>
                          <SelectContent className="bg-white border border-gray-200 shadow-lg max-h-60 overflow-y-auto dropdown-scroll">
                            <SelectItem value="Small">Small (18×23×8 cm)</SelectItem>
                            <SelectItem value="Medium">Medium (25×35×10 cm)</SelectItem>
                            <SelectItem value="Large">Large (32×43×12 cm)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="mb-2 block text-xs sm:text-sm font-medium text-slate-700">Gusset Width (cm)</Label>
                        <Input
                          type="number"
                          min={0}
                          step="0.1"
                          placeholder="10"
                          className="border-slate-300 focus:border-[#27aae1] focus:ring-[#27aae1] rounded-xl text-sm"
                          value={product.gusset ?? ""}
                          onChange={(e) =>
                            updateProduct(idx, {
                              gusset: e.target.value ? Number(e.target.value) : undefined,
                            })
                          }
                        />
                      </div>
                    </div>
                    <p className="text-xs text-slate-500">
                      Front/Back = W×H, Gussets = G×H×2, plus glue/lip allowances
                    </p>
                  </div>
                )}

                {/* Color Options */}
                <div className="space-y-3 sm:space-y-4">
                  <h4 className="text-base sm:text-lg font-semibold text-slate-800 flex items-center">
                    <Palette className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-[#27aae1]" />
                    Color Options
                  </h4>
                  <div className="space-y-3 sm:space-y-4">
                    <div>
                      <Label className="mb-2 block text-xs sm:text-sm font-medium text-slate-700">Front Side</Label>
                      <Select
                        value={product.colors?.front || ""}
                        onValueChange={(v) => updateProduct(idx, { 
                          colors: { ...product.colors, front: v } 
                        })}
                      >
                        <SelectTrigger className="w-full border-slate-300 focus:border-[#27aae1] focus:ring-[#27aae1] rounded-xl bg-white text-sm">
                          <SelectValue placeholder="Select Color" />
                        </SelectTrigger>
                        <SelectContent className="bg-white border border-gray-200 shadow-lg max-h-60 overflow-y-auto dropdown-scroll">
                          <SelectItem value="1 Color">1 Color</SelectItem>
                          <SelectItem value="2 Colors">2 Colors</SelectItem>
                          <SelectItem value="3 Colors">3 Colors</SelectItem>
                          <SelectItem value="4 Colors (CMYK)">4 Colors (CMYK)</SelectItem>
                          <SelectItem value="4+1 Colors">4+1 Colors</SelectItem>
                          <SelectItem value="4+2 Colors">4+2 Colors</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {product.sides === "2" && (
                      <div>
                        <Label className="mb-2 block text-xs sm:text-sm font-medium text-slate-700">Back Side</Label>
                        <Select
                          value={product.colors?.back === product.colors?.front ? "Same as Front" : (product.colors?.back || "")}
                          onValueChange={(v) => {
                            if (v === "Same as Front") {
                              updateProduct(idx, { 
                                colors: { ...product.colors, back: product.colors?.front || "" } 
                              });
                            } else {
                              updateProduct(idx, { 
                                colors: { ...product.colors, back: v } 
                              });
                            }
                          }}
                        >
                          <SelectTrigger className="w-full border-slate-300 focus:border-[#27aae1] focus:ring-[#27aae1] rounded-xl bg-white text-sm">
                            <SelectValue placeholder="Select Color" />
                          </SelectTrigger>
                          <SelectContent className="bg-white border border-gray-200 shadow-lg max-h-60 overflow-y-auto dropdown-scroll">
                            <SelectItem value="Same as Front">Same as Front</SelectItem>
                            <SelectItem value="1 Color">1 Color</SelectItem>
                            <SelectItem value="2 Colors">2 Colors</SelectItem>
                            <SelectItem value="3 Colors">3 Colors</SelectItem>
                            <SelectItem value="4 Colors (CMYK)">4 Colors (CMYK)</SelectItem>
                            <SelectItem value="4+1 Colors">4+1 Colors</SelectItem>
                            <SelectItem value="4+2 Colors">4+2 Colors</SelectItem>
                          </SelectContent>
                        </Select>
                        
                        {/* Show actual back color when "Same as Front" is selected */}
                        {product.colors?.back === product.colors?.front && product.colors?.front && (
                          <div className="text-xs text-gray-600 mt-1">
                            Back side will use: <span className="font-medium">{product.colors?.front}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Size Details */}
              <div className="space-y-3 sm:space-y-4">
                <h4 className="text-base sm:text-lg font-semibold text-slate-800 flex items-center">
                  <Ruler className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-[#27aae1]" />
                  Size Details {product.productName === 'Cups' ? '(BBox in cm)' : '(cm)'}
                </h4>
                
                {/* Flat Size (Open) */}
                <div className="space-y-2 sm:space-y-3">
                  <Label className="text-xs sm:text-sm font-medium text-slate-700">Flat Size (Open)</Label>
                  <div className={`grid gap-3 sm:gap-4 ${shouldShowSpine(product.productName) ? 'grid-cols-1 sm:grid-cols-3' : 'grid-cols-1 sm:grid-cols-2'}`}>
                    <div>
                      <Label className="text-xs text-slate-600 mb-1 block">Width</Label>
                      <Input
                        type="number"
                        placeholder="Width"
                        className="border-slate-300 focus:border-[#27aae1] focus:ring-[#27aae1] rounded-xl text-sm"
                        min={0}
                        step="0.1"
                        value={product.flatSize.width ?? ""}
                        onChange={(e) =>
                          handleSizeChange(
                            idx,
                            "flatSize",
                            "width",
                            e.target.value
                          )
                        }
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-slate-600 mb-1 block">Height</Label>
                      <Input
                        type="number"
                        placeholder="Height"
                        className="border-slate-300 focus:border-[#27aae1] focus:ring-[#27aae1] rounded-xl text-sm"
                        min={0}
                        step="0.1"
                        value={product.flatSize.height ?? ""}
                        onChange={(e) =>
                          handleSizeChange(
                            idx,
                            "flatSize",
                            "height",
                            e.target.value
                          )
                        }
                      />
                    </div>
                    {shouldShowSpine(product.productName) && (
                      <div>
                        <Label className="text-xs text-slate-600 mb-1 block">Spine</Label>
                        <Input
                          type="number"
                          placeholder="Spine"
                          className="border-slate-300 focus:border-[#27aae1] focus:ring-[#27aae1] rounded-xl text-sm"
                          value={product.flatSize.spine ?? ""}
                          min={0}
                          step="0.1"
                          onChange={(e) =>
                            handleSizeChange(
                              idx,
                              "flatSize",
                              "spine",
                              e.target.value
                            )
                          }
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Close Size (Closed) with Same Dimensions Checkbox */}
                <div className="space-y-2 sm:space-y-3">
                  <div className="flex flex-col space-y-2 sm:space-y-0 sm:flex-row sm:items-center sm:space-x-4">
                    <Label className="text-xs sm:text-sm font-medium text-slate-700">Close Size (Closed)</Label>
                    <div className="flex items-center space-x-2 px-3 py-1.5 bg-[#27aae1]/10 rounded-full border border-[#27aae1]/30 hover:bg-[#27aae1]/20 transition-colors w-fit">
                      <Checkbox
                        id={`same-${idx}`}
                        checked={product.useSameAsFlat}
                        onCheckedChange={(checked) => {
                          const isChecked = Boolean(checked);
                          if (isChecked) {
                            // When checked, sync close size to match flat size
                            updateProduct(idx, {
                              useSameAsFlat: isChecked,
                              closeSize: {
                                width: product.flatSize.width,
                                height: product.flatSize.height,
                                spine: product.flatSize.spine
                              }
                            });
                          } else {
                            // When unchecked, just update the checkbox
                            updateProduct(idx, { useSameAsFlat: isChecked });
                          }
                        }}
                        className="border-[#27aae1]/50 data-[state=checked]:bg-[#27aae1] data-[state=checked]:border-[#27aae1] h-4 w-4"
                      />
                      <Label htmlFor={`same-${idx}`} className="text-xs font-medium text-[#27aae1] cursor-pointer whitespace-nowrap">
                        Use same dimensions as Flat Size
                      </Label>
                    </div>
                  </div>
                  <div className={`grid gap-3 sm:gap-4 ${shouldShowSpine(product.productName) ? 'grid-cols-1 sm:grid-cols-3' : 'grid-cols-1 sm:grid-cols-2'}`}>
                    <div>
                      <Label className="text-xs text-slate-600 mb-1 block">Width</Label>
                      <Input
                        type="number"
                        placeholder="Width"
                        className={`border-slate-300 focus:border-[#27aae1] focus:ring-[#27aae1] rounded-xl text-sm ${
                          product.useSameAsFlat ? 'bg-gray-50' : ''
                        }`}
                        min={0}
                        step="0.1"
                        value={product.closeSize.width ?? ""}
                        onChange={(e) =>
                          handleSizeChange(
                            idx,
                            "closeSize",
                            "width",
                            e.target.value
                          )
                        }
                        disabled={product.useSameAsFlat}
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-slate-600 mb-1 block">Height</Label>
                      <Input
                        type="number"
                        placeholder="Height"
                        className={`border-slate-300 focus:border-[#27aae1] focus:ring-[#27aae1] rounded-xl text-sm ${
                          product.useSameAsFlat ? 'bg-gray-50' : ''
                        }`}
                        min={0}
                        step="0.1"
                        value={product.closeSize.height ?? ""}
                        onChange={(e) =>
                          handleSizeChange(
                            idx,
                            "closeSize",
                            "height",
                            e.target.value
                          )
                        }
                        disabled={product.useSameAsFlat}
                      />
                    </div>
                    {shouldShowSpine(product.productName) && (
                      <div>
                        <Label className="text-xs text-slate-600 mb-1 block">Spine</Label>
                        <Input
                          type="number"
                          placeholder="Spine"
                          className={`border-slate-300 focus:border-[#27aae1] focus:ring-[#27aae1] rounded-xl text-sm ${
                            product.useSameAsFlat ? 'bg-gray-50' : ''
                          }`}
                          value={product.closeSize.spine ?? ""}
                          min={0}
                          step="0.1"
                          onChange={(e) =>
                            handleSizeChange(
                              idx,
                              "closeSize",
                              "spine",
                              e.target.value
                            )
                          }
                          disabled={product.useSameAsFlat}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Production Settings */}
              <div className="space-y-3 sm:space-y-4">
                <h4 className="text-base sm:text-lg font-semibold text-slate-800 flex items-center">
                  <Settings className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-[#27aae1]" />
                  Production Settings
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                  <div>
                    <Label className="mb-2 block text-xs sm:text-sm font-medium text-slate-700">Bleed (cm)</Label>
                    <Input
                      type="number"
                      min={0.3}
                      step="0.1"
                      placeholder="0.3"
                      className="border-slate-300 focus:border-[#27aae1] focus:ring-[#27aae1] rounded-xl text-sm"
                      value={product.bleed ?? ""}
                                                onChange={(e) =>
                            updateProduct(idx, {
                              bleed: e.target.value ? Number(e.target.value) : undefined,
                            })
                          }
                    />
                    <p className="text-xs text-slate-500 mt-1">Min: 0.3 cm</p>
                  </div>
                  <div>
                    <Label className="mb-2 block text-xs sm:text-sm font-medium text-slate-700">Gap (cm)</Label>
                    <Input
                      type="number"
                      min={0.4}
                      step="0.1"
                      placeholder="0.5"
                      className="border-slate-300 focus:border-[#27aae1] focus:ring-[#27aae1] rounded-xl text-sm"
                      value={product.gap ?? ""}
                                                onChange={(e) =>
                            updateProduct(idx, {
                              gap: e.target.value ? Number(e.target.value) : undefined,
                            })
                          }
                    />
                    <p className="text-xs text-slate-500 mt-1">Min: 0.4 cm</p>
                  </div>
                  <div>
                    <Label className="mb-2 block text-xs sm:text-sm font-medium text-slate-700">Gripper (cm)</Label>
                    <Input
                      type="number"
                      min={0}
                      step="0.1"
                      placeholder="0.9"
                      className="border-slate-300 focus:border-[#27aae1] focus:ring-[#27aae1] rounded-xl text-sm"
                      value={product.gripper ?? ""}
                                                onChange={(e) =>
                            updateProduct(idx, {
                              gripper: e.target.value ? Number(e.target.value) : undefined,
                            })
                          }
                    />
                  </div>
                  <div>
                    <Label className="mb-2 block text-xs sm:text-sm font-medium text-slate-700">Other Edges (cm)</Label>
                    <Input
                      type="number"
                      min={0}
                      step="0.1"
                      placeholder="0.5"
                      className="border-slate-300 focus:border-[#27aae1] focus:ring-[#27aae1] rounded-xl text-sm"
                      value={product.otherEdges ?? ""}
                                                onChange={(e) =>
                            updateProduct(idx, {
                              otherEdges: e.target.value ? Number(e.target.value) : undefined,
                            })
                          }
                    />
                  </div>
                </div>
                <p className="text-xs text-slate-500">
                  These settings control imposition layout. Step-4 interprets gap as space between bleed boxes.
                </p>
              </div>

              {/* Paper Details */}
              <div className="space-y-3 sm:space-y-4">
                <div className="flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between">
                  <h4 className="text-base sm:text-lg font-semibold text-slate-800 flex items-center">
                    <div className="w-4 h-4 sm:w-5 sm:h-5 bg-[#27aae1] rounded mr-2 flex items-center justify-center">
                      <span className="text-white text-xs font-bold">P</span>
                    </div>
                    Paper Details
                  </h4>
                  <div className="flex flex-col space-y-2 sm:space-y-0 sm:flex-row sm:items-center sm:space-x-3">
                    <Button 
                      variant="outline" 
                      className="bg-gradient-to-r from-purple-500 to-purple-600 text-white border-0 hover:from-purple-600 hover:to-purple-700 px-3 sm:px-4 py-2 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 text-xs sm:text-sm w-full sm:w-auto"
                      onClick={() => {
                        const paperName = product.papers[0]?.name;
                        handleViewPaperDetails(paperName || '');
                      }}
                      disabled={!product.papers[0]?.name || product.papers[0]?.name === "Select Paper" || product.papers[0]?.name.trim() === ""}
                      title={product.papers[0]?.name && product.papers[0]?.name !== "Select Paper" && product.papers[0]?.name.trim() !== ""
                        ? `View details for ${product.papers[0].name.replace(/\s*\(Custom\)$/, '')}` 
                        : "Select a paper first to view details"
                      }
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View Paper Details
                    </Button>
                    <Button 
                      variant="outline" 
                      className="bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0 hover:from-blue-600 hover:to-blue-700 px-3 sm:px-4 py-2 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 text-xs sm:text-sm w-full sm:w-auto"
                      onClick={() => handleBrowseAvailablePapers()}
                      title="Browse all available papers before selection"
                    >
                      <Search className="w-4 h-4 mr-2" />
                      Browse Available Papers
                    </Button>
                    <Button
                      variant="outline"
                      className="border-[#27aae1] text-[#27aae1] hover:bg-[#27aae1]/10 rounded-xl text-xs sm:text-sm w-full sm:w-auto"
                      size="sm"
                      onClick={() => addPaper(idx)}
                    >
                      <Plus className="h-4 w-4 mr-2" /> Add Paper
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-3 sm:space-y-4">
                  {product.papers.map((paper, pIndex) => (
                    <div
                      key={pIndex}
                      className="border border-slate-200 p-3 sm:p-4 rounded-xl bg-slate-50"
                    >
                      <div className="flex items-center justify-between mb-3 sm:mb-4">
                        <h5 className="font-medium text-slate-700 text-sm sm:text-base">Paper {pIndex + 1}</h5>
                        <div className="flex items-center space-x-2">
                          {product.papers.length > 1 && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removePaper(idx, pIndex)}
                              className="text-red-500 hover:text-red-600 hover:bg-red-50 rounded-xl h-8 w-8"
                              title="Remove paper"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                        <div>
                          <Label className="mb-2 block text-xs sm:text-sm font-medium text-slate-700">Paper Name</Label>
                          <Select
                            value={paper.name || ""}
                            onValueChange={(value) => {
                              // Find the selected paper to get its GSM options
                              const selectedPaper = availablePapers.find(p => p.name === value);
                              if (selectedPaper && selectedPaper.gsmOptions.length > 0) {
                                // Auto-update GSM to the first available option
                                handlePaperChange(idx, pIndex, "gsm", selectedPaper.gsmOptions[0]);
                              }
                              handlePaperChange(idx, pIndex, "name", value);
                            }}
                          >
                            <SelectTrigger className="border-slate-300 focus:border-[#27aae1] focus:ring-[#27aae1] rounded-xl bg-white text-sm">
                              <SelectValue placeholder="Select paper type" />
                            </SelectTrigger>
                            <SelectContent className="bg-white border border-gray-200 shadow-lg max-h-60 overflow-y-auto dropdown-scroll">
                              {loadingPapers ? (
                                <SelectItem value="loading" disabled>Loading papers...</SelectItem>
                              ) : (
                                <>
                                  {/* Show current value if it doesn't match available options */}
                                  {!availablePapers.find(p => p.name === paper.name) && paper.name && paper.name.trim() !== "" && paper.name !== "Select Paper" && (
                                    <SelectItem value={paper.name}>
                                      <div className="flex flex-col">
                                        <span className="font-medium">{paper.name} (Custom)</span>
                                        <span className="text-xs text-gray-500">From quote template</span>
                                      </div>
                                    </SelectItem>
                                  )}
                                  {/* Show available options */}
                                  {availablePapers.map((paperOption) => (
                                    <SelectItem key={paperOption.name} value={paperOption.name || "unknown"}>
                                      <div className="flex flex-col">
                                        <span className="font-medium">{paperOption.name || "Unknown Paper"}</span>
                                        <span className="text-xs text-gray-500">
                                          {paperOption.suppliers.join(', ')}
                                        </span>
                                      </div>
                                    </SelectItem>
                                  ))}
                                </>
                              )}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="mb-2 block text-xs sm:text-sm font-medium text-slate-700">GSM</Label>
                          <Select
                            value={paper.gsm || ""}
                            onValueChange={(value) => handlePaperChange(idx, pIndex, "gsm", value)}
                          >
                            <SelectTrigger className="border-slate-300 focus:border-[#27aae1] focus:ring-[#27aae1] rounded-xl bg-white text-sm">
                              <SelectValue placeholder="Select GSM" />
                            </SelectTrigger>
                            <SelectContent className="bg-white border border-gray-200 shadow-lg max-h-60 overflow-y-auto dropdown-scroll">
                              {(() => {
                                // Find the selected paper to get its GSM options
                                // Handle custom paper names (remove "(Custom)" suffix)
                                const cleanPaperName = paper.name.replace(/\s*\(Custom\)$/, '');
                                console.log('GSM Dropdown Debug:', {
                                  paperName: paper.name,
                                  cleanPaperName,
                                  paperGsm: paper.gsm,
                                  availablePapers: availablePapers.map(p => p.name)
                                });
                                
                                const selectedPaper = availablePapers.find(p => p.name === cleanPaperName) || 
                                                     availablePapers.find(p => p.name.includes(cleanPaperName)) ||
                                                     availablePapers.find(p => cleanPaperName.includes(p.name.replace(/\d+gsm$/i, '').trim())) ||
                                                     // Try to find by base name (e.g., "Premium Card Stock" matches "Premium Card Stock 350gsm")
                                                     availablePapers.find(p => {
                                                       const baseName = p.name.replace(/\d+gsm$/i, '').trim();
                                                       return baseName.toLowerCase() === cleanPaperName.toLowerCase();
                                                     });
                                
                                console.log('Selected paper for GSM:', selectedPaper);
                                
                                if (!selectedPaper) {
                                  // If no match found, show the current GSM value as a custom option
                                  if (paper.gsm && paper.gsm !== "Select GSM") {
                                    console.log('Showing custom GSM option:', paper.gsm);
                                    return (
                                      <>
                                        <SelectItem value={paper.gsm}>
                                          {paper.gsm} gsm (Custom)
                                        </SelectItem>
                                        <SelectItem value="no-paper" disabled>Select paper first</SelectItem>
                                      </>
                                    );
                                  }
                                  console.log('No paper selected, showing disabled message');
                                  return <SelectItem value="no-paper" disabled>Select paper first</SelectItem>;
                                }
                                
                                console.log('Showing GSM options from selected paper:', selectedPaper.gsmOptions);
                                return selectedPaper.gsmOptions.map((gsm) => (
                                  <SelectItem key={gsm} value={gsm || "unknown"}>
                                    {gsm || "Unknown"} gsm
                                  </SelectItem>
                                ));
                              })()}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Finishing Options */}
              <div className="space-y-4 sm:space-y-6">
                <div className="flex flex-col space-y-2">
                  <h4 className="text-base sm:text-lg font-semibold text-slate-800 flex items-center">
                    <Settings className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-[#27aae1]" />
                    Finishing Options
                  </h4>
                  {isTemplateQuote && product.finishing && product.finishing.length > 0 && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <div className="flex items-start space-x-2">
                        <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center mt-0.5 flex-shrink-0">
                          <span className="text-white text-xs font-bold">✓</span>
                        </div>
                        <div className="text-green-700">
                          <p className="text-sm font-medium">Finishing options auto-filled from existing customer data</p>
                          <p className="text-xs mt-1">
                            Selected options: <span className="font-medium">{product.finishing.join(', ')}</span>
                          </p>
                          <p className="text-xs mt-1 text-green-600">
                            You can modify these selections as needed for your new quote.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {[
                    "Embossing",
                    "Lamination",
                    "Velvet Lamination",
                    "Foiling",
                    "Die Cutting",
                    "UV Spot",
                    "Folding",
                    "Padding",
                    "Varnishing",
                  ].map((option) => {
                    const isSelected = isFinishingSelected(product, option);
                    const isFromTemplate = isSelected && formData.products.length > 0 && 
                      formData.products[0].productName && 
                      formData.products[0].productName !== "Business Card" &&
                      formData.products[0].finishing && 
                      formData.products[0].finishing.length > 0;
                    
                    return (
                      <div key={option} className="group">
                        <div className={`flex items-center justify-between px-3 sm:px-4 py-3 rounded-lg transition-all duration-200 cursor-pointer hover:bg-gray-50 ${
                          isSelected
                            ? 'bg-[#27aae1]/10'
                            : 'bg-transparent'
                        }`}>
                          <div className="flex items-center space-x-3 min-w-0 flex-1">
                            <Checkbox
                              id={`fin-${idx}-${option}`}
                              checked={isSelected}
                              onCheckedChange={(checked) => {
                                console.log(`🔄 Checkbox ${option} changed to:`, checked);
                                if (!checked) {
                                  // Remove all variants of this finishing option (case-insensitive)
                                  const updatedFinishing = product.finishing.filter(f => {
                                    if (typeof f === 'string') {
                                      const normalizedFinishing = f.toLowerCase();
                                      const normalizedOption = option.toLowerCase();
                                      return !(normalizedFinishing === normalizedOption || normalizedFinishing.startsWith(normalizedOption + '-'));
                                    }
                                    return true;
                                  });
                                  updateProduct(idx, { finishing: updatedFinishing });
                                } else {
                                  // Add default side when checked
                                  const finishingKey = product.sides === "2" ? `${option}-Front` : option;
                                  const updatedFinishing = [...product.finishing.filter(f => {
                                    if (typeof f === 'string') {
                                      const normalizedFinishing = f.toLowerCase();
                                      const normalizedOption = option.toLowerCase();
                                      return !(normalizedFinishing === normalizedOption || normalizedFinishing.startsWith(normalizedOption + '-'));
                                    }
                                    return true;
                                  }), finishingKey];
                                  updateProduct(idx, { finishing: updatedFinishing });
                                }
                              }}
                              className="border-gray-300 data-[state=checked]:bg-[#27aae1] data-[state=checked]:border-[#27aae1] h-4 w-4 rounded-md flex-shrink-0"
                            />
                            <div className="flex items-center space-x-2 min-w-0 flex-1">
                              <Label
                                htmlFor={`fin-${idx}-${option}`}
                                className="text-xs sm:text-sm font-medium text-gray-700 cursor-pointer group-hover:text-gray-900 transition-colors break-words"
                              >
                                {option}
                              </Label>
                              {isFromTemplate && (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 flex-shrink-0" title="Auto-filled from existing customer data">
                                  Auto
                                </span>
                              )}
                            </div>
                          </div>
                        
                        {product.sides === "2" && isFinishingSelected(product, option) && (
                          <Select
                            value={product.finishing.find(f => f.startsWith(option))?.split('-')[1] || "Front"}
                            onValueChange={(side) => {
                              // Remove old variants and add new one
                              const updatedFinishing = product.finishing.filter(f => !f.startsWith(option));
                              updatedFinishing.push(`${option}-${side}`);
                              updateProduct(idx, { finishing: updatedFinishing });
                            }}
                          >
                            <SelectTrigger className="w-16 sm:w-20 h-7 border-gray-200 focus:border-[#27aae1] focus:ring-1 focus:ring-[#27aae1] rounded-md text-xs bg-white shadow-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-white border border-gray-200 shadow-lg max-h-60 overflow-y-auto dropdown-scroll">
                              <SelectItem value="Front">Front</SelectItem>
                              <SelectItem value="Back">Back</SelectItem>
                              <SelectItem value="Both">Both</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                    </div>
                    );
                  })}
                </div>
                
                {/* Finishing Comments */}
                <div className="space-y-2 sm:space-y-3">
                  <Label className="text-xs sm:text-sm font-medium text-slate-700">
                    Finishing Comments
                  </Label>
                  <textarea
                    placeholder="Add specific details for finishing options (e.g., 'Gold foil', 'Silver foil', 'Matte lamination', 'Spot UV on logo')"
                    value={product.finishingComments || ''}
                    onChange={(e) => updateProduct(idx, { finishingComments: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-[#27aae1] focus:ring-[#27aae1] resize-none text-sm"
                    rows={3}
                  />
                  <p className="text-xs text-slate-500">
                    Use this field to specify exact finishing details like foil colors, lamination types, or specific areas for spot treatments.
                  </p>
                </div>




              </div>
            </CardContent>
          </Card>
        ))}
        
        {/* === Costing Section === */}
        {formData.products.length > 0 && (
          <Card className="bg-white border border-slate-200 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold text-slate-800 flex items-center">
                <Palette className="w-5 h-5 mr-2 text-[#27aae1]" />
                Costing Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Automatic Printing Method Display */}
              <div className="space-y-3">
                <Label className="text-sm font-medium text-slate-700">
                  Selected Printing Method
                </Label>
                <div className="flex items-center space-x-2 p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <div className={`w-3 h-3 rounded-full ${
                    formData.products[0]?.printingSelection === "Digital" 
                      ? 'bg-blue-500' 
                      : 'bg-green-500'
                  }`}></div>
                  <span className="text-sm font-medium text-slate-700">
                    {formData.products[0]?.printingSelection || "Not Selected"}
                  </span>
                  <span className="text-xs text-slate-500 ml-2">
                    (Change in Basic Information above)
                  </span>
                </div>
              </div>

              {/* Digital Costing Results */}
              {formData.products[0]?.printingSelection === "Digital" && digitalCostingResults.length > 0 ? (
                <div className="space-y-3">
                  <Label className="text-sm font-medium text-slate-700">
                    Digital Cut-Size Options
                  </Label>
                  <div className="space-y-2">
                    {digitalCostingResults.map((result, idx) => (
                      <div
                        key={idx}
                        className={`p-3 rounded-lg border cursor-pointer transition-all ${
                          selectedDigitalOption === result.option.label
                            ? 'border-[#27aae1] bg-[#27aae1]/5'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => setSelectedDigitalOption(result.option.label)}
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <span className="font-medium text-slate-800">{result.option.label}</span>
                            <div className="text-xs text-slate-600 mt-1">
                              {result.upsPerSheet} ups per sheet • {result.parents} parent sheets
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold text-slate-800">AED {result.total.toFixed(2)}</div>
                            <div className="text-xs text-slate-600">
                              Paper: AED {result.paper.toFixed(2)} • Clicks: AED {result.clicks.toFixed(2)}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : formData.products[0]?.printingSelection === "Digital" ? (
                <div className="text-center py-4">
                  <div className="text-sm text-slate-600">Calculating digital pricing options...</div>
                </div>
              ) : null}

              {/* Offset Costing Results */}
              {formData.products[0]?.printingSelection === "Offset" && offsetCostingResult && (
                <div className="space-y-3">
                  <Label className="text-sm font-medium text-slate-700">
                    Offset Press Options
                  </Label>
                  <div className="space-y-2">
                    {/* 35x50 Press */}
                    <div
                      className={`p-3 rounded-lg border cursor-pointer transition-all ${
                        selectedOffsetPress === '35×50 cm'
                          ? 'border-[#27aae1] bg-[#27aae1]/5'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => offsetCostingResult.pressPerParent > 0 && setSelectedOffsetPress('35×50 cm')}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <span className="font-medium text-slate-800">35×50 cm Press</span>
                          <div className="text-xs text-slate-600 mt-1">
                            {offsetCostingResult.upsPerPress} ups per press • {offsetCostingResult.pressSheets} press sheets • {offsetCostingResult.parents} parent sheets
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-slate-800">AED {offsetCostingResult.total.toFixed(2)}</div>
                          <div className="text-xs text-slate-600">
                            Paper: AED {offsetCostingResult.paper.toFixed(2)} • Plates: AED {offsetCostingResult.plates.toFixed(2)}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 52x72 Press (Disabled) */}
                    <div className="p-3 rounded-lg border border-gray-200 bg-gray-50 opacity-60">
                      <div className="flex justify-between items-center">
                        <div>
                          <span className="font-medium text-slate-600">52×72 cm Press</span>
                          <div className="text-xs text-slate-500 mt-1">
                            Not cuttable from 100×70 parent
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-slate-400">Disabled</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Loading State */}
              {loadingPricing && (
                <div className="text-center py-4">
                  <div className="text-sm text-slate-600">Loading pricing data...</div>
                </div>
              )}

              {/* No Printing Method Selected */}
              {!formData.products[0]?.printingSelection && !loadingPricing && (
                <div className="text-center py-4">
                  <div className="text-sm text-slate-600">Please select a printing method in Basic Information to see costing analysis.</div>
                </div>
              )}

              {/* Error State */}
              {!loadingPricing && (!digitalPricing || !offsetPricing) && (
                <div className="text-center py-4">
                  <div className="text-sm text-red-600">Unable to load pricing data. Using default values.</div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
        
        {/* Add Product Button */}
        <div className="text-center">
          <Button
            variant="outline"
            className="py-4 sm:py-6 px-6 sm:px-8 border-2 border-dashed border-[#27aae1]/50 text-[#27aae1] hover:bg-[#27aae1]/10 hover:border-[#27aae1]/70 rounded-xl transition-all duration-300 w-full sm:w-auto text-sm sm:text-base"
            onClick={addProduct}
          >
            <Plus className="h-4 w-4 sm:h-5 sm:w-5 mr-2" /> Add Another Product
          </Button>
        </div>

        {/* Paper Details Dialog */}
        <PaperDetailsDialog />
      </div>
    </>
  );
};

export default Step3ProductSpec;