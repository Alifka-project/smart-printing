"use client";

import * as React from "react";
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
import { Plus, Trash2, Calculator, Settings, Package, Percent, Download, AlertTriangle, CheckCircle, Clock, User } from "lucide-react";
import { Label } from "@/components/ui/label";
import type { QuoteFormData, QuoteDiscount, DiscountApproval, QuoteApproval, QuoteSubmission, SalesPerson } from "@/types";
import type { OtherQty } from "@/lib/quote-pdf";
import { formatAED, requiresApproval, getApprovalReason, getApprovalStatusColor, canApproveQuotes, canSendToCustomer } from "@/lib/currency";
import { downloadCustomerPdf, downloadOpsPdf } from "@/lib/quote-pdf";

// AED Currency formatter
const currency = (n: number) => formatAED(n);

interface Step5Props {
  formData: QuoteFormData;
  setFormData: React.Dispatch<React.SetStateAction<QuoteFormData>>;
  otherQuantities: OtherQty[];
  setOtherQuantities: React.Dispatch<React.SetStateAction<OtherQty[]>>;
  onOpenSave: () => void;
  isEditMode?: boolean;
  selectedQuoteId?: string | null;
  onSubmitQuote?: (formData: QuoteFormData) => Promise<void>; // Add this prop for actual submission
  onApprovalStatusChange?: (requiresApproval: boolean, approvalReason?: string) => void; // Add callback for approval status
}

