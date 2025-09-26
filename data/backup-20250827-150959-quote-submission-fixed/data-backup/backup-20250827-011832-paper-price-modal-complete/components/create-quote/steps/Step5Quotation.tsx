"use client";

import * as React from "react";
import type { FC } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Trash2, Calculator, Settings, Package } from "lucide-react";
import { Label } from "@/components/ui/label";
import type { QuoteFormData } from "@/types";
import type { OtherQty } from "@/lib/quote-pdf";

const currency = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
    n
  );

interface Step5Props {
  formData: QuoteFormData;
  setFormData: React.Dispatch<React.SetStateAction<QuoteFormData>>;
  otherQuantities: OtherQty[];
  setOtherQuantities: React.Dispatch<React.SetStateAction<OtherQty[]>>;
  onOpenSave: () => void;
  isEditMode?: boolean;
  selectedQuoteId?: string | null;
}

const Step5Quotation: FC<Step5Props> = ({
  formData,
  setFormData,
  otherQuantities,
  setOtherQuantities,
  onOpenSave,
}) => {
  // State for included/excluded products
  const [includedProducts, setIncludedProducts] = React.useState<Set<number>>(
    new Set(formData.products.map((_, index) => index))
  );

  // Validation state
  const [validationErrors, setValidationErrors] = React.useState<string[]>([]);

  // Validate form data before allowing save
  const validateFormData = () => {
    const errors: string[] = [];

    // Check if client information is complete
    if (!formData.client.email || !formData.client.phone) {
      errors.push("Client email and phone are required");
    }

    if (formData.client.clientType === "Company" && !formData.client.companyName) {
      errors.push("Company name is required for company clients");
    }

    if (!formData.client.contactPerson && (!formData.client.firstName || !formData.client.lastName)) {
      errors.push("Contact person name is required");
    }

    // Check if products are selected
    if (includedProducts.size === 0) {
      errors.push("At least one product must be selected");
    }

    // Check if products have required information
    formData.products.forEach((product, index) => {
      if (includedProducts.has(index)) {
        if (!product.productName || !product.quantity) {
          errors.push(`Product ${index + 1} must have a name and quantity`);
        }
      }
    });

    setValidationErrors(errors);
    return errors.length === 0;
  };

  // Enhanced save function with validation
  const handleSaveWithValidation = () => {
    if (validateFormData()) {
      onOpenSave();
    } else {
      console.error('Validation errors:', validationErrors);
    }
  };

  // Calculate comprehensive costs for each product
  const calculateProductCosts = (productIndex: number) => {
    const product = formData.products[productIndex];
    if (!product || !product.quantity) return { 
      paperCost: 0, 
      platesCost: 0, 
      finishingCost: 0, 
      subtotal: 0, 
      vat: 0, 
      total: 0 
    };

    // 1. Paper Costs
    const paperCost = formData.operational.papers.reduce((total, p) => {
      const pricePerSheet = (p.pricePerPacket || 0) / (p.sheetsPerPacket || 1);
      const actualSheetsNeeded = p.enteredSheets || 0;
      return total + (pricePerSheet * actualSheetsNeeded);
    }, 0);

    // 2. Plates Cost (per plate, typically $25-50 per plate)
    const PLATE_COST_PER_PLATE = 35; // Standard plate cost
    const platesCost = (formData.operational.plates || 0) * PLATE_COST_PER_PLATE;

    // 3. Finishing Costs (cost per unit × actual units needed)
    const actualUnitsNeeded = formData.operational.units || product.quantity || 0;
    const finishingCost = formData.operational.finishing.reduce((total, f) => {
      if (product.finishing.includes(f.name)) {
        return total + ((f.cost || 0) * actualUnitsNeeded);
      }
      return total;
    }, 0);

    // 4. Calculate subtotal and VAT
    const subtotal = paperCost + platesCost + finishingCost;
    const vat = subtotal * 0.05; // 5% VAT
    const total = subtotal + vat;

    return {
      paperCost,
      platesCost,
      finishingCost,
      subtotal,
      vat,
      total
    };
  };

  // Calculate grand total based on included products
  const calculateGrandTotal = () => {
    let total = 0;
    includedProducts.forEach((index) => {
      const costs = calculateProductCosts(index);
      total += costs.total;
    });
    return total;
  };

  // Calculate summary totals for all included products
  const calculateSummaryTotals = () => {
    let totalPaperCost = 0;
    let totalPlatesCost = 0;
    let totalFinishingCost = 0;
    let totalSubtotal = 0;
    let totalVAT = 0;
    let grandTotal = 0;

    includedProducts.forEach((index) => {
      const costs = calculateProductCosts(index);
      totalPaperCost += costs.paperCost;
      totalPlatesCost += costs.platesCost;
      totalFinishingCost += costs.finishingCost;
      totalSubtotal += costs.subtotal;
      totalVAT += costs.vat;
      grandTotal += costs.total;
    });

    return {
      totalPaperCost,
      totalPlatesCost,
      totalFinishingCost,
      totalSubtotal,
      totalVAT,
      grandTotal
    };
  };

  // Handle product inclusion/exclusion
  const toggleProductInclusion = (productIndex: number) => {
    const newIncluded = new Set(includedProducts);
    if (newIncluded.has(productIndex)) {
      newIncluded.delete(productIndex);
    } else {
      newIncluded.add(productIndex);
    }
    setIncludedProducts(newIncluded);
  };

  // Add other quantity with product selection
  const addOtherQty = (): void => {
    const availableProducts = formData.products.filter((_, index) => includedProducts.has(index));
    if (availableProducts.length === 0) return;

    const selectedProduct = availableProducts[0];
    const initialQuantity = 250;
    
    // Calculate initial price
    const initialPrices = calculateOtherQtyPrice({
      productName: selectedProduct.productName,
      quantity: initialQuantity,
      price: 0
    });
    
    setOtherQuantities((prev) => [
      ...prev,
      {
        productName: selectedProduct.productName,
        quantity: initialQuantity,
        price: initialPrices.base, // Set calculated price
      },
    ]);
  };

  // Remove other quantity
  const removeOtherQty = (idx: number): void =>
    setOtherQuantities((prev) => prev.filter((_, i) => i !== idx));

  // Update other quantity
  const updateOtherQty = (idx: number, patch: Partial<OtherQty>): void =>
    setOtherQuantities((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], ...patch };
      
      // Auto-calculate price when quantity changes
      if (patch.quantity !== undefined || patch.productName !== undefined) {
        const updatedQty = next[idx];
        const prices = calculateOtherQtyPrice(updatedQty);
        next[idx] = { ...updatedQty, price: prices.base };
      }
      
      return next;
    });

  // Calculate price for other quantity based on base product
  const calculateOtherQtyPrice = (otherQty: OtherQty) => {
    const baseProduct = formData.products.find(p => p.productName === otherQty.productName);
    if (!baseProduct || !baseProduct.quantity || !otherQty.quantity) return { base: 0, vat: 0, total: 0 };

    // Calculate price based on the ratio of quantities and include all costs
    const baseCosts = calculateProductCosts(formData.products.indexOf(baseProduct));
    const quantityRatio = otherQty.quantity / baseProduct.quantity;
    
    const basePrice = baseCosts.subtotal * quantityRatio;
    const vat = basePrice * 0.05;
    const total = basePrice + vat;
    
    return { base: basePrice, vat, total };
  };



  const summaryTotals = calculateSummaryTotals();

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="text-center space-y-3">
        <h3 className="text-3xl font-bold text-slate-900">
          Quotation Summary
        </h3>
        <p className="text-slate-600 text-lg">
          Review and finalize your printing quote details
        </p>
      </div>

      {/* Quote To Section */}
      <div className="bg-white rounded-2xl shadow-lg p-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <div className="w-3 h-3 bg-purple-500 rounded-full mr-3"></div>
            <h4 className="text-2xl font-bold text-slate-800">Quote To:</h4>
          </div>
          <div className="flex items-center space-x-3">
            <span className="text-sm text-slate-500 font-medium">Quote ID:</span>
            <div className="px-4 py-2 bg-gradient-to-r from-blue-50 to-purple-50 text-blue-800 font-mono font-semibold rounded-xl text-sm border border-blue-200">
              {formData.client.companyName ? `Q-${Date.now().toString().slice(-6)}` : 'Pending'}
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Customer Details */}
          <div className="space-y-5">
            <div className="flex items-center space-x-3 mb-4">
              <h5 className="text-lg font-semibold text-slate-700">Customer Details</h5>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-start py-3 border-b border-slate-100">
                <span className="text-sm font-medium text-slate-600 w-32 flex-shrink-0">Company</span>
                <span className="font-semibold text-slate-800 text-left ml-4 break-words">
                  {formData.client.clientType === "Company" ? (formData.client.companyName || 'Not specified') : 'Individual Client'}
                </span>
              </div>
              
              <div className="flex items-start py-3 border-b border-slate-100">
                <span className="text-sm font-medium text-slate-600 w-32 flex-shrink-0">Contact Person</span>
                <span className="font-semibold text-slate-800 text-left ml-4 break-words">
                  {formData.client.contactPerson || `${formData.client.firstName || ''} ${formData.client.lastName || ''}`.trim() || 'Not specified'}
                </span>
              </div>
              
              <div className="flex items-start py-3 border-b border-slate-100">
                <span className="text-sm font-medium text-slate-600 w-32 flex-shrink-0">Email</span>
                <span className="font-semibold text-slate-800 text-left ml-4 break-words">
                  {formData.client.email || 'Not specified'}
                </span>
              </div>
              
              <div className="flex items-start py-3">
                <span className="text-sm font-medium text-slate-600 w-32 flex-shrink-0">Phone</span>
                <span className="font-semibold text-slate-800 text-left ml-4 break-words">
                  {formData.client.countryCode && formData.client.phone 
                    ? `${formData.client.countryCode} ${formData.client.phone}` 
                    : 'Not specified'}
                </span>
              </div>
            </div>
          </div>

          {/* Quote Details */}
          <div className="space-y-5">
            <div className="flex items-center space-x-3 mb-4">
              <h5 className="text-lg font-semibold text-slate-700">Quote Details</h5>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-start py-3 border-b border-slate-100">
                <span className="text-sm font-medium text-slate-600 w-32 flex-shrink-0">Client Type</span>
                <span className="font-semibold text-slate-800 text-left ml-4 capitalize">
                  {formData.client.clientType || 'Not specified'}
                </span>
              </div>
              
              {formData.client.role && (
                <div className="flex items-start py-3 border-b border-slate-100">
                  <span className="text-sm font-medium text-slate-600 w-32 flex-shrink-0">Role/Designation</span>
                  <span className="font-semibold text-slate-800 text-left ml-4 break-words">
                    {formData.client.role}
                  </span>
                </div>
              )}
              
              <div className="flex items-start py-3 border-b border-slate-100">
                <span className="text-sm font-medium text-slate-600 w-32 flex-shrink-0">Quote Date</span>
                <span className="font-semibold text-slate-800 text-left ml-4">
                  {new Date().toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </span>
              </div>
              
              <div className="flex items-start py-3">
                <span className="text-sm font-medium text-slate-600 w-32 flex-shrink-0">Status</span>
                <span className="px-3 py-1.5 text-xs font-semibold rounded-full bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 border border-blue-300 ml-4">
                  Draft
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Price summary */}
      <div className="bg-white rounded-2xl border-0 shadow-lg p-8">
        <div className="flex items-center justify-between mb-6">
          <h4 className="text-xl font-semibold text-slate-800 flex items-center">
            <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
            Price Summary
          </h4>
        </div>

        <div className="overflow-hidden rounded-xl border border-slate-200">
          <Table>
            <TableHeader className="bg-gradient-to-r from-slate-50 to-blue-50">
              <TableRow className="border-slate-200">
                <TableHead className="text-slate-700 font-semibold py-4 px-6 w-12">
                  <Checkbox
                    checked={includedProducts.size === formData.products.length}
                    onCheckedChange={(checked) => {
                      if (Boolean(checked)) {
                        setIncludedProducts(new Set(formData.products.map((_, index) => index)));
                      } else {
                        setIncludedProducts(new Set());
                      }
                    }}
                  />
                </TableHead>
                <TableHead className="text-slate-700 font-semibold py-4 px-6">Product Name</TableHead>
                <TableHead className="text-slate-700 font-semibold py-4 px-6">Quantity</TableHead>
                <TableHead className="text-right text-slate-700 font-semibold py-4 px-6">Paper Cost</TableHead>
                <TableHead className="text-right text-slate-700 font-semibold py-4 px-6">Plates Cost</TableHead>
                <TableHead className="text-right text-slate-700 font-semibold py-4 px-6">Finishing Cost</TableHead>
                <TableHead className="text-right text-slate-700 font-semibold py-4 px-6">Subtotal</TableHead>
                <TableHead className="text-right text-slate-700 font-semibold py-4 px-6">VAT (5%)</TableHead>
                <TableHead className="text-right text-slate-700 font-semibold py-4 px-6">Total Price</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {formData.products.map((product, index) => {
                const costs = calculateProductCosts(index);
                const isIncluded = includedProducts.has(index);
                
                return (
                  <TableRow key={index} className="border-slate-200 hover:bg-slate-50/50 transition-colors">
                    <TableCell className="py-4 px-6">
                      <Checkbox
                        checked={isIncluded}
                        onCheckedChange={() => toggleProductInclusion(index)}
                      />
                    </TableCell>
                    <TableCell className="font-medium text-slate-800 py-4 px-6">
                      {product.productName}
                    </TableCell>
                    <TableCell className="text-slate-700 py-4 px-6">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                        {product.quantity || 0}
                      </span>
                    </TableCell>
                    <TableCell className="text-right text-slate-700 py-4 px-6 font-medium">
                      {isIncluded ? currency(costs.paperCost) : "—"}
                    </TableCell>
                    <TableCell className="text-right text-slate-700 py-4 px-6 font-medium">
                      {isIncluded ? currency(costs.platesCost) : "—"}
                    </TableCell>
                    <TableCell className="text-right text-slate-700 py-4 px-6 font-medium">
                      {isIncluded ? currency(costs.finishingCost) : "—"}
                    </TableCell>
                    <TableCell className="text-right text-slate-700 py-4 px-6 font-medium">
                      {isIncluded ? currency(costs.subtotal) : "—"}
                    </TableCell>
                    <TableCell className="text-right text-slate-700 py-4 px-6">
                      {isIncluded ? (
                        <span className="text-green-600 font-medium">{currency(costs.vat)}</span>
                      ) : "—"}
                    </TableCell>
                    <TableCell className="text-right py-4 px-6">
                      {isIncluded ? (
                        <span className="text-lg font-bold text-blue-600">{currency(costs.total)}</span>
                      ) : "—"}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {/* Cost Breakdown Summary */}
        <div className="mt-8 space-y-4">
          <div className="bg-gradient-to-r from-slate-50 to-blue-50 rounded-2xl p-8 border border-blue-200 shadow-lg">
            <h5 className="text-xl font-bold text-slate-800 mb-6 flex items-center justify-center">
              <Calculator className="w-6 h-6 mr-3 text-blue-600" />
              Cost Breakdown Summary
            </h5>
            
            {/* Cost Categories Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {/* Paper Cost */}
              <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
                    <span className="text-sm font-medium text-slate-600">Paper Cost</span>
                  </div>
                  <Package className="w-5 h-5 text-blue-500" />
                </div>
                <div className="text-2xl font-bold text-slate-800">{currency(summaryTotals.totalPaperCost)}</div>
                <div className="text-xs text-slate-500 mt-1">Based on sheets & paper type</div>
              </div>

              {/* Plates Cost */}
              <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-purple-500 rounded-full mr-3"></div>
                    <span className="text-sm font-medium text-slate-600">Plates Cost</span>
                  </div>
                  <Settings className="w-5 h-5 text-purple-500" />
                </div>
                <div className="text-2xl font-bold text-slate-800">{currency(summaryTotals.totalPlatesCost)}</div>
                <div className="text-xs text-slate-500 mt-1">Printing plates setup</div>
              </div>

              {/* Finishing Cost */}
              <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                    <span className="text-sm font-medium text-slate-600">Finishing Cost</span>
                  </div>
                  <Settings className="w-5 h-5 text-green-500" />
                </div>
                <div className="text-2xl font-bold text-slate-800">{currency(summaryTotals.totalFinishingCost)}</div>
                <div className="text-xs text-slate-500 mt-1">UV, lamination & special effects</div>
              </div>
            </div>

            {/* Cost Breakdown Details */}
            <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
              <h6 className="text-lg font-semibold text-slate-700 mb-4 flex items-center">
                <Calculator className="w-4 h-4 mr-2 text-slate-600" />
                Detailed Breakdown
              </h6>
              
              <div className="space-y-3">
                {/* Paper Cost Detail */}
                <div className="flex justify-between items-center py-2 border-b border-slate-100">
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                    <span className="text-slate-600">Paper & Materials</span>
                  </div>
                  <span className="font-semibold text-slate-800">{currency(summaryTotals.totalPaperCost)}</span>
                </div>

                {/* Plates Cost Detail */}
                <div className="flex justify-between items-center py-2 border-b border-slate-100">
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-purple-500 rounded-full mr-3"></div>
                    <span className="text-slate-600">Printing Plates</span>
                  </div>
                  <span className="font-semibold text-slate-800">{currency(summaryTotals.totalPlatesCost)}</span>
                </div>

                {/* Finishing Cost Detail */}
                <div className="flex justify-between items-center py-2 border-b border-slate-100">
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                    <span className="text-slate-600">Finishing Services</span>
                  </div>
                  <span className="font-semibold text-slate-800">{currency(summaryTotals.totalFinishingCost)}</span>
                </div>

                {/* Subtotal */}
                <div className="flex justify-between items-center py-3 border-b-2 border-slate-200">
                  <span className="text-lg font-semibold text-slate-700">Subtotal</span>
                  <span className="text-lg font-bold text-slate-800">{currency(summaryTotals.totalSubtotal)}</span>
                </div>

                {/* VAT */}
                <div className="flex justify-between items-center py-2">
                  <span className="text-slate-600">VAT (5%)</span>
                  <span className="font-semibold text-green-600">{currency(summaryTotals.totalVAT)}</span>
                </div>
              </div>
            </div>

            {/* Grand Total */}
            <div className="mt-6 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-blue-100 mb-1">Total Amount</div>
                  <div className="text-2xl font-bold">Grand Total</div>
                </div>
                <div className="text-right">
                  <div className="text-4xl font-bold">{currency(summaryTotals.grandTotal)}</div>
                  <div className="text-sm text-blue-100 mt-1">Including VAT</div>
                </div>
              </div>
            </div>

            {/* Additional Info */}
            <div className="mt-4 text-center">
              <div className="text-xs text-slate-500">
                * All prices are in USD and include applicable taxes
              </div>
              <div className="text-xs text-slate-500 mt-1">
                ** Quote valid for 30 days from date of issue
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Other quantities */}
      <div className="bg-white rounded-2xl border-0 shadow-lg p-8">
        <div className="flex justify-between items-center mb-6">
          <h4 className="text-xl font-semibold text-slate-800 flex items-center">
            <div className="w-3 h-3 bg-purple-500 rounded-full mr-3"></div>
            Supplementary Information: Other Quantities
          </h4>
        </div>
        
        <Button 
          variant="outline" 
          className="mb-6 border-blue-500 text-blue-600 hover:bg-blue-50 hover:border-blue-600 rounded-xl px-6 py-3 transition-all duration-200" 
          size="sm" 
          onClick={addOtherQty}
          disabled={includedProducts.size === 0}
        >
          <Plus className="h-5 w-5 mr-2" />
          Add Other Quantities
        </Button>

        <div className="space-y-6">
          {otherQuantities.length === 0 && (
            <div className="text-center py-12 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-300">
              <div className="text-slate-400 mb-2 text-4xl">📋</div>
              <p className="text-slate-600 font-medium">No other quantities added yet</p>
              <p className="text-slate-500 text-sm mt-1">Click the button above to add supplementary items</p>
            </div>
          )}

          {otherQuantities.map((row, idx) => {
            const prices = calculateOtherQtyPrice(row);

            return (
              <div
                key={idx}
                className="bg-gradient-to-r from-slate-50 to-blue-50 rounded-2xl p-6 border border-slate-200 hover:shadow-md transition-all duration-200"
              >
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                  <div className="md:col-span-3">
                    <Label className="text-sm font-medium text-slate-700 mb-2 block">Product Name</Label>
                    <Select
                      value={row.productName}
                      onValueChange={(value) =>
                        updateOtherQty(idx, { productName: value })
                      }
                    >
                      <SelectTrigger className="border-slate-300 focus:border-blue-500 focus:ring-blue-500 rounded-xl">
                        <SelectValue placeholder="Select product" />
                      </SelectTrigger>
                      <SelectContent>
                        {formData.products
                          .filter((_, index) => includedProducts.has(index))
                          .map((product, productIndex) => (
                            <SelectItem key={productIndex} value={product.productName}>
                              {product.productName}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="md:col-span-2">
                    <Label className="text-sm font-medium text-slate-700 mb-2 block">Quantity</Label>
                    <Input
                      type="number"
                      min={1}
                      value={row.quantity}
                      onChange={(e) =>
                        updateOtherQty(idx, {
                          quantity:
                            e.target.value === "" ? "" : Number(e.target.value),
                        })
                      }
                      className="border-slate-300 focus:border-blue-500 focus:ring-blue-500 rounded-xl"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label className="text-sm font-medium text-slate-700 mb-2 block">Base Price</Label>
                    <Input
                      readOnly
                      className="bg-slate-100 border-slate-300 rounded-xl font-medium"
                      value={currency(prices.base)}
                    />
                  </div>

                  <div className="md:col-span-3 grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-slate-700 mb-2 block">VAT (5%)</Label>
                      <Input
                        readOnly
                        className="bg-slate-100 border-slate-300 rounded-xl font-medium text-green-600"
                        value={currency(prices.vat)}
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-slate-700 mb-2 block">Total</Label>
                      <Input
                        readOnly
                        className="bg-slate-100 border-slate-300 rounded-xl font-bold text-blue-600"
                        value={currency(prices.total)}
                      />
                    </div>
                  </div>

                  <div className="md:col-span-1 flex flex-col items-end">
                    <Label className="text-sm font-medium text-slate-700 mb-2 block">Action</Label>
                    <Button
                      variant="ghost"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl p-3 transition-all duration-200"
                      onClick={() => removeOtherQty(idx)}
                      title="Remove"
                    >
                      <Trash2 className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>



      {/* Summary Footer */}
      <div className="bg-gradient-to-r from-slate-50 to-blue-50 rounded-2xl border border-slate-200 p-6">
        {/* Validation Errors Display */}
        {validationErrors.length > 0 && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4">
            <h4 className="text-lg font-semibold text-red-800 mb-3 flex items-center">
              ⚠️ Please fix the following issues before saving:
            </h4>
            <ul className="space-y-2">
              {validationErrors.map((error, index) => (
                <li key={index} className="text-red-700 flex items-center">
                  <span className="w-2 h-2 bg-red-500 rounded-full mr-3"></span>
                  {error}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="text-center space-y-3">
          <h4 className="text-lg font-semibold text-slate-800">Ready to Save?</h4>
          <p className="text-slate-600">
            Review all details above and click the Save Quote button when ready to proceed
          </p>
        </div>
      </div>
    </div>
  );
};

export default Step5Quotation;