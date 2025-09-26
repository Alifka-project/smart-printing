"use client";

import React, { useState, useEffect, Suspense } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Sparkles, Copy, FileText, Eye, Edit, Search, Save } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import StepIndicator from "@/components/create-quote/StepIndicator";
import Step2CustomerChoose from "@/components/create-quote/steps/Step2CustomerChoose";
import Step2CustomerDetail from "@/components/create-quote/steps/Step2CustomerDetail";
import Step3ProductSpec from "@/components/create-quote/steps/Step3ProductSpec";
import Step4Operational from "@/components/create-quote/steps/Step4Operational";
import Step5Quotation from "@/components/create-quote/steps/Step5Quotation";
import { QuoteFormData } from "@/types";
import { downloadCustomerPdf, downloadOpsPdf, OtherQty } from "@/lib/quote-pdf";
import { QUOTE_DETAILS } from "@/lib/dummy-data";
import { detailToForm } from "@/lib/detail-to-form";
import { PreviousQuote } from "@/types";

const EMPTY_CLIENT: QuoteFormData["client"] = {
  clientType: "Individual",
  companyName: "",
  contactPerson: "",
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  countryCode: "+971",
  role: "",
  address: "",
  city: "",
  state: "",
  postalCode: "",
  country: "Dubai",
  additionalInfo: "",
};

// Synthetic customer data
const SYNTHETIC_CUSTOMERS: {
  id: string;
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string;
  countryCode: string;
  role: string;
  clientType: 'Individual' | 'Company';
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  additionalInfo?: string;
}[] = [
  {
    id: "CUST001",
    companyName: "Eagan Inc.",
    contactPerson: "John Smith",
    email: "john.smith@eagan.com",
    phone: "+971-50-123-4567",
    countryCode: "+971",
    role: "Marketing Manager",
    clientType: "Company",
    address: "Sheikh Zayed Road, Office 1205, Business Bay",
    city: "Dubai",
    state: "Dubai",
    postalCode: "00000",
    country: "Dubai",
    additionalInfo: "Regular customer, prefers digital communication"
  },
  {
    id: "CUST002",
    companyName: "Tech Solutions Ltd.",
    contactPerson: "Sarah Johnson",
    email: "sarah.j@techsolutions.com",
    phone: "+971-55-987-6543",
    countryCode: "+971",
    role: "Operations Director",
    clientType: "Company",
    address: "Marina Walk, Tower 3, Level 15",
    city: "Dubai",
    state: "Dubai",
    postalCode: "00000",
    country: "Dubai",
    additionalInfo: "Bulk orders, requires detailed quotations"
  },
  {
    id: "CUST003",
    companyName: "Global Print Corp.",
    contactPerson: "Michael Brown",
    email: "michael.b@globalprint.com",
    phone: "+971-52-456-7890",
    countryCode: "+971",
    role: "Customer",
    clientType: "Company",
    address: "Al Wasl Road, Villa 25",
    city: "Dubai",
    state: "Dubai",
    postalCode: "00000",
    country: "Dubai",
    additionalInfo: "Individual client, small quantity orders"
  },
  {
    id: "CUST004",
    companyName: "Creative Agency",
    contactPerson: "Lisa Wilson",
    email: "lisa.w@creativeagency.com",
    phone: "+971-54-321-0987",
    countryCode: "+971",
    role: "Creative Director",
    clientType: "Company",
    address: "Jumeirah Beach Road, Office 45",
    city: "Dubai",
    state: "Dubai",
    postalCode: "00000",
    country: "Dubai",
    additionalInfo: "Creative projects, high-quality printing"
  },
  {
    id: "CUST005",
    companyName: "Marketing Pro",
    contactPerson: "David Lee",
    email: "david.lee@marketingpro.com",
    phone: "+971-56-789-0123",
    countryCode: "+971",
    role: "Marketing Specialist",
    clientType: "Company",
    address: "Al Barsha, Office 12",
    city: "Dubai",
    state: "Dubai",
    postalCode: "00000",
    country: "Dubai",
    additionalInfo: "Marketing materials, regular orders"
  }
];