const Step5Quotation: React.FC<Step5Props> = ({
  formData,
  setFormData,
  otherQuantities,
  setOtherQuantities,
  onOpenSave,
  isEditMode,
  selectedQuoteId,
  onSubmitQuote,
  onApprovalStatusChange,
}) => {
  // State for included/excluded products
  const [includedProducts, setIncludedProducts] = React.useState<Set<number>>(
    new Set(formData.products.map((_, index) => index))
  );

  // Validation state
  const [validationErrors, setValidationErrors] = React.useState<string[]>([]);

  // Discount state
  const [discount, setDiscount] = React.useState<QuoteDiscount>({
    isApplied: false,
    percentage: 0,
    amount: 0,
  });

  // Discount approval state
  const [discountApproval, setDiscountApproval] = React.useState<DiscountApproval>({
    approvedBy: '',
    reason: '',
    approvedAt: new Date(),
  });

  // Quote approval state
  const [quoteApproval, setQuoteApproval] = React.useState<QuoteApproval>({
    status: 'Draft',
    requiresApproval: false,
    approvalReason: ''
  });

  // Quote approver state (separate from discount approver)
  const [quoteApprover, setQuoteApprover] = React.useState<{
    approvedBy: string;
    reason: string;
    approvedAt: Date;
  }>({
    approvedBy: '',
    reason: '',
    approvedAt: new Date(),
  });



  // Sales person state (for display only)
  const [salesPersons, setSalesPersons] = React.useState<SalesPerson[]>([]);

  // Quote submission action
  const [submissionAction, setSubmissionAction] = React.useState<QuoteSubmission['action']>('Save Draft');

  // Handle submission action changes with approval logic
  const handleSubmissionActionChange = (action: QuoteSubmission['action']) => {
    if (action === 'Send to Customer' && quoteApproval.requiresApproval) {
      // If approval is required, automatically switch to Send for Approval
      setSubmissionAction('Send for Approval');
    } else {
      setSubmissionAction(action);
    }
  };

  // Load sales persons for display
  React.useEffect(() => {
    const loadSalesPersons = async () => {
      try {
        const response = await fetch('/api/sales-persons');
        if (response.ok) {
          const salesPersonsData = await response.json();
          // Filter for active sales persons only
          const activeSalesPersons = salesPersonsData.filter((person: SalesPerson) => person.status === 'Active');
          setSalesPersons(activeSalesPersons);
        }
      } catch (error) {
        console.error('Error loading sales persons:', error);
      }
    };

    loadSalesPersons();
  }, []);

  // Available approvers - fetch from database dynamically
  const [availableApprovers, setAvailableApprovers] = React.useState<string[]>([]);

  // Load approvers from database
  React.useEffect(() => {
    const loadApprovers = async () => {
      try {
        const response = await fetch('/api/users');
        if (response.ok) {
          const usersData = await response.json();
          // Filter for users with admin or manager roles who can approve
          const approverUsers = usersData
            .filter((user: any) => ['admin', 'manager'].includes(user.role?.toLowerCase()))
            .map((user: any) => user.name)
            .filter((name: string) => name && name.trim() !== '');
          
          // If no approvers found in database, use fallback
          if (approverUsers.length === 0) {
            setAvailableApprovers(['Manager', 'Director', 'CEO']);
          } else {
            setAvailableApprovers(approverUsers);
          }
        }
      } catch (error) {
        console.error('Error loading approvers:', error);
        // Fallback to default approvers if API fails
        setAvailableApprovers(['Manager', 'Director', 'CEO']);
      }
    };

    loadApprovers();
  }, []);



  // Check if quote requires approval based on current values
  React.useEffect(() => {
    const currentDiscountPercentage = discount.isApplied ? discount.percentage : 0;
    const currentMarginPercentage = formData.calculation.marginPercentage || 30;
    const currentTotalAmount = formData.calculation.totalPrice || 0;
    
    const needsApproval = requiresApproval(
      currentDiscountPercentage,
      currentMarginPercentage,
      currentTotalAmount
    );
    
    const approvalReason = getApprovalReason(
      currentDiscountPercentage,
      currentMarginPercentage,
      currentTotalAmount
    );
    
    setQuoteApproval(prev => ({
      ...prev,
      requiresApproval: needsApproval,
      approvalReason: needsApproval ? approvalReason : undefined
    }));

    // Notify parent component about approval status changes
    if (onApprovalStatusChange) {
      onApprovalStatusChange(needsApproval, needsApproval ? approvalReason : undefined);
    }
  }, [discount, formData.calculation.marginPercentage, formData.calculation.totalPrice, onApprovalStatusChange]);

  // Sync discount data with form data
  React.useEffect(() => {
    if (formData.calculation.discount) {
      setDiscount(formData.calculation.discount);
      if (formData.calculation.discount.approval) {
        setDiscountApproval(formData.calculation.discount.approval);
      }
    }
  }, [formData.calculation.discount]);

  // Recalculate discount amount when percentage changes
  React.useEffect(() => {
    if (discount.isApplied && discount.percentage > 0) {
      const currentGrandTotal = calculateGrandTotalWithoutDiscount();
      const amount = (currentGrandTotal * discount.percentage) / 100;
      setDiscount(prev => ({
        ...prev,
        amount
      }));
    }
  }, [discount.percentage, discount.isApplied, includedProducts, otherQuantities]);

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

    // Validate discount approval if discount is applied
    if (discount.isApplied && discount.percentage > 0) {
      if (!discountApproval.approvedBy) {
        errors.push("Discount approver must be selected when applying discount");
      }
      if (!discountApproval.reason.trim()) {
        errors.push("Discount reason is required when applying discount");
      }
    }

    // Validate quote approver if sending for approval
    if (submissionAction === 'Send for Approval') {
      if (!quoteApprover.approvedBy) {
        errors.push("Quote approver must be selected when sending for approval");
      }
      if (!quoteApproval.approvalNotes?.trim()) {
        errors.push("Approval notes are required when sending for approval");
      }
    }

    // Check if sales person is selected
    if (!formData.salesPersonId) {
      errors.push("Sales person must be selected");
    }

    setValidationErrors(errors);
    return errors.length === 0;
  };

  // Enhanced save function with validation
  const handleSaveWithValidation = async () => {
    if (validateFormData()) {
      // Sync discount data with form data before saving
      const updatedFormData = {
        ...formData,
        calculation: {
          ...formData.calculation,
          marginPercentage: 30,
          discount: discount.isApplied ? {
            ...discount,
            approval: discountApproval.approvedBy && discountApproval.reason ? discountApproval : undefined
          } : undefined,
          finalSubtotal: summaryTotals.finalTotal
        },
        // Add approval data based on submission action
        approval: submissionAction === 'Send for Approval' ? {
          status: 'Pending Approval' as const,
          requiresApproval: true,
          approvalReason: quoteApproval.approvalReason,
          approvalNotes: quoteApproval.approvalNotes,
          approver: quoteApprover.approvedBy ? {
            approvedBy: quoteApprover.approvedBy,
            reason: quoteApprover.reason,
            approvedAt: quoteApprover.approvedAt
          } : undefined
        } : submissionAction === 'Send to Customer' ? {
          status: 'Approved' as const,
          requiresApproval: false
        } : {
          status: 'Draft' as const,
          requiresApproval: false
        },
        salesPersonId: formData.salesPersonId
      };
      
      // Update the form data with all information
      setFormData(updatedFormData);
      
      // Log the action being taken
      console.log(`Quote ${submissionAction.toLowerCase()}:`, updatedFormData);
      
      try {
        // If we have an onSubmitQuote function, use it to actually submit the quote
        if (onSubmitQuote) {
          await onSubmitQuote(updatedFormData);
          console.log('Quote submitted successfully via onSubmitQuote');
        } else {
          // Fallback to the old behavior (opening modal)
          console.log('No onSubmitQuote function provided, falling back to modal');
          onOpenSave();
        }
      } catch (error) {
        console.error('Error submitting quote:', error);
        alert(`Error submitting quote: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
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
      margin: 0,
      marginAmount: 0,
      vat: 0, 
      total: 0 
    };

    // 1. Paper Costs - Calculate from operational papers data
    const paperCost = formData.operational.papers.reduce((total, p) => {
      if (p.pricePerPacket && p.enteredSheets && p.sheetsPerPacket) {
        const pricePerSheet = p.pricePerPacket / p.sheetsPerPacket;
        const actualSheetsNeeded = p.enteredSheets;
        return total + (pricePerSheet * actualSheetsNeeded);
      }
      return total;
    }, 0);

    // 2. Plates Cost (per plate, typically $25-50 per plate)
    const PLATE_COST_PER_PLATE = 35; // Standard plate cost
    const platesCost = (formData.operational.plates || 0) * PLATE_COST_PER_PLATE;

    // 3. Finishing Costs (calculate using same logic as Step 4)
    const actualUnitsNeeded = formData.operational.units || product.quantity || 0;
    const finishingCost = (() => {
      let totalFinishingCost = 0;
      
      if (product.finishing && product.finishing.length > 0) {
        product.finishing.forEach(finishingName => {
          // Use the same calculation logic as Step 4
          const baseFinishingName = finishingName.split('-')[0];
          let finishingCost = 0;
          
          // Use impressions field if available, otherwise fall back to product quantity
          const totalQuantity = formData.operational.impressions || product.quantity || 0;
          
          switch (baseFinishingName) {
            case 'Lamination':
              const actualSheetsNeeded = formData.operational.papers[productIndex]?.enteredSheets ?? 0;
              finishingCost = 75 + (actualSheetsNeeded * 0.75);
              break;
            case 'Velvet Lamination':
              const velvetSheetsNeeded = formData.operational.papers[productIndex]?.enteredSheets ?? 0;
              finishingCost = 100 + (velvetSheetsNeeded * 1.0);
              break;
            case 'Embossing':
              const embossingImpressions = Math.max(1000, totalQuantity);
              const embossingImpressionCost = Math.ceil(embossingImpressions / 1000) * 50;
              finishingCost = Math.max(75, embossingImpressionCost);
              break;
            case 'Foiling':
              const foilingImpressions = Math.max(1000, totalQuantity);
              const foilingImpressionCost = Math.ceil(foilingImpressions / 1000) * 75;
              finishingCost = Math.max(75, foilingImpressionCost);
              break;
            case 'Die Cutting':
              const dieCuttingImpressions = Math.max(1000, totalQuantity);
              const dieCuttingImpressionCost = Math.ceil(dieCuttingImpressions / 1000) * 50;
              let minCharge = 75;
              if (product.flatSize && product.flatSize.width && product.flatSize.height) {
                const area = product.flatSize.width * product.flatSize.height;
                if (area <= 210 * 148) minCharge = 75;
                else if (area <= 297 * 210) minCharge = 100;
                else if (area <= 420 * 297) minCharge = 150;
                else minCharge = 200;
              }
              finishingCost = Math.max(minCharge, dieCuttingImpressionCost);
              break;
            case 'UV Spot':
              const uvSpotImpressions = Math.max(1000, totalQuantity);
              const uvSpotImpressionCost = Math.ceil(uvSpotImpressions / 1000) * 350;
              finishingCost = Math.max(350, uvSpotImpressionCost);
              break;
            case 'Folding':
              const foldingImpressions = Math.max(1000, totalQuantity);
              const foldingImpressionCost = Math.ceil(foldingImpressions / 1000) * 25;
              finishingCost = Math.max(25, foldingImpressionCost);
              break;
            case 'Padding':
              finishingCost = 25;
              break;
            case 'Varnishing':
              finishingCost = 30;
              break;
            default:
              finishingCost = 0;
              break;
          }
          
          totalFinishingCost += finishingCost;
        });
      }
      
      return totalFinishingCost;
    })();

    // 4. Calculate subtotal, margin, and VAT
    const subtotal = paperCost + platesCost + finishingCost;
    const marginPercentage = 30; // 30% margin (hidden from user)
    const marginAmount = subtotal * (marginPercentage / 100);
    const total = subtotal + marginAmount;
    const vat = total * 0.05; // 5% VAT on total including margin
    const finalTotal = total + vat;

    return {
      paperCost,
      platesCost,
      finishingCost,
      subtotal,
      margin: marginPercentage,
      marginAmount,
      vat,
      total: finalTotal
    };
  };

  // Calculate grand total based on included products and supplementary quantities
  const calculateGrandTotal = () => {
    // Use the same calculation logic as calculateSummaryTotals
    const summaryTotals = calculateSummaryTotals();
    return summaryTotals.finalTotal;
  };

  // Calculate grand total without discount for percentage calculation
  const calculateGrandTotalWithoutDiscount = () => {
    // Use the same calculation logic as calculateSummaryTotals but without discount
    const summaryTotals = calculateSummaryTotals();
    return summaryTotals.grandTotal; // This is the total before discount
  };

  // Calculate summary totals for all included products and supplementary quantities
  const calculateSummaryTotals = () => {
    let totalPaperCost = 0;
    let totalPlatesCost = 0;
    let totalFinishingCost = 0;
    let totalAdditionalCost = 0;
    let totalSubtotal = 0;
    let totalMargin = 0;
    let totalMarginAmount = 0;
    let totalVAT = 0;
    let grandTotal = 0;

    // Calculate base costs from main products (without margin/VAT)
    includedProducts.forEach((index) => {
      const costs = calculateProductCosts(index);
      totalPaperCost += costs.paperCost;
      totalPlatesCost += costs.platesCost;
      totalFinishingCost += costs.finishingCost;
      // Don't add margin/VAT here - we'll calculate it on the total base
    });

    // Add supplementary quantities base costs
    otherQuantities.forEach((otherQty) => {
      const prices = calculateOtherQtyPrice(otherQty);
      // For supplementary quantities, we need to extract the base cost before margin/VAT
      // Since calculateOtherQtyPrice returns prices with VAT, we need to reverse calculate
      const basePrice = prices.base; // This should be the base before margin/VAT
      totalSubtotal += basePrice;
    });

    // Add additional costs from Step 4 to the base calculation
    if (formData.additionalCosts && formData.additionalCosts.length > 0) {
      totalAdditionalCost = formData.additionalCosts.reduce((acc, cost) => acc + (cost.cost || 0), 0);
    }

    // Calculate total base cost (paper + plates + finishing + additional costs)
    const totalBaseCost = totalPaperCost + totalPlatesCost + totalFinishingCost + totalAdditionalCost + totalSubtotal;

    // Apply 30% margin to the total base cost
    totalMargin = 30;
    totalMarginAmount = totalBaseCost * (totalMargin / 100);

    // Calculate subtotal (base + margin)
    const subtotalWithMargin = totalBaseCost + totalMarginAmount;

    // Apply 5% VAT to the subtotal
    totalVAT = subtotalWithMargin * 0.05;

    // Calculate final total
    grandTotal = subtotalWithMargin + totalVAT;

    // Apply discount if enabled
    let finalTotal = grandTotal;
    let discountAmount = 0;
    if (discount.isApplied && discount.percentage > 0) {
      discountAmount = grandTotal * (discount.percentage / 100);
      finalTotal = grandTotal - discountAmount;
    }

    return {
      totalPaperCost,
      totalPlatesCost,
      totalFinishingCost,
      totalAdditionalCost,
      totalSubtotal: totalBaseCost, // Total base cost before margin/VAT
      totalMargin: 30, // 30% margin (hidden from user)
      totalMarginAmount,
      totalVAT,
      grandTotal,
      discountAmount,
      finalTotal
    };
  };

  // Sync calculated amounts back to parent component
  React.useEffect(() => {
    const summaryTotals = calculateSummaryTotals();
    const finalTotal = calculateGrandTotal();
    
    // Update formData with calculated amounts
    setFormData(prev => ({
      ...prev,
      calculation: {
        ...prev.calculation,
        basePrice: summaryTotals.totalSubtotal,
        marginAmount: summaryTotals.totalMarginAmount,
        marginPercentage: 30,
        subtotal: summaryTotals.totalSubtotal + summaryTotals.totalMarginAmount,
        finalSubtotal: summaryTotals.totalSubtotal + summaryTotals.totalMarginAmount,
        vatAmount: summaryTotals.totalVAT,
        totalPrice: finalTotal
      }
    }));
  }, [includedProducts, otherQuantities, formData.operational.papers, formData.operational.plates, formData.operational.units, formData.operational.finishing, formData.additionalCosts, setFormData]);

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
    <div className="space-y-6 sm:space-y-8 px-2 sm:px-0">
      {/* Page Header */}
      <div className="text-center space-y-3 px-4 sm:px-0">
        <h3 className="text-2xl sm:text-3xl font-bold text-slate-900">
          Quotation Summary
        </h3>
        <p className="text-slate-600 text-base sm:text-lg px-2">
          Review and finalize your printing quote details
        </p>
      </div>

      {/* Quote To Section */}
      <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 lg:p-8 mx-4 sm:mx-0">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8 space-y-4 sm:space-y-0">
          <div className="flex items-center space-x-3 sm:space-x-4">
            <div className="w-3 h-3 bg-[#ea078b] rounded-full mr-3"></div>
            <h4 className="text-xl sm:text-2xl font-bold text-slate-800">Quote To:</h4>
          </div>
          <div className="flex items-center space-x-3">
            <span className="text-sm text-slate-500 font-medium">Quote ID:</span>
            <div className="px-3 sm:px-4 py-2 bg-[#27aae1]/10 text-[#27aae1] font-mono font-semibold rounded-xl text-xs sm:text-sm border border-[#27aae1]/30">
              {formData.client.companyName ? `Q-${Date.now().toString().slice(-6)}` : 'Pending'}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
          {/* Customer Details */}
          <div className="space-y-5">
            <div className="flex items-center space-x-3 mb-4">
              <h5 className="text-lg font-semibold text-slate-700">Customer Details</h5>
            </div>
            
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-start py-3 border-b border-slate-100">
                <span className="text-sm font-medium text-slate-600 w-full sm:w-32 flex-shrink-0 mb-1 sm:mb-0">Company</span>
                <span className="font-semibold text-slate-800 text-left sm:ml-4 break-words">
                  {formData.client.clientType === "Company" ? (formData.client.companyName || 'Not specified') : 'Individual Client'}
                </span>
              </div>
              
              <div className="flex flex-col sm:flex-row sm:items-start py-3 border-b border-slate-100">
                <span className="text-sm font-medium text-slate-600 w-full sm:w-32 flex-shrink-0 mb-1 sm:mb-0">Contact Person</span>
                <span className="font-semibold text-slate-800 text-left sm:ml-4 break-words">
                  {formData.client.contactPerson || `${formData.client.firstName || ''} ${formData.client.lastName || ''}`.trim() || 'Not specified'}
                </span>
              </div>
              
              <div className="flex flex-col sm:flex-row sm:items-start py-3 border-b border-slate-100">
                <span className="text-sm font-medium text-slate-600 w-full sm:w-32 flex-shrink-0 mb-1 sm:mb-0">Email</span>
                <span className="font-semibold text-slate-800 text-left sm:ml-4 break-words">
                  {formData.client.email || 'Not specified'}
                </span>
              </div>
              
              <div className="flex flex-col sm:flex-row sm:items-start py-3">
                <span className="text-sm font-medium text-slate-600 w-full sm:w-32 flex-shrink-0 mb-1 sm:mb-0">Phone</span>
                <span className="font-semibold text-slate-800 text-left sm:ml-4 break-words">
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
              <div className="flex flex-col sm:flex-row sm:items-start py-3 border-b border-slate-100">
                <span className="text-sm font-medium text-slate-600 w-full sm:w-32 flex-shrink-0 mb-1 sm:mb-0">Client Type</span>
                <span className="font-semibold text-slate-800 text-left sm:ml-4 capitalize">
                  {formData.client.clientType || 'Not specified'}
                </span>
              </div>
              
              {formData.client.role && (
                <div className="flex flex-col sm:flex-row sm:items-start py-3 border-b border-slate-100">
                  <span className="text-sm font-medium text-slate-600 w-full sm:w-32 flex-shrink-0 mb-1 sm:mb-0">Role/Designation</span>
                  <span className="font-semibold text-slate-800 text-left sm:ml-4 break-words">
                    {formData.client.role}
                  </span>
                </div>
              )}
              
              <div className="flex flex-col sm:flex-row sm:items-start py-3 border-b border-slate-100">
                <span className="text-sm font-medium text-slate-600 w-full sm:w-32 flex-shrink-0 mb-1 sm:mb-0">Sales Person</span>
                <span className="font-semibold text-slate-800 text-left sm:ml-4">
                  {formData.salesPersonId ? 
                    salesPersons.find(p => p.salesPersonId === formData.salesPersonId)?.name || formData.salesPersonId : 
                    'Not assigned'
                  }
                </span>
              </div>
              
              <div className="flex flex-col sm:flex-row sm:items-start py-3 border-b border-slate-100">
                <span className="text-sm font-medium text-slate-600 w-full sm:w-32 flex-shrink-0 mb-1 sm:mb-0">Quote Date</span>
                <span className="font-semibold text-slate-800 text-left sm:ml-4">
                  {new Date().toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </span>
              </div>
              
              <div className="flex flex-col sm:flex-row sm:items-start py-3">
                <span className="text-sm font-medium text-slate-600 w-full sm:w-32 flex-shrink-0 mb-1 sm:mb-0">Status</span>
                <span className="px-3 py-1.5 text-xs font-semibold rounded-full bg-[#27aae1]/20 text-[#27aae1] border border-[#27aae1]/50 sm:ml-4 mt-2 sm:mt-0">
                  Draft
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Discount Management Section */}
      <div className="bg-white rounded-2xl border-0 shadow-lg p-4 sm:p-6 lg:p-8 mx-4 sm:mx-0">
        <div className="flex items-center justify-between mb-6">
          <h4 className="text-lg sm:text-xl font-semibold text-slate-800 flex items-center">
            <div className="w-3 h-3 bg-[#f89d1d] rounded-full mr-3"></div>
            Discount Management
          </h4>
        </div>

        <div className="space-y-6">
          {/* Discount Toggle and Percentage */}
          <div className="flex items-center space-x-4">
            <Checkbox
              checked={discount.isApplied}
              onCheckedChange={(checked) => {
                setDiscount(prev => ({
                  ...prev,
                  isApplied: Boolean(checked),
                  percentage: Boolean(checked) ? prev.percentage : 0,
                  amount: Boolean(checked) ? prev.amount : 0
                }));
              }}
            />
            <Label className="text-lg font-medium text-slate-700">Apply Discount</Label>
          </div>

          {discount.isApplied && (
            <div className="space-y-6">
              {/* Discount Percentage Input */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <Label className="text-sm font-medium text-slate-700 mb-2 block">
                    Discount Percentage
                  </Label>
                  <div className="relative">
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={discount.percentage || ''}
                      onChange={(e) => {
                        const inputValue = e.target.value;
                        const percentage = inputValue === '' ? 0 : Number(inputValue);
                        // Calculate discount amount based on current grand total
                        const currentGrandTotal = calculateGrandTotalWithoutDiscount();
                        const amount = (currentGrandTotal * percentage) / 100;
                        setDiscount(prev => ({
                          ...prev,
                          percentage,
                          amount
                        }));
                      }}
                      onBlur={(e) => {
                        // Ensure the value is properly formatted on blur
                        const percentage = Number(e.target.value) || 0;
                        if (percentage !== discount.percentage) {
                          const currentGrandTotal = calculateGrandTotalWithoutDiscount();
                          const amount = (currentGrandTotal * percentage) / 100;
                          setDiscount(prev => ({
                            ...prev,
                            percentage,
                            amount
                          }));
                        }
                      }}
                      className="border-slate-300 focus:border-orange-500 focus:ring-orange-500 rounded-xl pr-12"
                      placeholder="0.0"
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <Percent className="h-5 w-5 text-slate-400" />
                    </div>
                  </div>
                  
                  {/* Quick Discount Buttons */}
                  <div className="mt-2 flex flex-wrap gap-2">
                    {[5, 10, 15, 20, 25].map((percent) => (
                      <Button
                        key={percent}
                        type="button"
                        variant="outline"
                        size="sm"
                        className={`text-xs px-2 sm:px-3 py-1 h-7 sm:h-8 ${
                          discount.percentage === percent
                            ? 'bg-orange-100 border-orange-300 text-orange-700'
                            : 'border-slate-300 text-slate-600 hover:bg-slate-50'
                        }`}
                        onClick={() => {
                          const currentGrandTotal = calculateGrandTotalWithoutDiscount();
                          const amount = (currentGrandTotal * percent) / 100;
                          setDiscount(prev => ({
                            ...prev,
                            percentage: percent,
                            amount
                          }));
                        }}
                      >
                        {percent}%
                      </Button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium text-slate-700 mb-2 block">
                    Discount Amount
                  </Label>
                  <div className="relative">
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={discount.amount}
                      readOnly
                      className="bg-slate-100 border-slate-300 rounded-xl pr-12 font-medium"
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <Package className="h-5 w-5 text-slate-400" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Discount Approval Section */}
              <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-xl p-6 border border-orange-200">
                <h5 className="text-lg font-semibold text-orange-800 mb-4 flex items-center">
                  <Settings className="w-5 h-5 mr-2" />
                  Discount Approval Required
                </h5>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div>
                    <Label className="text-sm font-medium text-orange-700 mb-2 block">
                      Approved By
                    </Label>
                    <Select
                      value={discountApproval.approvedBy}
                      onValueChange={(value) =>
                        setDiscountApproval(prev => ({
                          ...prev,
                          approvedBy: value
                        }))
                      }
                    >
                      <SelectTrigger className="border-orange-300 focus:border-orange-500 focus:ring-orange-500 rounded-xl bg-white">
                        <SelectValue placeholder="Select approver" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border border-slate-200 shadow-lg">
                        {availableApprovers.map((approver) => (
                          <SelectItem key={approver} value={approver} className="hover:bg-slate-50">
                            {approver}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-orange-700 mb-2 block">
                      Reason for Discount
                    </Label>
                    <Input
                      type="text"
                      value={discountApproval.reason}
                      onChange={(e) =>
                        setDiscountApproval(prev => ({
                          ...prev,
                          reason: e.target.value
                        }))
                      }
                      className="border-orange-300 focus:border-orange-500 focus:ring-orange-500 rounded-xl"
                      placeholder="e.g., Bulk order, Loyal customer, etc."
                    />
                  </div>
                </div>

                {discountApproval.approvedBy && discountApproval.reason && (
                  <div className="mt-4 p-4 bg-white rounded-lg border border-orange-200">
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-sm text-orange-700">
                        <span className="font-medium">Approved by:</span> {discountApproval.approvedBy}
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="text-xs px-2 py-1 h-6 border-orange-300 text-orange-700 hover:bg-orange-50"
                        onClick={() => {
                          setDiscountApproval(prev => ({
                            ...prev,
                            approvedBy: '',
                            reason: ''
                          }));
                        }}
                      >
                        Change Approver
                      </Button>
                    </div>
                    <div className="text-sm text-orange-700 mb-2">
                      <span className="font-medium">Date:</span> {discountApproval.approvedAt.toLocaleDateString()}
                    </div>
                    <div className="text-sm text-orange-700">
                      <span className="font-medium">Reason:</span> {discountApproval.reason}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Discount Summary */}
          {discount.isApplied && discount.percentage > 0 && (
            <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-6 border border-green-200">
              <h5 className="text-lg font-semibold text-green-800 mb-4 flex items-center">
                <Calculator className="w-5 h-5 mr-2" />
                Discount Summary
              </h5>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                <div className="bg-white rounded-lg p-4 border border-green-200">
                  <div className="text-sm text-green-600 mb-1">Original Total</div>
                  <div className="text-xl font-bold text-slate-800">{currency(summaryTotals.grandTotal)}</div>
                </div>
                
                <div className="bg-white rounded-lg p-4 border border-green-200">
                  <div className="text-sm text-green-600 mb-1">Discount ({discount.percentage}%)</div>
                  <div className="text-xl font-bold text-red-600">-{currency(summaryTotals.discountAmount)}</div>
                </div>
                
                <div className="bg-white rounded-lg p-4 border border-green-200">
                  <div className="text-sm text-green-600 mb-1">Final Total</div>
                  <div className="text-xl font-bold text-green-600">{currency(summaryTotals.finalTotal)}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Price summary */}
      <div className="bg-white rounded-2xl border-0 shadow-lg p-4 sm:p-6 lg:p-8 mx-4 sm:mx-0">
        <div className="flex items-center justify-between mb-6">
          <h4 className="text-lg sm:text-xl font-semibold text-slate-800 flex items-center">
            <div className="w-3 h-3 bg-[#27aae1] rounded-full mr-3"></div>
            Price Summary
          </h4>
        </div>

        {/* Desktop Table - Hidden on mobile */}
        <div className="hidden lg:block overflow-hidden rounded-xl border border-slate-200">
          <Table>
            <TableHeader className="bg-[#27aae1]/10">
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
                <TableHead className="text-right text-slate-700 font-semibold py-4 px-6">Total Price</TableHead>
                <TableHead className="text-right text-slate-700 font-semibold py-4 px-6">VAT (5%)</TableHead>
                <TableHead className="text-right text-slate-700 font-semibold py-4 px-6">Final Price</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {/* Main Products */}
              {formData.products.map((product, index) => {
                const costs = calculateProductCosts(index);
                const isIncluded = includedProducts.has(index);
                
                return (
                  <TableRow key={`product-${index}`} className="border-slate-200 hover:bg-slate-50 transition-colors">
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
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-[#f89d1d]/20 text-[#f89d1d]">
                        {product.quantity || 0}
                      </span>
                    </TableCell>
                    <TableCell className="text-right text-slate-700 py-4 px-6 font-medium">
                      {isIncluded ? (
                        <span className="text-lg font-bold text-[#ea078b]">{currency(costs.total - costs.vat)}</span>
                      ) : "—"}
                    </TableCell>
                    <TableCell className="text-right text-slate-700 py-4 px-6">
                      {isIncluded ? (
                        <span className="text-green-600 font-medium">{currency(costs.vat)}</span>
                      ) : "—"}
                    </TableCell>
                    <TableCell className="text-right py-4 px-6">
                      {isIncluded ? (
                        <span className="text-lg font-bold text-[#ea078b]">{currency(costs.total)}</span>
                      ) : "—"}
                    </TableCell>
                  </TableRow>
                );
              })}
              
              {/* Supplementary Quantities */}
              {otherQuantities.map((otherQty, index) => {
                const prices = calculateOtherQtyPrice(otherQty);
                
                return (
                  <TableRow key={`other-${index}`} className="border-slate-200 hover:bg-slate-50 transition-colors bg-blue-50/30">
                    <TableCell className="py-4 px-6">
                      <div className="w-4 h-4 rounded border-2 border-blue-300 bg-blue-100 flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium text-slate-800 py-4 px-6">
                      <span className="text-blue-700">{otherQty.productName}</span>
                      <span className="text-xs text-blue-600 block">(Supplementary)</span>
                    </TableCell>
                    <TableCell className="text-slate-700 py-4 px-6">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-700">
                        {otherQty.quantity || 0}
                      </span>
                    </TableCell>
                    <TableCell className="text-right text-slate-700 py-4 px-6 font-medium">
                      <span className="text-lg font-bold text-[#ea078b]">{currency(prices.base)}</span>
                    </TableCell>
                    <TableCell className="text-right text-slate-700 py-4 px-6">
                      <span className="text-green-600 font-medium">{currency(prices.vat)}</span>
                    </TableCell>
                    <TableCell className="text-right py-4 px-6">
                      <span className="text-lg font-bold text-[#ea078b]">{currency(prices.total)}</span>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {/* Mobile Cards - Visible only on mobile */}
        <div className="lg:hidden space-y-4">
          {/* Main Products */}
          {formData.products.map((product, index) => {
            const costs = calculateProductCosts(index);
            const isIncluded = includedProducts.has(index);
            
            return (
              <div key={`product-${index}`} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                {/* Header with checkbox and product name */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 space-y-2 sm:space-y-0">
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      checked={isIncluded}
                      onCheckedChange={() => toggleProductInclusion(index)}
                    />
                    <h4 className="font-medium text-slate-800 text-sm sm:text-base">{product.productName}</h4>
                  </div>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs sm:text-sm font-medium bg-[#f89d1d]/20 text-[#f89d1d]">
                    Qty: {product.quantity || 0}
                  </span>
                </div>
                
                {/* Simplified cost breakdown */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Total Price:</span>
                    <span className="font-medium">{isIncluded ? currency(costs.total - costs.vat) : "—"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">VAT (5%):</span>
                    <span className="font-medium">{isIncluded ? (
                      <span className="text-green-600">{currency(costs.vat)}</span>
                    ) : "—"}</span>
                  </div>
                </div>
                
                {/* Total Price */}
                <div className="mt-3 pt-3 border-t border-slate-200">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-700 font-semibold text-sm sm:text-base">Total Price:</span>
                    <span className="text-base sm:text-lg font-bold text-[#ea078b]">
                      {isIncluded ? currency(costs.total) : "—"}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
          
          {/* Supplementary Quantities */}
          {otherQuantities.map((otherQty, index) => {
            const prices = calculateOtherQtyPrice(otherQty);
            
            return (
              <div key={`other-${index}`} className="bg-blue-50/30 rounded-xl border border-blue-200 p-4 shadow-sm">
                {/* Header with indicator and product name */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 space-y-2 sm:space-y-0">
                  <div className="flex items-center space-x-3">
                    <div className="w-4 h-4 rounded border-2 border-blue-300 bg-blue-100 flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                    </div>
                    <div>
                      <h4 className="font-medium text-blue-700 text-sm sm:text-base">{otherQty.productName}</h4>
                      <span className="text-xs text-blue-600">(Supplementary)</span>
                    </div>
                  </div>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs sm:text-sm font-medium bg-blue-100 text-blue-700">
                    Qty: {otherQty.quantity || 0}
                  </span>
                </div>
                
                {/* Simplified cost breakdown */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Total Price:</span>
                    <span className="font-medium">{currency(prices.base)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">VAT (5%):</span>
                    <span className="font-medium">
                      <span className="text-green-600">{currency(prices.vat)}</span>
                    </span>
                  </div>
                </div>
                
                {/* Total Price */}
                <div className="mt-3 pt-3 border-t border-blue-200">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-700 font-semibold text-sm sm:text-base">Total Price:</span>
                    <span className="text-base sm:text-lg font-bold text-[#ea078b]">
                      {currency(prices.total)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Simplified Price Summary */}
        <div className="mt-8 space-y-4">
          <div className="bg-[#27aae1]/10 rounded-2xl p-4 sm:p-6 lg:p-8 border border-[#27aae1]/30 shadow-lg">
            <h5 className="text-lg sm:text-xl font-bold text-slate-800 mb-6 flex items-center justify-center text-center">
              <Calculator className="w-6 h-6 mr-3 text-[#27aae1]" />
              Price Summary
            </h5>
            
            {/* Simplified Price Breakdown */}
            <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
              <div className="space-y-4">
                {/* Total Price */}
                <div className="flex justify-between items-center py-3 border-b border-slate-200">
                  <span className="text-lg font-semibold text-slate-700">Total Price</span>
                  <span className="text-lg font-bold text-slate-800">{currency(summaryTotals.grandTotal - summaryTotals.totalVAT)}</span>
                </div>

                {/* Additional Costs - Show when present */}
                {summaryTotals.totalAdditionalCost > 0 && (
                  <div className="flex justify-between items-center py-3 border-b border-slate-200">
                    <span className="text-lg font-semibold text-slate-700">Additional Costs</span>
                    <span className="text-lg font-bold text-blue-600">{currency(summaryTotals.totalAdditionalCost)}</span>
                  </div>
                )}

                {/* Discount - Show when applied */}
                {discount.isApplied && discount.percentage > 0 && (
                  <div className="flex justify-between items-center py-3 border-b border-slate-200">
                    <span className="text-lg font-semibold text-slate-700">Discount ({discount.percentage}%)</span>
                    <span className="text-lg font-bold text-red-600">-{currency(summaryTotals.discountAmount)}</span>
                  </div>
                )}

                {/* VAT */}
                <div className="flex justify-between items-center py-3 border-b border-slate-200">
                  <span className="text-lg font-semibold text-slate-700">VAT (5%)</span>
                  <span className="text-lg font-bold text-green-600">{currency(summaryTotals.totalVAT)}</span>
                </div>

                {/* Final Total */}
                <div className="flex justify-between items-center py-4 border-t-2 border-slate-300 bg-slate-50 rounded-lg px-4">
                  <span className="text-xl font-bold text-slate-800">Final Price</span>
                  <span className="text-2xl font-bold text-[#ea078b]">{currency(summaryTotals.finalTotal)}</span>
                </div>
              </div>
            </div>

            {/* Additional Info */}
            <div className="mt-4 text-center">
              <div className="text-xs text-slate-500">
                * All prices are in AED (UAE Dirham) and include applicable taxes
              </div>
              <div className="text-xs text-slate-500 mt-1">
                ** Quote valid for 30 days from date of issue
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Other quantities */}
      <div className="bg-white rounded-2xl border-0 shadow-lg p-4 sm:p-6 lg:p-8 mx-4 sm:mx-0">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 space-y-3 sm:space-y-0">
          <h4 className="text-lg sm:text-xl font-semibold text-slate-800 flex items-center">
            <div className="w-3 h-3 bg-[#ea078b] rounded-full mr-3"></div>
            Supplementary Information: Other Quantities
          </h4>
        </div>
        
        <Button 
          variant="outline" 
          className="mb-6 border-[#27aae1] text-[#27aae1] hover:bg-[#27aae1]/10 hover:border-[#27aae1] rounded-xl px-6 py-3 transition-all duration-200" 
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
                className="bg-[#27aae1]/10 rounded-2xl p-6 border border-slate-200 hover:shadow-md transition-all duration-200"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4 items-end">
                  <div className="lg:col-span-3 sm:col-span-2">
                    <Label className="text-sm font-medium text-slate-700 mb-2 block">Product Name</Label>
                    <Select
                      value={row.productName}
                      onValueChange={(value) =>
                        updateOtherQty(idx, { productName: value })
                      }
                    >
                      <SelectTrigger className="border-slate-300 focus:border-[#27aae1] focus:ring-[#27aae1] rounded-xl">
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
                  <div className="lg:col-span-2 sm:col-span-2">
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
                      className="border-slate-300 focus:border-[#27aae1] focus:ring-[#27aae1] rounded-xl"
                    />
                  </div>
                  <div className="lg:col-span-2 sm:col-span-2">
                    <Label className="text-sm font-medium text-slate-700 mb-2 block">Base Price</Label>
                    <Input
                      readOnly
                      className="bg-slate-100 border-slate-300 rounded-xl font-medium"
                      value={currency(prices.base)}
                    />
                  </div>

                  <div className="lg:col-span-3 sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                        className="bg-slate-100 border-slate-300 rounded-xl font-bold text-[#27aae1]"
                      value={currency(prices.total)}
                      />
                    </div>
                  </div>

                  <div className="lg:col-span-1 sm:col-span-2 flex flex-col items-center sm:items-end">
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

      {/* Approval Status Section */}
      {quoteApproval.requiresApproval && (
        <div className="bg-white rounded-2xl border-0 shadow-lg p-4 sm:p-6 lg:p-8 mx-4 sm:mx-0">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 space-y-3 sm:space-y-0">
            <h4 className="text-lg sm:text-xl font-semibold text-slate-800 flex items-center">
              <div className="w-3 h-3 bg-orange-500 rounded-full mr-3"></div>
              Approval Required
            </h4>
            <div className={`px-3 py-1.5 text-xs font-semibold rounded-full ${getApprovalStatusColor(quoteApproval.status)} border`}>
              {quoteApproval.status}
            </div>
          </div>

          <div className="bg-orange-50 border border-orange-200 rounded-xl p-6">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="h-6 w-6 text-orange-600 mt-1 flex-shrink-0" />
              <div className="flex-1">
                <h5 className="text-lg font-semibold text-orange-800 mb-3">
                  This quote requires management approval
                </h5>
                <div className="space-y-3">
                  <div className="bg-white rounded-lg p-4 border border-orange-200">
                    <h6 className="font-medium text-orange-800 mb-2">Approval Reasons:</h6>
                    <p className="text-orange-700 text-sm">{quoteApproval.approvalReason}</p>
                    <div className="mt-2 text-xs text-orange-600">
                      <strong>Note:</strong> Approval is required for quotes over AED 5,000, high discounts (≥20%), or low margins (&lt;10%).
                    </div>
                  </div>
                  
                  <div className="bg-white rounded-lg p-4 border border-orange-200">
                    <h6 className="font-medium text-orange-800 mb-2">Current Status:</h6>
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-orange-600" />
                      <span className="text-orange-700 text-sm">
                        Quote is pending approval. Customer PDF download and "Send to Customer" options are disabled until approved.
                      </span>
                    </div>
                  </div>
                  
                  <div className="bg-white rounded-lg p-4 border border-orange-200">
                    <h6 className="font-medium text-orange-800 mb-2">Next Steps:</h6>
                    <ol className="text-orange-700 text-sm space-y-1">
                      <li>1. Submit quote for approval using "Send for Approval" action</li>
                      <li>2. Wait for management review and approval</li>
                      <li>3. Once approved, customer communication options will be enabled</li>
                    </ol>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Download Options */}
      <div className="bg-white rounded-2xl border-0 shadow-lg p-4 sm:p-6 lg:p-8 mx-4 sm:mx-0">
        <div className="flex items-center justify-between mb-6">
          <h4 className="text-lg sm:text-xl font-semibold text-slate-800 flex items-center">
            <div className="w-3 h-3 bg-indigo-500 rounded-full mr-3"></div>
            Download Options
          </h4>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          {/* Customer Copy Download */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 sm:p-6 border border-green-200 hover:shadow-md transition-all duration-200">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                <span className="text-base sm:text-lg font-semibold text-green-800">Customer Copy</span>
              </div>
              <Download className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
            </div>
            <p className="text-green-700 mb-3 sm:mb-4 text-xs sm:text-sm">
              Professional quote document suitable for customer presentation
            </p>
            <Button
              className="w-full bg-green-600 hover:bg-green-700 text-white rounded-xl py-2 sm:py-3 text-sm sm:text-base shadow-lg hover:shadow-xl transition-all duration-300"
              onClick={async () => {
                try {
                  await downloadCustomerPdf(formData, otherQuantities);
                } catch (error) {
                  console.error('Error downloading customer PDF:', error);
                  alert('Error generating customer PDF. Please check the console for details.');
                }
              }}
            >
              <Download className="w-4 h-4 mr-2" />
              Download Customer Copy
            </Button>
          </div>

          {/* Operations Copy Download */}
          <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl p-4 sm:p-6 border border-orange-200 hover:shadow-md transition-all duration-200">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-orange-500 rounded-full mr-3"></div>
                <span className="text-base sm:text-lg font-semibold text-orange-800">Operations Copy</span>
              </div>
              <Settings className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600" />
            </div>
            <p className="text-orange-700 mb-3 sm:mb-4 text-xs sm:text-sm">
              Detailed technical specifications for production team
            </p>
            <Button
              className="w-full bg-orange-600 hover:bg-orange-700 text-white rounded-xl py-2 sm:py-3 text-sm sm:text-base shadow-lg hover:shadow-xl transition-all duration-300"
              onClick={async () => {
                try {
                  await downloadOpsPdf(formData, otherQuantities);
                } catch (error) {
                  console.error('Error downloading operations PDF:', error);
                  alert('Error generating operations PDF. Please check the console for details.');
                }
              }}
            >
              <Download className="w-4 h-4 mr-2" />
              Download Operations Copy
            </Button>
          </div>
        </div>
      </div>

      {/* Summary Footer */}
      <div className="bg-[#27aae1]/10 rounded-2xl border border-slate-200 p-4 sm:p-6 mx-4 sm:mx-0">
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

        {/* Action Selection */}
        <div className="mb-6">
          <h4 className="text-lg font-semibold text-slate-800 mb-4 text-center">Choose Your Action</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Button
              variant={submissionAction === 'Save Draft' ? 'default' : 'outline'}
              className={`h-10 sm:h-12 text-sm sm:text-base ${
                submissionAction === 'Save Draft' 
                  ? 'bg-[#27aae1] hover:bg-[#1e8bc3] text-white' 
                  : 'border-slate-300 text-slate-700 hover:bg-slate-50'
              }`}
              onClick={() => handleSubmissionActionChange('Save Draft')}
            >
              💾 Save Draft
            </Button>
            
            <Button
              variant={submissionAction === 'Send for Approval' ? 'default' : 'outline'}
              className={`h-10 sm:h-12 text-sm sm:text-base ${
                submissionAction === 'Send for Approval' 
                  ? 'bg-[#f89d1d] hover:bg-[#e88a0a] text-white' 
                  : 'border-slate-300 text-slate-700 hover:bg-slate-50'
              }`}
              onClick={() => handleSubmissionActionChange('Send for Approval')}
            >
              📋 Send for Approval
            </Button>
            
            <Button
              variant={submissionAction === 'Send to Customer' ? 'default' : 'outline'}
              className={`h-10 sm:h-12 text-sm sm:text-base ${
                submissionAction === 'Send to Customer' 
                  ? 'bg-[#ea078b] hover:bg-[#d4067a] text-white' 
                  : 'border-slate-300 text-slate-700 hover:bg-slate-50'
              } ${quoteApproval.requiresApproval ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={() => handleSubmissionActionChange('Send to Customer')}
              disabled={quoteApproval.requiresApproval}
              title={quoteApproval.requiresApproval ? 'Approval required before sending to customer' : 'Send quote directly to customer'}
            >
              📧 Send to Customer
            </Button>
          </div>
        </div>

        {/* Conditional Forms Based on Action */}
        {submissionAction === 'Send for Approval' && (
          <div className="mb-6 bg-[#f89d1d]/10 border border-[#f89d1d]/30 rounded-xl p-6">
            <h5 className="text-lg font-semibold text-black mb-4 flex items-center">
              📋 Approval Request Details
            </h5>
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-black mb-2 block">
                  Approval Notes
                </Label>
                <textarea
                  value={quoteApproval.approvalNotes || ''}
                  onChange={(e) => setQuoteApproval(prev => ({
                    ...prev,
                    approvalNotes: e.target.value
                  }))}
                  className="w-full border-[#f89d1d]/50 focus:border-[#f89d1d] focus:ring-[#f89d1d] rounded-xl p-3 resize-none"
                  rows={3}
                  placeholder="Add any notes or context for the approval request..."
                />
              </div>

              {/* Approver Selection */}
              <div>
                <Label className="text-sm font-medium text-black mb-2 block">
                  Select Approver
                </Label>
                <Select
                  value={quoteApprover.approvedBy}
                  onValueChange={(value) =>
                    setQuoteApprover(prev => ({
                      ...prev,
                      approvedBy: value,
                      reason: quoteApproval.approvalReason || 'Quote requires approval due to amount or discount threshold',
                      approvedAt: new Date()
                    }))
                  }
                >
                  <SelectTrigger className="border-[#f89d1d]/50 focus:border-[#f89d1d] focus:ring-[#f89d1d] rounded-xl bg-white">
                    <SelectValue placeholder="Select approver" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-slate-200 shadow-lg">
                    {availableApprovers.map((approver) => (
                      <SelectItem key={approver} value={approver} className="hover:bg-slate-50">
                        {approver}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Show selected approver with change option */}
              {quoteApprover.approvedBy && (
                <div className="mt-4 p-4 bg-white rounded-lg border border-[#f89d1d]/30">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-sm text-[#f89d1d]">
                      <span className="font-medium">Selected Approver:</span> {quoteApprover.approvedBy}
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="text-[#f89d1d] border-[#f89d1d] hover:bg-[#f89d1d] hover:text-white"
                      onClick={() => {
                        setQuoteApprover(prev => ({
                          ...prev,
                          approvedBy: '',
                          reason: ''
                        }));
                      }}
                    >
                      Change Approver
                    </Button>
                  </div>
                  <div className="text-sm text-[#f89d1d] mb-2">
                    <span className="font-medium">Reason:</span> {quoteApprover.reason}
                  </div>
                  <div className="text-xs text-[#f89d1d]">
                    <span className="font-medium">Selected:</span> {quoteApprover.approvedAt.toLocaleDateString()}
                  </div>
                </div>
              )}

              <div className="text-sm text-black">
                <strong>Note:</strong> This quote will be marked as "Pending Approval" and will require manager approval before it can be sent to the customer.
              </div>
            </div>
          </div>
        )}

        {submissionAction === 'Send to Customer' && (
          <div className="mb-6 bg-[#ea078b]/10 border border-[#ea078b]/30 rounded-xl p-6">
            <h5 className="text-lg font-semibold text-black mb-4 flex items-center">
              📧 Customer Communication
            </h5>
            <div className="text-sm text-black">
              {quoteApproval.requiresApproval ? (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                    <span className="font-semibold text-red-800">Approval Required</span>
                  </div>
                  <p className="text-red-700">
                    <strong>Cannot send to customer:</strong> This quote requires management approval before it can be sent to the customer.
                  </p>
                  <p className="text-red-600 text-xs mt-2">
                    Please use "Send for Approval" instead to submit this quote for management review.
                  </p>
                </div>
              ) : (
                <>
                  <p className="mb-2">
                    <strong>Note:</strong> This quote will be sent directly to the customer.
                  </p>
                  <p>
                    Customer PDF download and "Send to Customer" options are enabled for this quote.
                  </p>
                </>
              )}
            </div>
          </div>
        )}

        <div className="text-center space-y-3">
          <h4 className="text-lg font-semibold text-slate-800">
            {submissionAction === 'Save Draft' && 'Ready to Save?'}
            {submissionAction === 'Send for Approval' && 'Ready to Send for Approval?'}
            {submissionAction === 'Send to Customer' && 'Ready to Send to Customer?'}
          </h4>
          <p className="text-slate-600">
            {submissionAction === 'Save Draft' && 'Review all details above and click the Save Quote button when ready to proceed'}
            {submissionAction === 'Send for Approval' && 'This quote will be sent to management for approval before customer submission'}
            {submissionAction === 'Send to Customer' && 'This quote will be emailed directly to the customer with the specified attachments'}
          </p>
          
          {/* Final Action Button */}
          <div className="mt-6">
            <Button
              onClick={handleSaveWithValidation}
              className={`h-12 sm:h-14 px-6 sm:px-8 text-base sm:text-lg font-semibold rounded-xl ${
                submissionAction === 'Save Draft' 
                  ? 'bg-[#27aae1] hover:bg-[#1e8bc3] text-white' 
                  : submissionAction === 'Send for Approval'
                  ? 'bg-orange-600 hover:bg-orange-700 text-white'
                  : 'bg-green-600 hover:bg-green-700 text-white'
              }`}
              disabled={validationErrors.length > 0 || (submissionAction === 'Send to Customer' && quoteApproval.requiresApproval)}
            >
              {submissionAction === 'Save Draft' && '💾 Save Quote'}
              {submissionAction === 'Send for Approval' && '📋 Send for Approval'}
              {submissionAction === 'Send to Customer' && '📧 Send to Customer'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Step5Quotation;