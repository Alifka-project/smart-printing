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
import { useState } from "react";
import type { QuoteFormData, Paper, Product } from "@/types";
import { getProductConfig, shouldShowSpine, PRODUCT_CONFIGS } from "@/constants/product-config";

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

// Standard product list for proper recording
const STANDARD_PRODUCTS = Object.keys(PRODUCT_CONFIGS);



// helper product kosong (sesuai tipe Product)
const createEmptyProduct = (): Product => ({
  productName: "Business Card", // Set a default product so sizes are auto-populated
  paperName: "",
  quantity: 100,
  sides: "1",
  printingSelection: "Digital",
  flatSize: { width: 9, height: 5.5, spine: 0 }, // These will be overridden by handleProductNameChange
  closeSize: { width: 9, height: 5.5, spine: 0 },
  useSameAsFlat: true,
  papers: [{ name: "Select Paper", gsm: "Select GSM" }],
  finishing: [],
  finishingComments: '', // Comments for finishing details (e.g., "gold foil", "silver foil")
  colors: { front: "", back: "" }
});

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
  
  // Debug logging for autofill
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
  }, [formData, availablePapers]);
  
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
          if (formData.products && formData.products.length > 0) {
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
            
            // Only update if there are actual changes
            if (JSON.stringify(updatedProducts) !== JSON.stringify(formData.products)) {
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
  }, [formData.products.length]); // Only run when products array length changes
  


  // Ensure we have at least one product, but don't override auto-filled data
  React.useEffect(() => {
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
  }, [formData.products.length, setFormData]);

  // Ensure colors are properly initialized for all products
  React.useEffect(() => {
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
  }, [formData.products.length]);





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
    const product = formData.products[idx];
    const config = getProductConfig(productName);
    
    if (config) {
      // Auto-populate sizes and other defaults from product config
      const updates: Partial<Product> = {
        productName,
        flatSize: config.defaultSizes,
        closeSize: config.defaultSizes,
        useSameAsFlat: true
      };
      
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

  // Auto-populate product details for products with default names
  React.useEffect(() => {
    if (formData.products && formData.products.length > 0) {
      formData.products.forEach((product, idx) => {
        // If product has a name but sizes are still default (0 or empty), auto-populate
        if (product.productName && 
            (product.flatSize.width === 0 || product.flatSize.height === 0 || 
             product.flatSize.width === null || product.flatSize.height === null)) {
          console.log(`Auto-populating sizes for ${product.productName}`);
          handleProductNameChange(idx, product.productName);
        }
      });
    }
  }, [formData.products]);

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
        <DialogContent className="max-w-5xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <div className="w-5 h-5 bg-blue-600 rounded flex items-center justify-center">
                <span className="text-white text-xs font-bold">P</span>
              </div>
              <span>
                {paperDetails && paperDetails.browseMode 
                  ? 'Browse Available Papers' 
                  : `Paper Details: ${selectedPaperForDetails}`
                }
              </span>
            </DialogTitle>
          </DialogHeader>
          
          {loadingPaperDetails ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600">Loading paper details...</span>
            </div>
          ) : paperDetails ? (
            <div className="space-y-6">
              {paperDetails.browseMode && (
                <div className="space-y-4">
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border border-green-200">
                    <div className="text-center">
                      <h3 className="text-lg font-semibold text-green-800 mb-2">Browse All Available Papers</h3>
                      <p className="text-sm text-green-700">{paperDetails.message}</p>
                    </div>
                  </div>
                  
                  <div className="grid gap-4">
                    {paperDetails.availablePapers?.map((paper, idx) => (
                      <div key={idx} className="border border-gray-200 rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900 text-lg mb-2">{paper.name}</h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
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
                                    <div key={gIdx} className="text-xs bg-blue-100 px-2 py-1 rounded mb-1">
                                      {gsm} gsm
                                    </div>
                                  ))}
                                </div>
                              </div>
                              <div>
                                <span className="font-medium">Paper Type:</span>
                                <div className="mt-1 text-xs bg-purple-100 px-2 py-1 rounded">
                                  {paper.paperType || 'Standard'}
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="ml-4">
                            <Button
                              variant="outline"
                              className="bg-blue-600 text-white border-blue-600 hover:bg-blue-700 hover:border-blue-700"
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
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <div className="flex items-start space-x-3">
                        <div className="w-6 h-6 bg-yellow-600 rounded mt-1 flex items-center justify-center">
                          <span className="text-white text-xs font-bold">!</span>
                        </div>
                        <div>
                          <h4 className="font-medium text-yellow-800 mb-2">Paper Not Found in Database</h4>
                          <p className="text-sm text-yellow-700 mb-3">{paperDetails.message}</p>
                          
                          {paperDetails.similarPapers && paperDetails.similarPapers.length > 0 && (
                            <div className="mt-4 pt-3 border-t border-yellow-200">
                              <p className="text-sm font-medium text-yellow-800 mb-2">Similar papers found:</p>
                              <div className="space-y-2">
                                {paperDetails.similarPapers.map((paper, idx) => (
                                  <div key={idx} className="bg-yellow-50 p-3 rounded border border-yellow-200">
                                    <div className="flex justify-between items-start">
                                      <div>
                                        <p className="text-xs font-medium text-yellow-900">{paper.name}</p>
                                        <p className="text-xs text-yellow-700">Supplier: {paper.supplier}</p>
                                      </div>
                                      <div className="text-right">
                                        <p className="font-bold text-yellow-900 text-sm">${paper.cost?.toFixed(2) || '0.00'}</p>
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
                              <p className="text-sm font-medium text-yellow-800 mb-2">Other available papers:</p>
                              <div className="flex flex-wrap gap-2">
                                {paperDetails.availableAlternatives.map((alt, idx) => (
                                  <span key={idx} className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs">
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
                      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-blue-600">{paperDetails.totalMaterials || 0}</div>
                            <div className="text-sm text-gray-600">Total Materials</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-green-600">{paperDetails.totalSuppliers || 0}</div>
                            <div className="text-sm text-gray-600">Available Suppliers</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-purple-600">{paperDetails.gsmDetails?.length || 0}</div>
                            <div className="text-sm text-gray-600">GSM Options</div>
                          </div>
                        </div>
                        
                        <div className="mt-4 pt-4 border-t border-blue-200">
                          <div className="text-center">
                            <p className="text-sm text-gray-600">
                              <span className="font-medium">Paper Type:</span> {paperDetails.paperName || 'Unknown'}
                            </p>
                            <p className="text-sm text-gray-600 mt-1">
                              <span className="font-medium">Database Status:</span> 
                              <span className="text-green-600 font-medium ml-1">Active</span>
                            </p>
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  {paperDetails.gsmDetails && paperDetails.gsmDetails.length > 0 ? (
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">
                        Available GSM Options
                      </h3>
                      
                      {paperDetails.gsmDetails.map((gsmDetail, idx) => (
                        <div key={idx} className="border border-gray-200 rounded-lg p-4 bg-white shadow-sm">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="text-lg font-semibold text-gray-800">
                              {gsmDetail.gsm} GSM
                            </h4>
                            <div className="text-right">
                              <div className="text-sm text-gray-600">
                                Cost Range: <span className="font-medium text-green-600">
                                  ${gsmDetail.costRange?.min?.toFixed(2) || '0.00'} - ${gsmDetail.costRange?.max?.toFixed(2) || '0.00'}
                                </span>
                              </div>
                              <div className="text-sm text-gray-600">
                                Avg: <span className="font-medium text-blue-600">
                                  ${gsmDetail.averageCost?.toFixed(2) || '0.00'}
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="space-y-3">
                            <h5 className="font-medium text-gray-700 text-sm">
                              Suppliers ({gsmDetail.suppliers?.length || 0}):
                            </h5>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {gsmDetail.suppliers?.map((supplier, sIdx) => (
                                <div key={sIdx} className="border border-gray-100 rounded-md p-3 bg-gray-50">
                                  <div className="flex justify-between items-start mb-2">
                                    <h6 className="font-medium text-gray-800">{supplier.name}</h6>
                                    <span className="text-sm font-semibold text-green-600">
                                      ${supplier.cost?.toFixed(2) || '0.00'}/{supplier.unit || 'unit'}
                                    </span>
                                  </div>
                                  
                                  <div className="space-y-1 text-xs text-gray-600">
                                    {supplier.contact && (
                                      <div>Contact: {supplier.contact}</div>
                                    )}
                                    {supplier.email && (
                                      <div>Email: {supplier.email}</div>
                                    )}
                                    {supplier.phone && (
                                      <div>Phone: {supplier.countryCode} {supplier.phone}</div>
                                    )}
                                    {supplier.address && (
                                      <div>Address: {supplier.address}</div>
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
                      <p className="text-sm">No GSM options available for this paper</p>
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
      <div className="space-y-8">
      <div className="text-center space-y-3">
        <h3 className="text-2xl font-bold text-slate-900">Product Specifications</h3>
        <p className="text-slate-600">
          {isTemplateQuote 
            ? `${formData.products.length} product(s) loaded from selected quote template. You can modify these specifications as needed.`
            : "Define the product specifications for your quote"
          }
        </p>
      </div>

      {/* Template Quote Indicator */}
      {isTemplateQuote && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-2">
              <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center mt-0.5">
                <span className="text-white text-xs font-bold">📋</span>
              </div>
              <div className="text-blue-700">
                <p className="font-medium mb-1">Quote Template Loaded</p>
                <p className="text-sm">
                  Product specifications have been pre-filled from the selected quote template: <strong>{formData.products.length} product(s) loaded</strong>
                </p>
                <div className="text-sm mt-1 space-y-1">
                  {formData.products.map((product, idx) => (
                    <div key={idx} className="border-l-2 border-blue-300 pl-2">
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
                <p className="text-sm mt-1 text-blue-600">
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
              className="text-blue-600 border-blue-300 hover:bg-blue-50"
            >
              Clear Template
            </Button>
          </div>
        </div>
      )}

      {/* Products */}
      {formData.products.map((product, idx) => (
        <Card key={idx} className="border-0 shadow-lg">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                  <div className="w-5 h-5 bg-white rounded flex items-center justify-center">
                    <span className="text-blue-600 text-xs font-bold">P</span>
                  </div>
                </div>
                <div>
                  <CardTitle className="text-lg text-slate-900">
                    {product.productName ? product.productName : `Product ${idx + 1}`}
                  </CardTitle>
                  <p className="text-sm text-slate-500">Product specifications and details</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                {formData.products.length > 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeProduct(idx)}
                    className="text-red-500 hover:text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4 mr-2" /> Remove
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-8">
            {/* Basic Information and Color Options - Two Column Layout */}
            <div className="grid md:grid-cols-2 gap-8">
              {/* Basic Product Information */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-slate-800 flex items-center">
                  <FileText className="w-5 h-5 mr-2 text-blue-600" />
                  Basic Information
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="mb-2 block text-sm font-medium text-slate-700">Product Name</Label>
                    <Select
                      value={product.productName}
                      onValueChange={(v) => updateProduct(idx, { productName: v })}
                    >
                      <SelectTrigger className="w-full border-slate-300 focus:border-blue-500 focus:ring-blue-500 rounded-xl bg-white">
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
                    <Label className="mb-2 block text-sm font-medium text-slate-700">Quantity</Label>
                    <Input
                      type="number"
                      min={1}
                      placeholder="100"
                      className="border-slate-300 focus:border-blue-500 focus:ring-blue-500 rounded-xl"
                      value={product.quantity ?? ""}
                      onChange={(e) =>
                        updateProduct(idx, {
                          quantity: e.target.value ? Number(e.target.value) : null,
                        })
                      }
                    />
                  </div>

                  <div>
                    <Label className="mb-2 block text-sm font-medium text-slate-700">Sides</Label>
                    <Select
                      value={product.sides}
                      onValueChange={(v) =>
                        updateProduct(idx, { sides: v as "1" | "2" })
                      }
                    >
                      <SelectTrigger className="w-full border-slate-300 focus:border-blue-500 focus:ring-blue-500 rounded-xl bg-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-white border border-gray-200 shadow-lg max-h-60 overflow-y-auto dropdown-scroll">
                        <SelectItem value="1">1 Side</SelectItem>
                        <SelectItem value="2">2 Sides</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="mb-2 block text-sm font-medium text-slate-700">Printing Selection</Label>
                    <Select
                      value={product.printingSelection}
                      onValueChange={(v) =>
                        updateProduct(idx, {
                          printingSelection: v as Product["printingSelection"],
                        })
                      }
                    >
                      <SelectTrigger className="w-full border-slate-300 focus:border-blue-500 focus:ring-blue-500 rounded-xl bg-white">
                        <SelectValue placeholder="Select Printing" />
                      </SelectTrigger>
                                              <SelectContent className="bg-white border border-gray-200 shadow-lg max-h-60 overflow-y-auto dropdown-scroll">
                          <SelectItem value="Digital">Digital</SelectItem>
                          <SelectItem value="Offset">Offset</SelectItem>
                          <SelectItem value="Either">Either</SelectItem>
                          <SelectItem value="Both">Both</SelectItem>
                        </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Color Options */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-slate-800 flex items-center">
                  <Palette className="w-5 h-5 mr-2 text-blue-600" />
                  Color Options
                </h4>
                <div className="space-y-4">
                  <div>
                    <Label className="mb-2 block text-sm font-medium text-slate-700">Front Side</Label>
                    <Select
                      value={product.colors?.front || ""}
                      onValueChange={(v) => updateProduct(idx, { 
                        colors: { ...product.colors, front: v } 
                      })}
                    >
                      <SelectTrigger className="w-full border-slate-300 focus:border-blue-500 focus:ring-blue-500 rounded-xl bg-white">
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
                      <Label className="mb-2 block text-sm font-medium text-slate-700">Back Side</Label>
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
                        <SelectTrigger className="w-full border-slate-300 focus:border-blue-500 focus:ring-blue-500 rounded-xl bg-white">
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
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-slate-800 flex items-center">
                <Ruler className="w-5 h-5 mr-2 text-blue-600" />
                Size Details (cm)
              </h4>
              

              
              {/* Flat Size (Open) */}
              <div className="space-y-3">
                <Label className="text-sm font-medium text-slate-700">Flat Size (Open)</Label>
                <div className={`grid gap-4 ${shouldShowSpine(product.productName) ? 'grid-cols-3' : 'grid-cols-2'}`}>
                  <div>
                    <Label className="text-xs text-slate-600 mb-1 block">Width</Label>
                    <Input
                      type="number"
                      placeholder="Width"
                      className="border-slate-300 focus:border-blue-500 focus:ring-blue-500 rounded-xl"
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
                      className="border-slate-300 focus:border-blue-500 focus:ring-blue-500 rounded-xl"
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
                        className="border-slate-300 focus:border-blue-500 focus:ring-blue-500 rounded-xl"
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
              <div className="space-y-3">
                <div className="flex items-center space-x-4">
                  <Label className="text-sm font-medium text-slate-700">Close Size (Closed)</Label>
                  <div className="flex items-center space-x-2 px-3 py-1.5 bg-blue-50 rounded-full border border-blue-200 hover:bg-blue-100 transition-colors">
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
                      className="border-blue-300 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 h-4 w-4"
                    />
                    <Label htmlFor={`same-${idx}`} className="text-xs font-medium text-blue-700 cursor-pointer whitespace-nowrap">
                      Use same dimensions as Flat Size
                    </Label>
                  </div>

                </div>
                <div className={`grid gap-4 ${shouldShowSpine(product.productName) ? 'grid-cols-3' : 'grid-cols-2'}`}>
                  <div>
                    <Label className="text-xs text-slate-600 mb-1 block">Width</Label>
                    <Input
                      type="number"
                      placeholder="Width"
                      className={`border-slate-300 focus:border-blue-500 focus:ring-blue-500 rounded-xl ${
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
                      className={`border-slate-300 focus:border-blue-500 focus:ring-blue-500 rounded-xl ${
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
                        className={`border-slate-300 focus:border-blue-500 focus:ring-blue-500 rounded-xl ${
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

            {/* Paper Details */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-lg font-semibold text-slate-800 flex items-center">
                  <div className="w-5 h-5 bg-blue-600 rounded mr-2 flex items-center justify-center">
                    <span className="text-white text-xs font-bold">P</span>
                  </div>
                  Paper Details
                </h4>
                <div className="flex items-center space-x-3">
                  <Button 
                    variant="outline" 
                    className="bg-gradient-to-r from-purple-500 to-purple-600 text-white border-0 hover:from-purple-600 hover:to-purple-700 px-4 py-2 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
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
                    className="bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0 hover:from-blue-600 hover:to-blue-700 px-4 py-2 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                    onClick={() => handleBrowseAvailablePapers()}
                    title="Browse all available papers before selection"
                  >
                    <Search className="w-4 h-4 mr-2" />
                    Browse Available Papers
                  </Button>
                  <Button
                    variant="outline"
                    className="border-blue-500 text-blue-600 hover:bg-blue-50 rounded-xl"
                    size="sm"
                    onClick={() => addPaper(idx)}
                  >
                    <Plus className="h-4 w-4 mr-2" /> Add Paper
                  </Button>
                </div>
              </div>
              
              <div className="space-y-4">
                {product.papers.map((paper, pIndex) => (
                  <div
                    key={pIndex}
                    className="border border-slate-200 p-4 rounded-xl bg-slate-50"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h5 className="font-medium text-slate-700">Paper {pIndex + 1}</h5>
                      <div className="flex items-center space-x-2">

                        {product.papers.length > 1 && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removePaper(idx, pIndex)}
                            className="text-red-500 hover:text-red-600 hover:bg-red-50 rounded-xl"
                            title="Remove paper"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label className="mb-2 block text-sm font-medium text-slate-700">Paper Name</Label>
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
                          <SelectTrigger className="border-slate-300 focus:border-blue-500 focus:ring-blue-500 rounded-xl bg-white">
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
                        <Label className="mb-2 block text-sm font-medium text-slate-700">GSM</Label>
                        <Select
                          value={paper.gsm || ""}
                          onValueChange={(value) => handlePaperChange(idx, pIndex, "gsm", value)}
                        >
                          <SelectTrigger className="border-slate-300 focus:border-blue-500 focus:ring-blue-500 rounded-xl bg-white">
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
            <div className="space-y-6">
              <h4 className="text-lg font-semibold text-slate-800 flex items-center">
                <Settings className="w-5 h-5 mr-2 text-blue-600" />
                Finishing Options
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {[
                  "Embossing",
                  "UV Spot", 
                  "Lamination",
                  "Foiling",
                  "Die Cutting",
                  "Varnishing",
                ].map((option) => (
                  <div key={option} className="group">
                    <div className={`flex items-center justify-between px-4 py-3 rounded-lg transition-all duration-200 cursor-pointer hover:bg-gray-50 ${
                      product.finishing.some(f => f.startsWith(option))
                        ? 'bg-blue-50'
                        : 'bg-transparent'
                    }`}>
                      <div className="flex items-center space-x-3">
                        <Checkbox
                          id={`fin-${idx}-${option}`}
                          checked={product.finishing.some(f => f.startsWith(option))}
                          onCheckedChange={(checked) => {
                            if (!checked) {
                              // Remove all variants of this finishing option
                              const updatedFinishing = product.finishing.filter(f => !f.startsWith(option));
                              updateProduct(idx, { finishing: updatedFinishing });
                            } else {
                              // Add default side when checked
                              const finishingKey = product.sides === "2" ? `${option}-Front` : option;
                              const updatedFinishing = [...product.finishing.filter(f => !f.startsWith(option)), finishingKey];
                              updateProduct(idx, { finishing: updatedFinishing });
                            }
                          }}
                          className="border-gray-300 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 h-4 w-4 rounded-md"
                        />
                        <Label
                          htmlFor={`fin-${idx}-${option}`}
                          className="text-sm font-medium text-gray-700 cursor-pointer group-hover:text-gray-900 transition-colors"
                        >
                          {option}
                        </Label>
                      </div>
                      
                      {product.sides === "2" && product.finishing.some(f => f.startsWith(option)) && (
                        <Select
                          value={product.finishing.find(f => f.startsWith(option))?.split('-')[1] || "Front"}
                          onValueChange={(side) => {
                            // Remove old variants and add new one
                            const updatedFinishing = product.finishing.filter(f => !f.startsWith(option));
                            updatedFinishing.push(`${option}-${side}`);
                            updateProduct(idx, { finishing: updatedFinishing });
                          }}
                        >
                          <SelectTrigger className="w-20 h-7 border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-md text-xs bg-white shadow-sm">
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
                ))}
              </div>
              
              {/* Finishing Comments */}
              <div className="space-y-3">
                <Label className="text-sm font-medium text-slate-700">
                  Finishing Comments
                </Label>
                <textarea
                  placeholder="Add specific details for finishing options (e.g., 'Gold foil', 'Silver foil', 'Matte lamination', 'Spot UV on logo')"
                  value={product.finishingComments || ''}
                  onChange={(e) => updateProduct(idx, { finishingComments: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-blue-500 focus:ring-blue-500 resize-none"
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
      
      {/* Add Product Button */}
      <div className="text-center">
        <Button
          variant="outline"
          className="py-6 px-8 border-2 border-dashed border-blue-300 text-blue-600 hover:bg-blue-50 hover:border-blue-400 rounded-xl transition-all duration-300"
          onClick={addProduct}
        >
          <Plus className="h-5 w-5 mr-2" /> Add Another Product
        </Button>
      </div>

      {/* Paper Details Dialog */}
      <PaperDetailsDialog />
        </div>
      </>
    );
};

export default Step3ProductSpec;