// Create a separate component that uses useSearchParams
function CreateQuoteContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [currentStep, setCurrentStep] = useState(1);
  const [quoteMode, setQuoteMode] = useState<"new" | "existing" | null>(null);
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<{
    id?: string; // Add optional ID field for existing customers
    clientType: 'Individual' | 'Company';
    companyName: string | null;
    contactPerson: string;
    email: string;
    phone: string;
    countryCode: string;
    role: string | null;
    address?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
    additionalInfo?: string;
  } | null>(null);
  const [selectedQuoteId, setSelectedQuoteId] = useState<string | null>(null);
  const [customerSearch, setCustomerSearch] = useState("");
  const [showCustomerList, setShowCustomerList] = useState(false);

  const [formData, setFormData] = useState<QuoteFormData>({
    client: { ...EMPTY_CLIENT },
    products: [
      {
        productName: "Business Card",
        quantity: 1000,
        sides: "1" as const,
        printingSelection: "Digital" as const,
        flatSize: { width: 9, height: 5.5, spine: null },
        closeSize: { width: 9, height: 5.5, spine: null },
        useSameAsFlat: false,
        papers: [{ name: "Art Paper", gsm: "300" }],
        finishing: ["UV Spot", "Lamination"],
        paperName: "Book",
      },
    ],
    operational: {
      papers: [
        {
          inputWidth: 65,
          inputHeight: 90,
          pricePerPacket: 240,
          sheetsPerPacket: 500,
          recommendedSheets: 125,
          enteredSheets: 130,
          outputWidth: null,
          outputHeight: null,
        },
      ],
      finishing: [
        { name: "UV Spot", cost: 20 },
        { name: "Lamination", cost: 15 },
      ],
      plates: 4,
      units: 5000,
    },
    calculation: {
      basePrice: 0,
      marginAmount: 0,
      subtotal: 0,
      vatAmount: 0,
      totalPrice: 0,
    },
  });

  // ===== NEW: state untuk Other Quantities di parent
  const mainProduct = formData.products[0];
  const [otherQuantities, setOtherQuantities] = useState<OtherQty[]>([
    {
      productName: mainProduct?.productName ?? "Business Card",
      quantity: 500,
      price: 115,
    },
  ]);

  useEffect(() => {
    setOtherQuantities((prev) =>
      prev.length === 0
        ? prev
        : [
            {
              ...prev[0],
              productName: mainProduct?.productName ?? prev[0].productName,
            },
            ...prev.slice(1),
          ]
    );
  }, [mainProduct?.productName]);

  // Monitor form data changes
  useEffect(() => {
    console.log('Parent: Form data updated:', formData);
    console.log('Parent: Client data:', formData.client);
    console.log('Parent: Client firstName:', formData.client.firstName);
    console.log('Parent: Client lastName:', formData.client.lastName);
    console.log('Parent: Client contactPerson:', formData.client.contactPerson);
  }, [formData]);

  // Handle URL parameters for step and edit mode
  useEffect(() => {
    const stepParam = searchParams.get('step');
    const editParam = searchParams.get('edit');
    
    if (stepParam) {
      const stepNumber = parseInt(stepParam);
      if (stepNumber >= 1 && stepNumber <= 5) {
        setCurrentStep(stepNumber);
      }
    }
    
    if (editParam) {
      setQuoteMode("existing");
      setSelectedQuoteId(null); // Will be set when a specific quote is selected
      // You can load existing quote data here if needed
    }
  }, [searchParams]);

  // Memoize the products finishing check to prevent unnecessary re-renders
  const productsFinishingCheck = React.useMemo(() => {
    return formData.products.map(product => ({
      productName: product.productName,
      finishing: product.finishing
    }));
  }, [formData.products]);

  useEffect(() => {
    const MARGIN_PERCENTAGE = 0.3;
    const VAT_PERCENTAGE = 0.05;

    // 1. Paper Costs (price per sheet × entered sheets)
    const paperCost = formData.operational.papers.reduce((total, p) => {
      const pricePerSheet = (p.pricePerPacket || 0) / (p.sheetsPerPacket || 1);
      const actualSheetsNeeded = p.enteredSheets || 0;
      return total + (pricePerSheet * actualSheetsNeeded);
    }, 0);

    // 2. Plates Cost (per plate, typically $25-50 per plate)
    const PLATE_COST_PER_PLATE = 35; // Standard plate cost
    const platesCost = (formData.operational.plates || 0) * PLATE_COST_PER_PLATE;

    // 3. Finishing Costs (cost per unit × actual units needed)
    const actualUnitsNeeded = formData.operational.units || formData.products[0]?.quantity || 0;
    const finishingCost = formData.operational.finishing.reduce((total, f) => {
      // Check if this finishing is used by any product using memoized check
      const isUsedByAnyProduct = productsFinishingCheck.some(product => 
        product.finishing.includes(f.name)
      );
      if (isUsedByAnyProduct) {
        return total + ((f.cost || 0) * actualUnitsNeeded);
      }
      return total;
    }, 0);

    // 4. Calculate total costs
    const basePrice = paperCost + platesCost + finishingCost;
    const marginAmount = basePrice * MARGIN_PERCENTAGE;
    const subtotal = basePrice + marginAmount;
    const vatAmount = subtotal * VAT_PERCENTAGE;
    const totalPrice = subtotal + vatAmount;

    console.log("Calculation triggered:", {
      paperCost,
      platesCost,
      finishingCost,
      basePrice,
      marginAmount,
      subtotal,
      vatAmount,
      totalPrice,
      productsFinishingCheck,
      actualUnitsNeeded
    });

    setFormData((prev) => ({
      ...prev,
      calculation: { basePrice, marginAmount, subtotal, vatAmount, totalPrice },
    }));
  }, [
    formData.operational.papers,
    formData.operational.plates,
    formData.operational.units,
    formData.operational.finishing,
    productsFinishingCheck,
    formData.products
  ]);

  const nextStep = () => setCurrentStep((s) => Math.min(5, s + 1));
  const prevStep = () => setCurrentStep((s) => Math.max(1, s - 1));

  // Add validation functions for Next button
  const canProceedFromStep1 = () => {
    return quoteMode !== null; // User must select either new or existing quote mode
  };

  const canProceedFromStep2 = () => {
    if (quoteMode === "new") {
      // For new quote mode, validate all essential fields including new ones
      const client = formData.client;
      
      // Basic required fields
      const essentialFields = [
        client.firstName, // First name is required
        client.email,     // Email is required
        client.phone      // Phone is required
      ];
      
      // Add company-specific required fields only if company type
      if (client.clientType === "Company") {
        essentialFields.push(client.companyName);
      }
      
      // Check if basic fields are filled
      const basicFieldsValid = essentialFields.every(field => field && field.trim() !== "");
      
      // Check TRN requirement (either TRN filled or "No TRN" selected)
      const trnValid = client.hasNoTrn || (client.trn && client.trn.trim() !== "");
      
      // Check Area requirement
      const areaValid = client.area && client.area.trim() !== "";
      
      // Check State and Country (should have defaults)
      const stateValid = client.state && client.state.trim() !== "";
      const countryValid = client.country && client.country.trim() !== "";
      
      return basicFieldsValid && trnValid && areaValid && stateValid && countryValid;
    } else if (quoteMode === "existing") {
      // For existing quote mode, we need to select an actual existing quote
      return selectedQuoteId !== null; // Must have selected a specific quote to edit
    }
    
    return false;
  };

  const isNextButtonDisabled = () => {
    if (currentStep === 1) {
      return !canProceedFromStep1();
    } else if (currentStep === 2) {
      return !canProceedFromStep2();
    }
    return false;
  };

  const handleStartNew = () => {
    console.log('Starting new quote - resetting all data');
    
    // Create a completely clean client object
    const cleanClient = {
      clientType: "Company" as const,
      companyName: "",
      contactPerson: "",
      firstName: "",
      lastName: "",
      email: "",
      emails: JSON.stringify([""]),
      phone: "",
      countryCode: "+971",
      role: "",
      trn: "",
      hasNoTrn: false,
      address: "",
      city: "",
      area: "",
      state: "Dubai",
      postalCode: "",
      country: "UAE",
      additionalInfo: "",
    };
    
    console.log('Clean client object created:', cleanClient);
    
    // Reset form data completely
    setFormData((prev) => {
      const newFormData = { 
        ...prev, 
        client: cleanClient,
        // Reset to default product for new quotes
        products: [
          {
            productName: "Business Card",
            quantity: 1000,
            sides: "1" as const,
            printingSelection: "Digital" as const,
            flatSize: { width: 9, height: 5.5, spine: null },
            closeSize: { width: 9, height: 5.5, spine: null },
            useSameAsFlat: false,
            papers: [{ name: "Art Paper", gsm: "300" }],
            finishing: ["UV Spot", "Lamination"],
            paperName: "Book",
          },
        ]
      };
      
      console.log('New form data set:', newFormData);
      return newFormData;
    });
    
    // Reset all customer-related state
    setQuoteMode("new");
    setSelectedQuoteId(null);
    setSelectedCustomer(null);
    setCurrentStep(2);
    
    console.log('New quote started with clean data');
  };

  const handleSelectQuote = (q: PreviousQuote) => {
    const detail = QUOTE_DETAILS[q.id];
    if (!detail) return;
    setFormData((prev) => detailToForm(detail, prev));
    setQuoteMode("existing");
    setSelectedQuoteId(q.id); // Set the selected quote ID for updating
    setCurrentStep(2);
  };

  const handleSelectCustomer = (customer: {
    id?: string; // Add optional ID field for existing customers
    clientType: 'Individual' | 'Company';
    companyName: string;
    contactPerson: string;
    email: string;
    phone: string;
    countryCode: string;
    role: string;
    address?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
    additionalInfo?: string;
  }) => {
    setSelectedCustomer(customer);
    setFormData((prev) => ({
      ...prev,
      client: {
        clientType: customer.clientType as 'Individual' | 'Company',
        companyName: customer.companyName || '',
        contactPerson: customer.contactPerson,
        email: customer.email,
        phone: customer.phone,
        countryCode: customer.countryCode,
        role: customer.role || '',
        address: customer.address || '',
        city: customer.city || '',
        state: customer.state || '',
        postalCode: customer.postalCode || '',
        country: customer.country || '',
        additionalInfo: customer.additionalInfo || '',
      }
    }));
  };

  const handleEditCustomer = (customer: {
    clientType: 'Individual' | 'Company';
    companyName: string;
    contactPerson: string;
    email: string;
    phone: string;
    countryCode: string;
    role: string;
    address?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
    additionalInfo?: string;
  }) => {
    // Handle editing customer - for now just select it
    handleSelectCustomer(customer);
  };

  const handleCustomerSelect = async (customer: {
    id: string;
    clientType?: string;
    companyName?: string;
    contactPerson: string;
    email: string;
    phone?: string;
    countryCode?: string;
    role?: string;
    address?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
    additionalInfo?: string;
  }) => {
    setSelectedCustomer({
      id: customer.id,
      clientType: (customer.clientType || 'Individual') as 'Individual' | 'Company',
      companyName: customer.companyName || null,
      contactPerson: customer.contactPerson,
      email: customer.email,
      phone: customer.phone || '',
      countryCode: customer.countryCode || '',
      role: customer.role || null,
      address: customer.address || '',
      city: customer.city || '',
      state: customer.state || '',
      postalCode: customer.postalCode || '',
      country: customer.country || '',
      additionalInfo: customer.additionalInfo || '',
    });
    // Ensure phone has a value - if empty, use a default
    const phoneValue = customer.phone && customer.phone.trim() !== '' ? customer.phone : '0000000000';
    
    console.log('=== AUTO-FILLING CLIENT DATA ===');
    console.log('Customer data received:', customer);
    console.log('Phone value:', phoneValue);
    console.log('Email value:', customer.email);
    
    setFormData((prev) => ({
      ...prev,
      client: {
        clientType: (customer.clientType || 'Individual') as 'Individual' | 'Company',
        companyName: customer.companyName || '',
        contactPerson: customer.contactPerson,
        email: customer.email,
        phone: phoneValue,
        countryCode: customer.countryCode || '+971',
        role: customer.role || '',
        address: customer.address || '',
        city: customer.city || '',
        state: customer.state || '',
        postalCode: customer.postalCode || '',
        country: customer.country || '',
        additionalInfo: customer.additionalInfo || '',
      }
    }));
    
    console.log('Form data updated with client info');

    // Auto-fill Step 3 data if customer has previous quotes
    try {
      // Use the dedicated autofill endpoint that includes all related data
      const quotesResponse = await fetch(`/api/quotes/autofill/${customer.id}`);
      if (!quotesResponse.ok) {
        throw new Error('Failed to fetch quotes for autofill');
      }
      
      const clientQuotes = await quotesResponse.json();
      
      if (clientQuotes.length > 0) {
        // Group quotes by quoteId to get quote groups (a quote can have multiple products)
        const quoteGroups = clientQuotes.reduce((groups: any, quote: any) => {
          if (!groups[quote.quoteId]) {
            groups[quote.quoteId] = [];
          }
          groups[quote.quoteId].push(quote);
          return groups;
        }, {});
        
        // Get the most recent quote group (by date)
        const latestQuoteId = Object.keys(quoteGroups).sort((a, b) => {
          const dateA = new Date(quoteGroups[a][0].date);
          const dateB = new Date(quoteGroups[b][0].date);
          return dateB.getTime() - dateA.getTime();
        })[0];
        
        const latestQuotes = quoteGroups[latestQuoteId];
        
        console.log('Latest quotes for autofill:', latestQuotes);
        
        // Convert database quotes to products - consolidate all papers into one product
        // Since all quotes in latestQuotes have the same quoteId, they represent one product with multiple papers
        const firstQuote = latestQuotes[0];
        
        // Parse colors if they exist
        let colors: { front?: string; back?: string } | undefined;
        if (firstQuote.colors) {
          try {
            colors = JSON.parse(firstQuote.colors);
          } catch (e) {
            console.warn('Failed to parse colors JSON:', firstQuote.colors);
          }
        }
        
        // Collect all papers from all quotes in this group
        let allPapers: any[] = [];
        latestQuotes.forEach((quote: any) => {
          if (quote.papers && Array.isArray(quote.papers) && quote.papers.length > 0) {
            quote.papers.forEach((p: any) => {
              // Try to find the best matching paper name from the database
              let paperName = p.name || 'Standard Paper';
              let paperGsm = p.gsm || '150';
              
              // Ensure we never have empty strings
              if (!paperName || paperName.trim() === '') {
                paperName = 'Standard Paper';
              }
              if (!paperGsm || paperGsm.trim() === '') {
                paperGsm = '150';
              }
              
              console.log(`Processing paper: ${paperName} with GSM: ${paperGsm}`);
              
              // Store the clean paper name without any suffixes for better matching
              const cleanPaperName = paperName.replace(/\s*\(Custom\)$/, '').trim();
              
              // Check if this paper is already added (avoid duplicates)
              const existingPaper = allPapers.find(ap => ap.name === cleanPaperName && ap.gsm === paperGsm);
              if (!existingPaper) {
                allPapers.push({
                  name: cleanPaperName,
                  gsm: paperGsm
                });
              }
            });
          }
        });
        
        // If no papers found, use default
        if (allPapers.length === 0) {
          allPapers = [{ name: 'Standard Paper', gsm: '150' }];
        }
        
        console.log('Final consolidated papers array:', allPapers);
        console.log('Paper names being stored:', allPapers.map(p => p.name));
        
        // Collect all finishing from all quotes in this group
        let allFinishing: string[] = [];
        latestQuotes.forEach((quote: any) => {
          if (quote.finishing && Array.isArray(quote.finishing) && quote.finishing.length > 0) {
            quote.finishing.forEach((f: any) => {
              const finishingName = f.name || f;
              if (finishingName && !allFinishing.includes(finishingName)) {
                allFinishing.push(finishingName);
              }
            });
          }
        });
        
        console.log(`Processing quote group ${latestQuoteId}:`, {
          totalQuotes: latestQuotes.length,
          papers: allPapers,
          finishing: allFinishing
        });
        
        // Create one product with all papers and finishing
        const product = {
          productName: firstQuote.productName || firstQuote.product || 'Business Card',
          quantity: firstQuote.quantity,
          sides: (firstQuote.sides === '1' || firstQuote.sides === '2' ? firstQuote.sides : '1') as '1' | '2',
          printingSelection: firstQuote.printingSelection || firstQuote.printing || 'Digital',
          flatSize: {
            width: firstQuote.flatSizeWidth || 0,
            height: firstQuote.flatSizeHeight || 0,
            spine: firstQuote.flatSizeSpine || null,
          },
          closeSize: {
            width: firstQuote.closeSizeWidth || 0,
            height: firstQuote.closeSizeHeight || 0,
            spine: firstQuote.closeSizeSpine || null,
          },
          useSameAsFlat: firstQuote.useSameAsFlat || false,
          papers: allPapers,
          finishing: allFinishing,
          colors,
        };
        
        const products = [{
          ...product,
          paperName: product.papers && product.papers.length > 0 ? product.papers[0].name : "Standard Paper"
        }];
        
        // Update form data with all products
        setFormData(prev => {
          const newFormData = {
            ...prev,
            products
          };
          console.log('Updating form data with autofilled products:', newFormData);
          return newFormData;
        });
        
        console.log(`Auto-filled ${products.length} products from customer's previous quote:`, products);
        
        // Force a re-render by updating a timestamp
        setFormData(prev => ({
          ...prev,
          products: [...products] // Create new array reference
        }));
      }
    } catch (error) {
      console.error('Error auto-filling quote data:', error);
    }
  };

  // Function to map saved color descriptions to dropdown options
  const mapColorToDropdownOption = (colorDesc: string): string => {
    if (!colorDesc) return "";
    
    const desc = colorDesc.toLowerCase();
    
    // Map specific color descriptions to dropdown options
    if (desc.includes("4/4 cmyk") && desc.includes("2 pms")) {
      return "4+2 Colors";
    } else if (desc.includes("4/4 cmyk") && desc.includes("1 pms")) {
      return "4+1 Colors";
    } else if (desc.includes("4/4 cmyk") || desc.includes("4/4")) {
      return "4 Colors (CMYK)";
    } else if (desc.includes("4/0 cmyk") && desc.includes("2 pms")) {
      return "4+2 Colors";
    } else if (desc.includes("4/0 cmyk") && desc.includes("1 pms")) {
      return "4+1 Colors";
    } else if (desc.includes("4/0 cmyk") || desc.includes("4/0")) {
      return "4 Colors (CMYK)";
    } else if (desc.includes("3 colors") || desc.includes("3")) {
      return "3 Colors";
    } else if (desc.includes("2 colors") || desc.includes("2")) {
      return "2 Colors";
    } else if (desc.includes("1 color") || desc.includes("1")) {
      return "1 Color";
    }
    
    // Default fallback
    return "4 Colors (CMYK)";
  };

  // Handle quote selection for editing existing quotes
  const handleQuoteSelect = (quote: any) => {
    console.log('Quote selected for editing:', quote);
    
    // Set the selected quote ID for editing
    setSelectedQuoteId(quote.id);
    
    // Also set the customer data
    handleCustomerSelect(quote.client);
    
    // Update form data with the quote's complete product information
    if (quote.product) {
      // Determine appropriate sizes based on product type
      let defaultFlatSize = { width: 9, height: 5.5, spine: 0 };
      let defaultCloseSize = { width: 9, height: 5.5, spine: 0 };
      
      // Set appropriate default sizes for different product types
      switch (quote.product.toLowerCase()) {
        case 'book':
        case 'catalog':
        case 'annual report':
        case 'technical manual':
          defaultFlatSize = { width: 8.5, height: 11, spine: 0.5 };
          defaultCloseSize = { width: 8.5, height: 11, spine: 0.5 };
          break;
        case 'brochure':
        case 'flyer a5':
          defaultFlatSize = { width: 8.27, height: 11.69, spine: 0 };
          defaultCloseSize = { width: 4.13, height: 11.69, spine: 0 };
          break;
        case 'poster':
          defaultFlatSize = { width: 18, height: 24, spine: 0 };
          defaultCloseSize = { width: 18, height: 24, spine: 0 };
          break;
        case 'business card':
        case 'business cards':
          defaultFlatSize = { width: 3.5, height: 2, spine: 0 };
          defaultCloseSize = { width: 3.5, height: 2, spine: 0 };
          break;
        case 'letterhead':
          defaultFlatSize = { width: 8.5, height: 11, spine: 0 };
          defaultCloseSize = { width: 8.5, height: 11, spine: 0 };
          break;
        default:
          defaultFlatSize = { width: 9, height: 5.5, spine: 0 };
          defaultCloseSize = { width: 9, height: 5.5, spine: 0 };
      }
      
      // Map saved colors to dropdown options
      const mappedFrontColor = mapColorToDropdownOption(quote.colors?.front);
      const mappedBackColor = mapColorToDropdownOption(quote.colors?.back);
      
      setFormData(prev => ({
        ...prev,
        products: [{
          productName: quote.product || "Printing Product",
          paperName: quote.papers && quote.papers.length > 0 ? quote.papers[0].name : "Standard Paper",
          quantity: quote.quantity || 100,
          sides: (quote.sides as "1" | "2") || "1",
          printingSelection: (quote.printing as "Digital" | "Offset" | "Either" | "Both") || "Digital",
          flatSize: defaultFlatSize,
          closeSize: defaultCloseSize,
          useSameAsFlat: true,
          papers: quote.papers && quote.papers.length > 0 
            ? quote.papers.map((p: any) => ({ name: p.name, gsm: p.gsm }))
            : [{ name: "Standard Paper", gsm: "150" }],
          finishing: quote.finishing && quote.finishing.length > 0
            ? quote.finishing.map((f: any) => f.name)
            : [],
          colors: { 
            front: mappedFrontColor, 
            back: mappedBackColor 
          }
        }]
      }));
      
      console.log('Form data updated with selected quote:', {
        product: quote.product,
        quantity: quote.quantity,
        sides: quote.sides,
        printing: quote.printing,
        papers: quote.papers,
        finishing: quote.finishing,
        colors: { front: mappedFrontColor, back: mappedBackColor }
      });
    }
  };

  // Get current user ID - use a valid user from the database
  const getCurrentUserId = async () => {
    try {
      // Try to get the first available user from the database
      const response = await fetch('/api/users');
      if (response.ok) {
        const users = await response.json();
        if (users.length > 0) {
          // Use the first available user (usually admin)
          return users[0].id;
        }
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
    
    // Fallback to a valid user ID if API fails
    return 'cmekd5dtw0000x5kp7xvqz8w9'; // admin@example.com
  };

  // Validate form data before allowing save
  const validateFormData = () => {
    const errors: string[] = [];

    // Debug: Log the current form data
    console.log('Validating form data:', {
      client: formData.client,
      contactPerson: formData.client.contactPerson,
      firstName: formData.client.firstName,
      lastName: formData.client.lastName,
      email: formData.client.email,
      phone: formData.client.phone
    });

    // Check if client information is complete
    if (!formData.client.email || !formData.client.phone) {
      errors.push("Client email and phone are required");
    }

    if (formData.client.clientType === "Company" && !formData.client.companyName) {
      errors.push("Company name is required for company clients");
    }

    // Check if we have either contactPerson OR both firstName and lastName
    const hasContactPerson = formData.client.contactPerson && formData.client.contactPerson.trim() !== '';
    const hasFullName = formData.client.firstName && formData.client.firstName.trim() !== '' && 
                       formData.client.lastName && formData.client.lastName.trim() !== '';
    
    if (!hasContactPerson && !hasFullName) {
      errors.push("Contact person name is required (or first name and last name)");
    }

    // Address fields are optional but if provided, should be complete
    const hasPartialAddress = formData.client.address || formData.client.city || formData.client.state || formData.client.postalCode || formData.client.country;
    const hasCompleteAddress = formData.client.address && formData.client.city && formData.client.state && formData.client.postalCode && formData.client.country;
    
    if (hasPartialAddress && !hasCompleteAddress) {
      console.warn('Partial address provided - some address fields are missing');
      // Don't throw error, just warn - address is optional
    }

    // Check if products exist and have required information
    if (formData.products.length === 0) {
      errors.push("At least one product must be added");
    }

    formData.products.forEach((product, index) => {
      if (!product.productName || !product.quantity) {
        errors.push(`Product ${index + 1} must have a name and quantity`);
      }
    });

    if (errors.length > 0) {
      alert(`Please fix the following issues:\n${errors.join('\n')}`);
      return false;
    }

    return true;
  };

  // Validate and clean quote data before sending to database
  const validateAndCleanQuoteData = (data: any) => {
    // Create a clean copy of the data to avoid mutating the original
    const cleanedData = { ...data };
    
    // Ensure papers array has valid objects
    if (cleanedData.papers && Array.isArray(cleanedData.papers)) {
      cleanedData.papers = cleanedData.papers.map((paper: any) => ({
        name: paper.name || "Standard Paper",
        gsm: paper.gsm || "150",
        inputWidth: paper.inputWidth || null,
        inputHeight: paper.inputHeight || null,
        pricePerPacket: paper.pricePerPacket || null,
        pricePerSheet: paper.pricePerSheet || null,
        sheetsPerPacket: paper.sheetsPerPacket || null,
        recommendedSheets: paper.recommendedSheets || null,
        enteredSheets: paper.enteredSheets || null,
        outputWidth: paper.outputWidth || null,
        outputHeight: paper.outputHeight || null,
        selectedColors: paper.selectedColors || null,
      }));
    }

    // Ensure finishing array has valid objects
    if (cleanedData.finishing && Array.isArray(cleanedData.finishing)) {
      cleanedData.finishing = cleanedData.finishing.map((finish: any) => ({
        name: finish.name || "Standard Finishing",
        cost: finish.cost || 0,
      }));
    }

    // Ensure amounts object has valid numbers
    if (cleanedData.amounts) {
      cleanedData.amounts = {
        base: Number(cleanedData.amounts.base) || 0,
        vat: Number(cleanedData.amounts.vat) || 0,
        total: Number(cleanedData.amounts.total) || 0,
      };
    }

    // Ensure operational data has valid values
    if (cleanedData.operational) {
      cleanedData.operational = {
        plates: cleanedData.operational.plates ? Number(cleanedData.operational.plates) : null,
        units: cleanedData.operational.units ? Number(cleanedData.operational.units) : null,
      };
    }

    // Ensure essential fields are preserved and valid
    if (cleanedData.date) {
      cleanedData.date = new Date(cleanedData.date);
    }
    
    if (cleanedData.status) {
      cleanedData.status = String(cleanedData.status);
    }
    
    if (cleanedData.clientId) {
      cleanedData.clientId = String(cleanedData.clientId);
    }
    
    if (cleanedData.userId) {
      cleanedData.userId = String(cleanedData.userId);
    }
    
    if (cleanedData.salesPersonId) {
      cleanedData.salesPersonId = String(cleanedData.salesPersonId);
    }
    
    if (cleanedData.product) {
      cleanedData.product = String(cleanedData.product);
    }
    
    if (cleanedData.quantity) {
      cleanedData.quantity = Number(cleanedData.quantity) || 0;
    }
    
    if (cleanedData.sides) {
      cleanedData.sides = String(cleanedData.sides);
    }
    
    if (cleanedData.printing) {
      cleanedData.printing = String(cleanedData.printing);
    }
    
    if (cleanedData.quoteId) {
      cleanedData.quoteId = String(cleanedData.quoteId);
    }

    return cleanedData;
  };

  const handleSaveQuote = async (isUpdate: boolean = false) => {
    setIsSaving(true);
    try {
      // Debug: Log the current form data before processing
      console.log('=== QUOTE CREATION DEBUG ===');
      console.log('Current formData.client:', formData.client);
      console.log('Current selectedCustomer:', selectedCustomer);
      console.log('Current quoteMode:', quoteMode);
      console.log('Current selectedQuoteId:', selectedQuoteId);
      
      // Force synchronize form data - ensure all fields are properly set
      let needsFormUpdate = false;
      const updatedClient = { ...formData.client };
      
      // Ensure all required fields have at least empty strings instead of undefined
      if (updatedClient.email === undefined) {
        updatedClient.email = '';
        needsFormUpdate = true;
      }
      if (updatedClient.phone === undefined) {
        updatedClient.phone = '';
        needsFormUpdate = true;
      }
      if (updatedClient.contactPerson === undefined) {
        updatedClient.contactPerson = '';
        needsFormUpdate = true;
      }
      if (updatedClient.address === undefined) {
        updatedClient.address = '';
        needsFormUpdate = true;
      }
      if (updatedClient.city === undefined) {
        updatedClient.city = '';
        needsFormUpdate = true;
      }
      if (updatedClient.state === undefined) {
        updatedClient.state = '';
        needsFormUpdate = true;
      }
      if (updatedClient.postalCode === undefined) {
        updatedClient.postalCode = '';
        needsFormUpdate = true;
      }
      if (updatedClient.country === undefined) {
        updatedClient.country = '';
        needsFormUpdate = true;
      }
      
      // Ensure contactPerson is set if firstName and lastName are available
      if (!updatedClient.contactPerson && (updatedClient.firstName || updatedClient.lastName)) {
        const contactPerson = `${updatedClient.firstName || ''} ${updatedClient.lastName || ''}`.trim();
        updatedClient.contactPerson = contactPerson;
        needsFormUpdate = true;
        console.log('Auto-setting contactPerson:', contactPerson);
      }
      
      // Update form data if needed
      if (needsFormUpdate) {
        setFormData(prev => ({
          ...prev,
          client: updatedClient
        }));
        console.log('Updated form data with synchronized client info:', updatedClient);
      }
      
      // Use the updated client data for validation
      // If we have a selectedCustomer (existing customer), use that data for validation
      let clientToValidate = needsFormUpdate ? updatedClient : formData.client;
      
      // If using existing customer mode and we have selectedCustomer data, use that for validation
      if (quoteMode === "existing" && selectedCustomer) {
        console.log('=== SELECTED CUSTOMER DEBUG ===');
        console.log('selectedCustomer object:', selectedCustomer);
        console.log('selectedCustomer.email:', selectedCustomer.email);
        console.log('selectedCustomer.phone:', selectedCustomer.phone);
        console.log('selectedCustomer.contactPerson:', selectedCustomer.contactPerson);
        
        // For existing customers, use the selectedCustomer data directly for validation
        clientToValidate = {
          ...clientToValidate,
          email: selectedCustomer.email,
          phone: selectedCustomer.phone || '',
          contactPerson: selectedCustomer.contactPerson,
          clientType: selectedCustomer.clientType,
          companyName: selectedCustomer.companyName || '',
          role: selectedCustomer.role || '',
          address: selectedCustomer.address || '',
          city: selectedCustomer.city || '',
          state: selectedCustomer.state || '',
          postalCode: selectedCustomer.postalCode || '',
          country: selectedCustomer.country || '',
          countryCode: selectedCustomer.countryCode || '+971'
        };
        console.log('Using selectedCustomer data for validation:', clientToValidate);
      }
      
      // Debug: Log the client data being validated
      console.log('=== CLIENT VALIDATION DEBUG ===');
      console.log('Client data being validated:', clientToValidate);
      console.log('Email:', clientToValidate.email);
      console.log('Phone:', clientToValidate.phone);
      console.log('Contact Person:', clientToValidate.contactPerson);
      console.log('Address:', clientToValidate.address);
      console.log('City:', clientToValidate.city);
      console.log('State:', clientToValidate.state);
      console.log('Postal Code:', clientToValidate.postalCode);
      console.log('Country:', clientToValidate.country);
      
      // Validate essential fields only
      // Skip validation for existing customers since we know the data is valid
      if (quoteMode === "existing" && selectedCustomer) {
        console.log('Skipping validation for existing customer - data is pre-validated');
      } else if (!clientToValidate.email || !clientToValidate.phone) {
        console.error('Missing essential client fields:', {
          email: clientToValidate.email,
          phone: clientToValidate.phone
        });
        throw new Error('Missing required client information: email and phone are required');
      }
      
      // Check if we have either contactPerson OR both firstName and lastName
      const hasContactPerson = clientToValidate.contactPerson && clientToValidate.contactPerson.trim() !== '';
      const hasFullName = clientToValidate.firstName && clientToValidate.firstName.trim() !== '' && 
                         clientToValidate.lastName && clientToValidate.lastName.trim() !== '';
      
      if (!hasContactPerson && !hasFullName) {
        console.error('Missing name information:', {
          contactPerson: clientToValidate.contactPerson,
          firstName: clientToValidate.firstName,
          lastName: clientToValidate.lastName
        });
        throw new Error('Contact person name is required (or first name and last name)');
      }
      
      // Ensure contactPerson is set if we have firstName and lastName
      if (!hasContactPerson && hasFullName) {
        clientToValidate.contactPerson = `${clientToValidate.firstName} ${clientToValidate.lastName}`.trim();
        console.log('Auto-generated contactPerson from firstName and lastName:', clientToValidate.contactPerson);
      }
      
      // Company validation only if company type
      if (clientToValidate.clientType === "Company" && !clientToValidate.companyName) {
        throw new Error('Company name is required for company clients');
      }
      
      // Address fields are optional but if provided, should be complete
      const hasPartialAddress = clientToValidate.address || clientToValidate.city || clientToValidate.state || clientToValidate.postalCode || clientToValidate.country;
      const hasCompleteAddress = clientToValidate.address && clientToValidate.city && clientToValidate.state && clientToValidate.postalCode && clientToValidate.country;
      
      if (hasPartialAddress && !hasCompleteAddress) {
        console.warn('Partial address provided - some address fields are missing');
        // Don't throw error, just warn - address is optional
      }
      
      // First, save the client if it's a new client
      let clientId = selectedCustomer?.id;
      
      // If no selectedCustomer ID, we need to create a new client from form data
      if (!clientId) {
        // Create new client - Fix the data mapping
        const clientData = {
          clientType: clientToValidate.clientType,
          companyName: clientToValidate.clientType === "Company" ? clientToValidate.companyName : null,
          contactPerson: clientToValidate.contactPerson || `${clientToValidate.firstName || ''} ${clientToValidate.lastName || ''}`.trim(),
          email: clientToValidate.email,
          phone: clientToValidate.phone,
          countryCode: clientToValidate.countryCode,
          role: clientToValidate.clientType === "Company" ? clientToValidate.role : null,
          address: clientToValidate.address || '',
          city: clientToValidate.city || '',
          state: clientToValidate.state || '',
          postalCode: clientToValidate.postalCode || '',
          country: clientToValidate.country || '',
          additionalInfo: clientToValidate.additionalInfo || '',
        };

        console.log('Creating new client with data:', clientData);

        const clientResponse = await fetch('/api/clients', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(clientData),
        });

        if (!clientResponse.ok) {
          const errorText = await clientResponse.text();
          console.error('Client creation failed:', clientResponse.status, errorText);
          throw new Error(`Failed to create client: ${clientResponse.status} - ${errorText}`);
        }

        const newClient = await clientResponse.json();
        clientId = newClient.id;
        
        // Update the selectedCustomer state with the newly created client
        const newCustomerData = {
          id: newClient.id,
          clientType: newClient.clientType,
          companyName: newClient.companyName,
          contactPerson: newClient.contactPerson,
          email: newClient.email,
          phone: newClient.phone,
          countryCode: newClient.countryCode,
          role: newClient.role,
          address: newClient.address,
          city: newClient.city,
          state: newClient.state,
          postalCode: newClient.postalCode,
          country: newClient.country,
          additionalInfo: newClient.additionalInfo,
          firstName: formData.client.firstName || '',
          lastName: formData.client.lastName || '',
        };
        
        setSelectedCustomer(newCustomerData);
        console.log('Updated selectedCustomer with new client:', newCustomerData);
        
        // Also update the form data with the new customer information to ensure Step 5 displays correctly
        setFormData(prev => ({
          ...prev,
          client: {
            ...prev.client,
            // Update with the new customer data to ensure consistency
            contactPerson: newCustomerData.contactPerson,
            email: newCustomerData.email,
            phone: newCustomerData.phone,
            address: newCustomerData.address,
            city: newCustomerData.city,
            state: newCustomerData.state,
            postalCode: newCustomerData.postalCode,
            country: newCustomerData.country,
            additionalInfo: newCustomerData.additionalInfo,
            // Also ensure firstName and lastName are set if they exist
            firstName: newCustomerData.firstName || prev.client.firstName || '',
            lastName: newCustomerData.lastName || prev.client.lastName || '',
          }
        }));
        
        console.log('Updated form data with new customer information for Step 5 display');
        
        // Log the final state for debugging
        console.log('=== FINAL STATE AFTER CLIENT CREATION ===');
        console.log('New client ID:', clientId);
        console.log('Updated selectedCustomer:', newCustomerData);
        console.log('Updated formData.client:', formData.client);
        
        console.log('Client created successfully:', newClient);
      }

      // Get current user ID
      const currentUserId = await getCurrentUserId();

      // Debug: Log the customer information being used
      console.log('Creating quote with customer info:', {
        clientId,
        selectedCustomer,
        formDataClient: formData.client,
        newCustomerData: clientId ? 'Using existing customer' : 'Created new customer'
      });

      // Prepare quote data for API - Fix the data structure to match DatabaseService expectations
      const quoteData = {
        date: new Date(),
        status: "Pending",
        clientId: clientId,
        userId: currentUserId,
        salesPersonId: formData.salesPersonId, // Add salesPersonId from form data
        product: formData.products[0]?.productName || "Printing Product",
        quantity: formData.products[0]?.quantity || 0,
        sides: formData.products[0]?.sides || "1",
        printing: formData.products[0]?.printingSelection || "Digital",
      };

              // Debug: Log the quote data being sent
        console.log('=== QUOTE DATA DEBUG ===');
        console.log('Quote data being sent:', quoteData);
        console.log('salesPersonId:', formData.salesPersonId);
        console.log('Customer ID being used:', clientId);
        console.log('Selected customer state:', selectedCustomer);
        console.log('formData.operational.papers:', formData.operational.papers);
        console.log('formData.operational.finishing:', formData.operational.finishing);

      let quoteResponse;
      let savedQuote;

      // Check if we're actually editing an existing quote (has selectedQuoteId)
      if (selectedQuoteId && isUpdate) {
        // Update existing quote - we have a specific quote ID to edit
        console.log('Updating existing quote:', selectedQuoteId);
        console.log('=== QUOTE DATA DEBUG (UPDATE) ===');
        console.log('Quote data being sent:', quoteData);
        console.log('salesPersonId:', formData.salesPersonId);
        
        // For updates, we can include additional data like papers, finishing, amounts
        const updateData = {
          ...quoteData,
          salesPersonId: formData.salesPersonId, // Ensure salesPersonId is included in updates
          colors: formData.products[0]?.colors || null, // Include colors field
          papers: formData.operational.papers.map((operationalPaper, index) => {
            // Get the corresponding paper name and gsm from product papers
            const productPaper = formData.products[0]?.papers[index] || { name: "Standard Paper", gsm: "150" };
            return {
              name: productPaper.name || "Standard Paper",
              gsm: productPaper.gsm || "150",
              inputWidth: operationalPaper.inputWidth || null,
              inputHeight: operationalPaper.inputHeight || null,
              pricePerPacket: operationalPaper.pricePerPacket || null,
              pricePerSheet: operationalPaper.pricePerSheet || null,
              sheetsPerPacket: operationalPaper.sheetsPerPacket || null,
              recommendedSheets: operationalPaper.recommendedSheets || null,
              enteredSheets: operationalPaper.enteredSheets || null,
              outputWidth: operationalPaper.outputWidth || null,
              outputHeight: operationalPaper.outputHeight || null,
              selectedColors: operationalPaper.selectedColors || null,
            };
          }) || [],
          finishing: formData.operational.finishing.map(finish => ({
            name: finish.name || "Standard Finishing",
            cost: finish.cost || 0,
          })) || [],
          amounts: {
            base: formData.calculation.basePrice || 0,
            vat: formData.calculation.vatAmount || 0,
            total: formData.calculation.totalPrice || 0
          },
          QuoteOperational: {
            plates: formData.operational.plates || null,
            units: formData.operational.units || null
          }
        };
        
        // Validate and clean the update data before sending
        const cleanedUpdateData = validateAndCleanQuoteData(updateData);
        
        console.log('Quote data being sent for update:', cleanedUpdateData);
        
        quoteResponse = await fetch(`/api/quotes/${selectedQuoteId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(cleanedUpdateData),
        });

        if (!quoteResponse.ok) {
          const errorText = await quoteResponse.text();
          console.error('Quote update failed:', quoteResponse.status, errorText);
          throw new Error(`Failed to update quote: ${quoteResponse.status} - ${errorText}`);
        }

        savedQuote = await quoteResponse.json();
        console.log('Quote updated successfully:', savedQuote);
        
        // Show success message for update
        alert('Quote updated successfully!');
        return;
      } else {
        // Create new quote - even if using existing customer, this is a new quote
        console.log('Creating new quote with complete details');
        console.log('=== COMPLETE QUOTE DATA DEBUG ===');
        console.log('formData.salesPersonId:', formData.salesPersonId);
        console.log('formData.operational.papers:', formData.operational.papers);
        console.log('formData.operational.finishing:', formData.operational.finishing);
        
        // Generate a unique quote ID in proper format: QT-YYYY-MMDD-XXX
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const randomNum = String(Math.floor(Math.random() * 1000)).padStart(3, '0');
        const quoteId = `QT-${year}-${month}${day}-${randomNum}`;
        
        // Prepare complete quote data with all details
        const completeQuoteData = {
          ...quoteData,
          quoteId: quoteId,
          salesPersonId: formData.salesPersonId, // Explicitly include salesPersonId
          colors: formData.products[0]?.colors || null, // Include colors field
          papers: formData.operational.papers.map((operationalPaper, index) => {
            // Get the corresponding paper name and gsm from product papers
            const productPaper = formData.products[0]?.papers[index] || { name: "Standard Paper", gsm: "150" };
            return {
              name: productPaper.name || "Standard Paper",
              gsm: productPaper.gsm || "150",
              inputWidth: operationalPaper.inputWidth || null,
              inputHeight: operationalPaper.inputHeight || null,
              pricePerPacket: operationalPaper.pricePerPacket || null,
              pricePerSheet: operationalPaper.pricePerSheet || null,
              sheetsPerPacket: operationalPaper.sheetsPerPacket || null,
              recommendedSheets: operationalPaper.recommendedSheets || null,
              enteredSheets: operationalPaper.enteredSheets || null,
              outputWidth: operationalPaper.outputWidth || null,
              outputHeight: operationalPaper.outputHeight || null,
              selectedColors: operationalPaper.selectedColors || null,
            };
          }) || [],
          finishing: formData.operational.finishing.map(finish => ({
            name: finish.name || "Standard Finishing",
            cost: finish.cost || 0,
          })) || [],
          amounts: {
            base: formData.calculation.basePrice || 0,
            vat: formData.calculation.vatAmount || 0,
            total: formData.calculation.totalPrice || 0
          },
          QuoteOperational: {
            plates: formData.operational.plates || null,
            units: formData.operational.units || null
          }
        };
        
        // Validate and clean the data before sending
        const cleanedQuoteData = validateAndCleanQuoteData(completeQuoteData);
        
        console.log('=== FINAL QUOTE DATA DEBUG ===');
        console.log('Original quoteData:', quoteData);
        console.log('Complete quote data before cleaning:', completeQuoteData);
        console.log('Cleaned quote data being sent:', cleanedQuoteData);
        console.log('salesPersonId in cleaned data:', cleanedQuoteData.salesPersonId);
        
        quoteResponse = await fetch('/api/quotes', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(cleanedQuoteData),
        });

        if (!quoteResponse.ok) {
          const errorText = await quoteResponse.text();
          console.error('Quote creation failed:', quoteResponse.status, errorText);
          throw new Error(`Failed to create quote: ${quoteResponse.status} - ${errorText}`);
        }

        savedQuote = await quoteResponse.json();
        console.log('Quote created successfully with all details:', savedQuote);
      }

      // Show success modal only for new quotes
      if (!isUpdate) {
        setSaveModalOpen(true);
      }
    } catch (error) {
      console.error('Error saving quote:', error);
      // Use a more user-friendly error message
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      const action = selectedQuoteId && isUpdate ? 'updating' : 'creating';
      alert(`Error ${action} quote: ${errorMessage}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownloadCustomerFromModal = async () => {
    await downloadCustomerPdf(formData, otherQuantities);
    setSaveModalOpen(false);
  };

  const handleDownloadOpsFromModal = async () => {
    await downloadOpsPdf(formData, otherQuantities);
    setSaveModalOpen(false);
  };

  const handleCloseAndGoHome = () => {
    setSaveModalOpen(false);
    router.push("/");
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-8">
            {/* Step 1 Header */}
            <div className="text-center space-y-3">
              <h3 className="text-2xl font-bold text-slate-900">Create A Quote</h3>
              <p className="text-lg text-slate-600">Choose how you&apos;d like to create your printing quote</p>
            </div>

            {/* Quote Mode Selection Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {/* Create New Quote Card */}
              <Card 
                className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer group"
                onClick={handleStartNew}
              >
                <CardContent className="p-8 text-center space-y-6">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto group-hover:scale-110 transition-transform duration-300">
                    <Sparkles className="w-10 h-10 text-white" />
                  </div>
                  <div className="space-y-3">
                    <h3 className="text-2xl font-bold text-slate-900">Create New Quote</h3>
                    <p className="text-slate-600 leading-relaxed">
                      Start a fresh quotation from scratch. Perfect for new projects, custom requirements, or when you need complete control over the quote details.
                    </p>
                  </div>
                  <div className="pt-4">
                    <Button 
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                      onClick={handleStartNew}
                    >
                      <Plus className="w-5 h-5 mr-2" />
                      Start New Quote
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Existing Quote Card */}
              <Card 
                className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer group"
                onClick={() => {
                  // Clear default product data when entering existing quote mode
                  setFormData((prev) => ({ 
                    ...prev, 
                    products: [] // Clear products array - will be populated from selected quote
                  }));
                  setQuoteMode("existing");
                  setSelectedQuoteId(null); // Will be set when a specific quote is selected
                  setCurrentStep(2);
                  setSelectedCustomer(null);
                }}
              >
                <CardContent className="p-8 text-center space-y-6">
                  <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto group-hover:scale-110 transition-transform duration-300">
                    <Copy className="w-10 h-10 text-white" />
                  </div>
                  <div className="space-y-3">
                    <h3 className="text-2xl font-bold text-slate-900">Based on Previous Quote</h3>
                    <p className="text-slate-600 leading-relaxed">
                      Use an existing quote as a template. Save time by modifying previous specifications, pricing, and customer details for similar projects.
                    </p>
                  </div>
                  <div className="pt-4">
                    <Button 
                      className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                      onClick={() => {
                        // Clear default product data when entering existing quote mode
                        setFormData((prev) => ({ 
                          ...prev, 
                          products: [] // Clear products array - will be populated from selected quote
                        }));
                        setQuoteMode("existing");
                        setSelectedQuoteId(null); // Will be set when a specific quote is selected
                        setCurrentStep(2);
                        setSelectedCustomer(null);
                      }}
                    >
                      <FileText className="w-5 h-5 mr-2" />
                      Use Existing Quote
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Additional Info */}
            <div className="text-center text-slate-500 max-w-2xl mx-auto">
              <p className="text-sm">
                Both options will guide you through the same comprehensive quote creation process, 
                ensuring accuracy and consistency in your printing estimates.
              </p>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-6">
            {quoteMode === "new" && (
              <div className="text-center space-y-3">
                <h3 className="text-2xl font-bold text-slate-900">Customer Details</h3>
                <p className="text-slate-600">
                  Fill in the customer information for your new quote
                </p>
              </div>
            )}
            
            {quoteMode === "existing" ? (
              // Use Step2CustomerChoose component for existing quote mode
              <Step2CustomerChoose 
                formData={formData} 
                setFormData={setFormData} 
                onCustomerSelect={handleCustomerSelect}
                onQuoteSelect={handleQuoteSelect} // Pass the new handler
              />
            ) : (
              // Show empty customer detail form for new quote
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <h4 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                  New Customer Details
                </h4>
                <Step2CustomerDetail formData={formData} setFormData={setFormData} />
              </div>
            )}
          </div>
        );
      case 3:
        return (
          <Step3ProductSpec formData={formData} setFormData={setFormData} />
        );
      case 4:
        return (
          <Step4Operational formData={formData} setFormData={setFormData} />
        );
      case 5:
        return (
          <Step5Quotation
            formData={formData}
            setFormData={setFormData}
            otherQuantities={otherQuantities}
            setOtherQuantities={setOtherQuantities}
            onOpenSave={() => {
              // Validate form data before opening save modal
              if (validateFormData()) {
                setSaveModalOpen(true);
              }
            }}
            isEditMode={!!selectedQuoteId}
            selectedQuoteId={selectedQuoteId}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-12">
      {/* Main Content Card */}
      <Card className="border-0 shadow-lg">
        <CardContent className="p-10 space-y-10">
          <StepIndicator
            activeStep={currentStep}
          />
          
          <div className="mt-8">{renderStepContent()}</div>

          {/* Validation Status Indicators */}
          {currentStep === 1 && (
            <div className="mt-6">
              {!canProceedFromStep1() ? (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-5 h-5 rounded-full bg-yellow-500 flex items-center justify-center">
                      <span className="text-white text-xs font-bold">!</span>
                    </div>
                    <p className="text-yellow-700 font-medium">
                      Please select either "Create New Quote" or "Based on Previous Quote" to continue
                    </p>
                  </div>
                </div>
              ) : (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                      <span className="text-white text-xs font-bold">✓</span>
                    </div>
                    <p className="text-green-700 font-medium">
                      {quoteMode === "new" ? "New quote mode selected. You can proceed to the next step." : "Existing quote mode selected. You can proceed to the next step."}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}



          <div className="mt-12 pt-8 border-t border-slate-200 flex justify-between items-center">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 1}
              className="border-slate-300 hover:border-slate-400 hover:bg-slate-50 px-8 py-3 rounded-xl transition-all duration-300"
            >
              Previous
            </Button>
            {currentStep < 5 && (
              <div className="relative">
                <Button
                  onClick={nextStep}
                  disabled={isNextButtonDisabled()}
                  className={`px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 ${
                    isNextButtonDisabled() 
                      ? "bg-gray-400 cursor-not-allowed" 
                      : "bg-blue-600 hover:bg-blue-700 text-white"
                  }`}
                  title={
                    isNextButtonDisabled() 
                      ? currentStep === 1 
                        ? "Please select a quote mode to continue"
                        : currentStep === 2 && quoteMode === "existing"
                        ? "Please select a specific quote to edit"
                        : "Please complete the required information to continue"
                      : "Click to proceed to the next step"
                  }
                >
                  Next
                </Button>
                {isNextButtonDisabled() && (
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-sm rounded-lg shadow-lg whitespace-nowrap z-10">
                    {currentStep === 1 
                      ? "Select a quote mode first"
                      : currentStep === 2 && quoteMode === "existing"
                      ? "Select a specific quote to edit first"
                      : "Complete required fields first"
                    }
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                  </div>
                )}
              </div>
            )}
            
            {currentStep === 5 && (
              <Button
                onClick={() => handleSaveQuote(false)}
                disabled={isSaving}
                className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
              >
                {isSaving ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Submitting...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5 mr-2" />
                    Submit Quote
                  </>
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {saveModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 w-full max-w-md text-center shadow-2xl">
            <h3 className="text-2xl font-bold text-slate-900 mb-3">
              Quote Submitted Successfully!
            </h3>
            <p className="text-slate-600 mb-6">
              Your quote has been submitted and will appear in the Quote Management page.
            </p>
            <div className="space-y-4">
              <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300">
                <Link href={`mailto:${formData.client.email}`}>
                  Send to Customer
                </Link>
              </Button>
              <Button
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                onClick={handleDownloadCustomerFromModal}
              >
                Download for Customer
              </Button>
              <Button
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                onClick={handleDownloadOpsFromModal}
              >
                Download Operations Copy
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setSaveModalOpen(false);
                  router.push("/");
                }}
                className="w-full py-3 rounded-xl border-slate-300 hover:border-slate-400 hover:bg-slate-400 transition-all duration-300"
              >
                Close & Go to Dashboard
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Main component with Suspense boundary
export default function CreateQuotePage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-lg text-slate-600">Loading quote creation...</p>
        </div>
      </div>
    }>
      <CreateQuoteContent />
    </Suspense>
  );
}