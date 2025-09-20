"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Eye, Pencil, Calendar, DollarSign, ChevronDown, ChevronUp, Download, ChevronDown as ChevronDownIcon, User } from "lucide-react";
import { getQuotes } from "@/lib/dummy-data";
import Link from "next/link";
import CreateQuoteModal from "@/components/create-quote/CreateQuoteModal";
import StatusBadge from "@/components/shared/StatusBadge";
import { quotes as QUOTES, users as USERS } from "@/constants";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { downloadCustomerPdf, generateOperationalPDF } from "@/lib/quote-pdf";


type Status = "Approved" | "Pending" | "Rejected";
type StatusFilter = "all" | Status;
type UserFilter = "all" | string;


type Row = (typeof QUOTES)[number] & {
  quoteId?: string;
  productName?: string;
  product?: string; // This field is used in the table display
  quantity?: number;
  // New Step 3 fields
  printingSelection?: string;
  printing?: string; // Keep for backward compatibility
  sides?: string;
  flatSize?: {
    width: number | null;
    height: number | null;
    spine: number | null;
  };
  closeSize?: {
    width: number | null;
    height: number | null;
    spine: number | null;
  };
  useSameAsFlat?: boolean;
  colors?: {
    front?: string;
    back?: string;
  } | null;
  // Papers and finishing for database operations
  papers?: Array<{ name: string; gsm: string }>;
  finishing?: string[];
  // Client relationship tracking
  originalClientId?: string | null;
};

const currency = new Intl.NumberFormat("en-AE", { 
  style: "currency", 
  currency: "AED",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});
const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "2-digit" });

const PAGE_SIZE = 20; // Increased from 7 to 20 as per requirements

export default function QuoteManagementPage() {
  const [rows, setRows] = React.useState<Row[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [showNewQuoteNotification, setShowNewQuoteNotification] = React.useState(false);
  const [newQuoteCount, setNewQuoteCount] = React.useState(0);
  const [downloadingPDF, setDownloadingPDF] = React.useState<string | null>(null);
  const [isCreateQuoteModalOpen, setIsCreateQuoteModalOpen] = React.useState(false);

  // ===== filter & paging =====
  const [search, setSearch] = React.useState("");
  const [from, setFrom] = React.useState<string>("");
  const [to, setTo] = React.useState<string>("");
  const [status, setStatus] = React.useState<StatusFilter>("all");
  const [contactPerson, setContactPerson] = React.useState<UserFilter>("all");
  const [minAmount, setMinAmount] = React.useState<string>("");
  const [page, setPage] = React.useState(1);
  const [showAll, setShowAll] = React.useState(false); // New state for show more option

  React.useEffect(() => setPage(1), [search, from, to, status, contactPerson, minAmount]);

  // Load contact persons for filter dropdown
  const [filterContactPersons, setFilterContactPersons] = React.useState<Array<{id: string, name: string}>>([]);

  React.useEffect(() => {
    const loadContactPersons = async () => {
      try {
        const response = await fetch('/api/clients');
        if (response.ok) {
          const clients = await response.json();
          // Extract unique contact persons
          const contactPersons = clients.reduce((acc: any[], client: any) => {
            if (client.contactPerson && !acc.find(cp => cp.name === client.contactPerson)) {
              acc.push({
                id: client.contactPerson,
                name: client.contactPerson
              });
            }
            return acc;
          }, []);
          setFilterContactPersons(contactPersons);
        }
      } catch (error) {
        console.error('Error loading contact persons for filter:', error);
        // Fallback to extracting from current rows if API fails
        const contactPersons = rows.reduce((acc: any[], row: any) => {
          if (row.contactPerson && !acc.find(cp => cp.name === row.contactPerson)) {
            acc.push({
              id: row.contactPerson,
              name: row.contactPerson
            });
          }
          return acc;
        }, []);
        setFilterContactPersons(contactPersons);
      }
    };

    loadContactPersons();
  }, [rows]);

  // Load quotes from database on page load
  React.useEffect(() => {
    const loadQuotes = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/quotes');
        if (response.ok) {
          const quotes = await response.json();
          console.log('Raw quotes from database:', quotes);
          // Transform database quotes to match Row format
          const transformedQuotes = quotes.map((quote: any) => ({
            id: quote.id, // Use database ID for operations
            quoteId: quote.quoteId || `QT-${new Date(quote.date).getFullYear()}-${String(new Date(quote.date).getMonth() + 1).padStart(2, '0')}-${String(new Date(quote.date).getDate()).padStart(2, '0')}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`, // Generate quote ID if missing
            clientName: quote.client?.companyName || quote.client?.contactPerson || "Unknown Client",
            contactPerson: quote.client?.contactPerson || "Unknown Contact",
            date: quote.date.split('T')[0], // Convert ISO date to YYYY-MM-DD
            amount: quote.amounts?.total || 0,
            status: quote.status as Status,
            userId: quote.user?.id || "cmejqfk3s0000x5a98slufy9n", // Use real admin user ID as fallback
            product: quote.productName || quote.product || (quote.papers && quote.papers.length > 0 ? quote.papers[0].name : "Printing Product"), // Use productName if available
            productName: quote.productName || quote.product || (quote.papers && quote.papers.length > 0 ? quote.papers[0].name : "Printing Product"), // Keep for backward compatibility
            quantity: quote.quantity || 0,
            // New Step 3 fields
            sides: quote.sides || "1", // Map the sides field
            printingSelection: quote.printingSelection || quote.printing || "Digital",
            flatSize: {
              width: quote.flatSizeWidth,
              height: quote.flatSizeHeight,
              spine: quote.flatSizeSpine
            },
            closeSize: {
              width: quote.closeSizeWidth,
              height: quote.closeSizeHeight,
              spine: quote.closeSizeSpine
            },
            useSameAsFlat: quote.useSameAsFlat || false,
            colors: quote.colors ? (typeof quote.colors === 'string' ? JSON.parse(quote.colors) : quote.colors) : null,
            // Papers and finishing for database operations
            papers: quote.papers || [],
            finishing: quote.finishing || [],
            // Client relationship tracking
            originalClientId: quote.clientId || null,
          }));
          console.log('Transformed quotes:', transformedQuotes);
          setRows(transformedQuotes);
        } else {
          console.error('Failed to load quotes');
          // Fallback to dummy data if API fails
          setRows(QUOTES);
        }
      } catch (error) {
        console.error('Error loading quotes:', error);
        // Fallback to dummy data if API fails
        setRows(QUOTES);
      } finally {
        setLoading(false);
      }
    };

    loadQuotes();
  }, []);

  // Note: Quotes are now loaded from the database through the main dashboard
  // This page will be updated to use the database service in future iterations

  const filtered = React.useMemo(() => {
    const filteredQuotes = rows.filter((q) => {
      const s = search.trim().toLowerCase();
      // Enhanced search to include quote number, client name, and person name as per requirements
      const hitSearch =
        s === "" || 
        q.id.toLowerCase().includes(s) || 
        q.clientName.toLowerCase().includes(s) ||
        q.contactPerson.toLowerCase().includes(s);

      const hitStatus = status === "all" || q.status === status;
      const hitContactPerson = contactPerson === "all" || q.contactPerson === contactPerson;
      const hitAmount = minAmount === "" || q.amount >= Number(minAmount);

      const hitFrom = from === "" || q.date >= from;
      const hitTo = to === "" || q.date <= to;

      return hitSearch && hitStatus && hitContactPerson && hitAmount && hitFrom && hitTo;
    });

    // Sort by newest first (most recent date first)
    const sorted = [...filteredQuotes].sort((a, b) => {
      const dateA = new Date(a.date || 0);
      const dateB = new Date(b.date || 0);
      return dateB.getTime() - dateA.getTime(); // Newest first
    });

    return sorted;
  }, [rows, search, from, to, status, contactPerson, minAmount]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const start = (page - 1) * PAGE_SIZE;
  const current = showAll ? filtered : filtered.slice(start, start + PAGE_SIZE);

  const approvedCount = filtered.filter(q => q.status === "Approved").length;
  const pendingCount = filtered.filter(q => q.status === "Pending").length;
  const rejectedCount = filtered.filter(q => q.status === "Rejected").length;


  const [draft, setDraft] = React.useState<{
    id: string;
    clientName: string;
    contactPerson: string;
    date: string;
    amount: number | "";
    status: Status;
    userId: string;
    productName?: string;
    quantity?: number | "";
    // New Step 3 fields
    printingSelection?: string;
    sides?: string;
    flatSize: { width: number | null; height: number | null; spine: number | null };
    closeSize: { width: number | null; height: number | null; spine: number | null };
    useSameAsFlat?: boolean;
    colors?: { front?: string; back?: string } | null;
    // Papers and finishing for database operations
    papers?: Array<{ name: string; gsm: string }>;
    finishing?: string[];
    originalClientId?: string | null; // Added for client relationship tracking
  }>({
    id: "",
    clientName: "",
    contactPerson: "",
    date: "",
    amount: "",
    status: "Approved",
    userId: "cmejqfk3s0000x5a98slufy9n", // Use real admin user ID instead of dummy data
    productName: "",
    quantity: "",
    // Initialize Step 3 fields
    printingSelection: "Digital",
    sides: "1",
    flatSize: { width: null, height: null, spine: null },
    closeSize: { width: null, height: null, spine: null },
    useSameAsFlat: true,
    colors: { front: "", back: "" },
    // Initialize papers and finishing
    papers: [],
    finishing: [],
    originalClientId: null
  });

  const [openEdit, setOpenEdit] = React.useState(false);

  const onEdit = (id: string) => {
    const q = rows.find((r) => r.id === id);
    if (!q) return;
    
    // Get the original quote data from the database to ensure we have all the correct relationships
    const loadQuoteData = async () => {
      try {
        console.log('Loading quote data for editing, quote ID:', id);
        console.log('Current row data:', q);
        
        const response = await fetch(`/api/quotes/${id}`);
        if (response.ok) {
          const quoteData = await response.json();
          console.log('Raw quote data from API:', quoteData);
          
          // Parse colors if it's a string
          let parsedColors = { front: "", back: "" };
          if (quoteData.colors) {
            try {
              if (typeof quoteData.colors === 'string') {
                parsedColors = JSON.parse(quoteData.colors);
              } else {
                parsedColors = quoteData.colors;
              }
            } catch (e) {
              console.warn('Failed to parse colors:', e);
              parsedColors = { front: "", back: "" };
            }
          }
          console.log('Parsed colors:', parsedColors);
          
          // Ensure size fields are properly handled
          const flatSize = {
            width: quoteData.flatSizeWidth || q.flatSize?.width || null,
            height: quoteData.flatSizeHeight || q.flatSize?.height || null,
            spine: quoteData.flatSizeSpine || q.flatSize?.spine || null
          };
          console.log('Flat size data:', flatSize);
          
          const closeSize = {
            width: quoteData.closeSizeWidth || q.closeSize?.width || flatSize.width,
            height: quoteData.closeSizeHeight || q.closeSize?.height || flatSize.height,
            spine: quoteData.closeSizeSpine || q.closeSize?.spine || flatSize.spine
          };
          console.log('Close size data:', closeSize);
          
          // Determine if useSameAsFlat should be true based on whether sizes are the same
          const useSameAsFlat = quoteData.useSameAsFlat !== undefined 
            ? quoteData.useSameAsFlat 
            : (flatSize.width === closeSize.width && 
               flatSize.height === closeSize.height && 
               flatSize.spine === closeSize.spine);
          console.log('Use same as flat:', useSameAsFlat);
          
          const draftData = {
            id: quoteData.id,
            clientName: quoteData.client?.companyName || quoteData.client?.contactPerson || q.clientName,
            contactPerson: quoteData.client?.contactPerson || q.contactPerson,
            date: quoteData.date ? new Date(quoteData.date).toISOString().split('T')[0] : q.date,
            amount: quoteData.amounts?.total || q.amount,
            status: quoteData.status || q.status,
            userId: quoteData.userId || q.userId,
            productName: quoteData.product || quoteData.productName || q.productName || "",
            quantity: quoteData.quantity || q.quantity || "",
            // New Step 3 fields
            printingSelection: quoteData.printingSelection || quoteData.printing || q.printingSelection || "Digital",
            sides: quoteData.sides || q.sides || "1",
            flatSize,
            closeSize,
            useSameAsFlat,
            colors: parsedColors,
            // Papers and finishing for database operations
            papers: quoteData.papers || [],
            finishing: quoteData.finishing || [],
            // Store the original client ID to prevent foreign key issues
            originalClientId: quoteData.clientId
          };
          
          console.log('Setting draft with data:', draftData);
          setDraft(draftData);
        } else {
          // Fallback to row data if API call fails
          console.warn('API call failed, using row data as fallback');
          setDraft({
            id: q.id,
            clientName: q.clientName,
            contactPerson: q.contactPerson,
            date: q.date,
            amount: q.amount,
            status: q.status,
            userId: q.userId,
            productName: q.product ?? q.productName ?? "",
            quantity: typeof q.quantity === "number" ? q.quantity : "",
            // New Step 3 fields
            printingSelection: q.printingSelection || q.printing || "Digital",
            sides: q.sides || "1",
            flatSize: q.flatSize || { width: null, height: null, spine: null },
            closeSize: q.closeSize || { width: null, height: null, spine: null },
            useSameAsFlat: q.useSameAsFlat || false,
            colors: q.colors || { front: "", back: "" },
            // Include papers and finishing from row data
            papers: q.papers || [],
            finishing: q.finishing || [],
            originalClientId: q.originalClientId || null
          });
        }
      } catch (error) {
        console.error('Error loading quote data for editing:', error);
        // Fallback to row data
        setDraft({
          id: q.id,
          clientName: q.clientName,
          contactPerson: q.contactPerson,
          date: q.date,
          amount: q.amount,
          status: q.status,
          userId: q.userId,
          productName: q.product ?? q.productName ?? "",
          quantity: typeof q.quantity === "number" ? q.quantity : "",
          // New Step 3 fields
          printingSelection: q.printingSelection || q.printing || "Digital",
          sides: q.sides || "1",
          flatSize: q.flatSize || { width: null, height: null, spine: null },
          closeSize: q.closeSize || { width: null, height: null, spine: null },
          useSameAsFlat: q.useSameAsFlat || false,
          colors: q.colors || { front: "", back: "" },
          // Include papers and finishing from row data
          papers: q.papers || [],
          finishing: q.finishing || [],
          originalClientId: q.originalClientId || null
        });
      }
    };
    
    loadQuoteData();
    setOpenEdit(true);
  };

  const onSubmitEdit = async () => {
    if (!draft.id || !draft.clientName || !draft.contactPerson || !draft.date || draft.amount === "") {
      alert("Please complete all required fields.");
      return;
    }

    try {
      console.log('Starting quote update for:', draft.id);
      
      // Get the client ID - this should always exist for existing quotes
      let clientId = draft.originalClientId;
      
      if (!clientId) {
        throw new Error('Cannot update quote: Client ID not found. Please refresh the page and try again.');
      }
      
      console.log('Using existing client:', clientId);

      // Update quote in database with correct schema mapping
      const updateData = {
        clientId: clientId,
        date: new Date(draft.date + 'T00:00:00.000Z').toISOString(), // Ensure proper date format
        status: draft.status,
        // Temporarily exclude userId to debug foreign key issue
        // userId: draft.userId || null, // Allow null if no user assigned
        product: draft.productName?.trim() || "Printing Product",
        quantity: draft.quantity === "" ? 0 : Number(draft.quantity),
        sides: draft.sides || "1", // Default to 1 side since not in edit form
        printing: draft.printingSelection || "Digital", // Default to Digital printing since not in edit form
        // New Step 3 fields - map to the correct database schema fields
        printingSelection: draft.printingSelection,
        flatSizeWidth: draft.flatSize?.width || null,
        flatSizeHeight: draft.flatSize?.height || null,
        flatSizeSpine: draft.flatSize?.spine || null,
        closeSizeWidth: draft.closeSize?.width || null,
        closeSizeHeight: draft.closeSize?.height || null,
        closeSizeSpine: draft.closeSize?.spine || null,
        useSameAsFlat: draft.useSameAsFlat,
        colors: draft.colors ? JSON.stringify(draft.colors) : null,
        // Temporarily exclude papers and finishing to debug foreign key issue
        // papers: draft.papers || [],
        // finishing: draft.finishing || [],
        amounts: {
          base: Number(draft.amount) * 0.8, // Calculate base amount (80% of total)
          vat: Number(draft.amount) * 0.2,  // Calculate VAT (20% of total)
          total: Number(draft.amount)        // Total amount from form
        },
      };
      
      console.log('=== QUOTE UPDATE DEBUG ===');
      console.log('Quote ID:', draft.id);
      console.log('Client ID:', clientId);
      console.log('Draft papers:', draft.papers);
      console.log('Draft finishing:', draft.finishing);
      console.log('Draft userId:', draft.userId);
      console.log('Full update data:', JSON.stringify(updateData, null, 2));
      console.log('=== END DEBUG ===');
      
      const response = await fetch(`/api/quotes/${draft.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Quote update failed:', response.status, errorData);
        throw new Error(errorData.error || `HTTP ${response.status}: Failed to update quote`);
      }

      const updatedQuote = await response.json();
      console.log('Quote updated successfully:', updatedQuote);

      // Update local state
      setRows((prev): Row[] =>
        prev.map((r) =>
          r.id === draft.id
            ? {
                ...r,
                clientName: draft.clientName,
                contactPerson: draft.contactPerson,
                date: draft.date,
                amount: Number(draft.amount),
                status: draft.status,
                userId: draft.userId,
                productName: draft.productName?.trim() || r.productName,
                quantity:
                  draft.quantity === "" ? r.quantity : Number(draft.quantity),
                // New Step 3 fields
                printingSelection: draft.printingSelection || r.printingSelection,
                flatSize: draft.flatSize || r.flatSize,
                closeSize: draft.closeSize || r.closeSize,
                useSameAsFlat: draft.useSameAsFlat || r.useSameAsFlat,
                colors: draft.colors || r.colors,
              }
            : r
        )
      );

      setOpenEdit(false);
    } catch (error) {
      console.error('Error updating quote:', error);
      alert(`Error updating quote: ${error instanceof Error ? error.message : 'Please try again.'}`);
    }
  };

  // ===== modal VIEW (Eye) =====
  const [openView, setOpenView] = React.useState(false);
  const [viewRow, setViewRow] = React.useState<Row | null>(null);

  const onView = (row: Row) => {
    setViewRow(row);
    setOpenView(true);
  };

  const viewTotal = (row: Row | null) => (row ? currency.format(row.amount) : "—");

  // Function to handle PDF download for approved quotes
  const handleDownloadPDF = async (quote: Row, type: 'customer' | 'operations') => {
    const downloadId = `${quote.id}-${type}`;
    setDownloadingPDF(downloadId);
    
    try {
      // Create a mock QuoteFormData structure for PDF generation
      const mockFormData = {
        client: {
          clientType: "Company" as const,
          companyName: quote.clientName,
          contactPerson: quote.contactPerson,
          email: "customer@example.com", // Default email
          phone: "123456789", // Default phone
          countryCode: "+971",
          role: "Customer",
          address: "Sheikh Zayed Road, Business Bay",
          city: "Dubai",
          state: "Dubai",
          postalCode: "12345",
          country: "UAE"
        },
        products: [{
          productName: quote.product || quote.productName || "Printing Product",
          paperName: "Premium Paper",
          quantity: quote.quantity || 0,
          sides: "2" as const,
          printingSelection: "Offset" as const,
          flatSize: { width: 21, height: 29.7, spine: 0 },
          closeSize: { width: 21, height: 29.7, spine: 0 },
          useSameAsFlat: true,
          papers: [{ name: "Premium Paper", gsm: "350" }],
          finishing: ['UV Spot', 'Foil Stamping'],
          colors: { front: '4 Colors (CMYK)', back: '2 Colors (CMYK)' }
        }],
        operational: {
          papers: [{
            inputWidth: 21,
            inputHeight: 29.7,
            pricePerPacket: 25.50,
            pricePerSheet: 0.85,
            sheetsPerPacket: 30,
            recommendedSheets: 100,
            enteredSheets: 120,
            outputWidth: 21,
            outputHeight: 29.7,
            selectedColors: ['CMYK', 'Spot Color']
          }],
          finishing: [{
            name: 'UV Spot',
            cost: 0.15
          }, {
            name: 'Foil Stamping',
            cost: 0.25
          }],
          plates: 2,
          units: quote.quantity || 100
        },
        calculation: {
          basePrice: quote.amount,
          marginAmount: 0,
          subtotal: quote.amount,
          vatAmount: 0,
          totalPrice: quote.amount
        }
      };

      if (type === 'customer') {
        await downloadCustomerPdf(mockFormData, []);
      } else {
        // Use the operational PDF for operations team
        const pdfBytes = await generateOperationalPDF(quote.id, mockFormData);
        
        // Create and download PDF
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `operational-job-order-${quote.id}.pdf`;
        link.click();
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error downloading PDF:', error);
      alert('Failed to download PDF. Please try again.');
    } finally {
      setDownloadingPDF(null);
    }
  };

  const handleCreateQuote = (newQuote: any) => {
    // Add the new quote to the existing quotes
    const updatedRows = [...rows, newQuote];
    setRows(updatedRows);
    
    // Show success notification
    setNewQuoteCount(prev => prev + 1);
    setShowNewQuoteNotification(true);
    
    // Hide notification after 3 seconds
    setTimeout(() => {
      setShowNewQuoteNotification(false);
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-600 bg-clip-text text-transparent">
            Quote Management
          </h1>
          <p className="text-slate-600 text-base sm:text-lg max-w-2xl mx-auto">
            Manage and track all your printing quotations. View, edit, and monitor quote statuses.
          </p>
        </div>

        {/* Search and Create Quote */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search by quote number, client name, or person name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full border-slate-300 focus:border-blue-500 focus:ring-blue-500 rounded-xl h-12 text-base"
            />
          </div>
          <Button
            onClick={() => setIsCreateQuoteModalOpen(true)}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-200 h-12 w-full sm:w-auto"
          >
            <Plus className="h-5 w-5 mr-2" />
            Create a New Quote
          </Button>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">From Date</label>
            <Input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="border-slate-300 focus:border-blue-500 focus:ring-blue-500 rounded-xl h-10"
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">To Date</label>
            <Input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="border-slate-300 focus:border-blue-500 focus:ring-blue-500 rounded-xl h-10"
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Status</label>
            <Select value={status} onValueChange={(v: StatusFilter) => setStatus(v)}>
              <SelectTrigger className="border-slate-300 focus:border-blue-500 focus:ring-blue-500 rounded-xl h-10">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Approved">Approved</SelectItem>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="Rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Contact Person</label>
            <Select value={contactPerson} onValueChange={(v: UserFilter) => setContactPerson(v)}>
              <SelectTrigger className="border-slate-300 focus:border-blue-500 focus:ring-blue-500 rounded-xl h-10">
                <SelectValue placeholder="All Contact Persons" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Contact Persons</SelectItem>
                {filterContactPersons.map((person) => (
                  <SelectItem key={person.id} value={person.id}>
                    {person.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Minimum Amount</label>
            <Input
              type="number"
              placeholder="AED 0.00"
              value={minAmount}
              onChange={(e) => setMinAmount(e.target.value)}
              className="border-slate-300 focus:border-blue-500 focus:ring-blue-500 rounded-xl h-10"
            />
          </div>
        </div>

        {/* Results Summary */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between text-sm text-slate-600">
          <span>Showing {current.length} of {filtered.length} quotes</span>
          {filtered.length > PAGE_SIZE && (
            <Button
              variant="ghost"
              onClick={() => setShowAll(!showAll)}
              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-xl px-4 py-2 transition-all duration-200"
            >
              {showAll ? (
                <>
                  <ChevronUp className="h-4 w-4 mr-2" />
                  Show Less
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4 mr-2" />
                  Show All ({filtered.length})
                </>
              )}
            </Button>
          )}
        </div>

        {/* Quote Summary */}
        <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-200">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="w-3 h-3 bg-green-500 rounded-full mx-auto mb-2"></div>
              <div className="text-sm text-slate-600">Approved</div>
              <div className="text-lg font-bold text-slate-900">{approvedCount}</div>
            </div>
            <div className="text-center">
              <div className="w-3 h-3 bg-yellow-500 rounded-full mx-auto mb-2"></div>
              <div className="text-sm text-slate-600">Pending</div>
              <div className="text-lg font-bold text-slate-900">{pendingCount}</div>
            </div>
            <div className="text-center">
              <div className="w-3 h-3 bg-red-500 rounded-full mx-auto mb-2"></div>
              <div className="text-sm text-slate-600">Rejected</div>
              <div className="text-lg font-bold text-slate-900">{rejectedCount}</div>
            </div>
            <div className="text-center">
              <div className="w-3 h-3 bg-blue-500 rounded-full mx-auto mb-2"></div>
              <div className="text-sm text-slate-600">Total Items</div>
              <div className="text-lg font-bold text-slate-900">{filtered.length}</div>
            </div>
          </div>
        </div>

        {/* Quotes Table - Mobile Responsive */}
        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardContent className="p-0">
            {/* Desktop Table */}
            <div className="hidden lg:block overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow className="border-slate-200">
                    <TableHead className="text-slate-700 font-semibold p-6 w-32">Quote ID</TableHead>
                    <TableHead className="text-slate-700 font-semibold p-6 w-48">Client Details</TableHead>
                    <TableHead className="text-slate-700 font-semibold p-6 w-28">Date</TableHead>
                    <TableHead className="text-slate-700 font-semibold p-6 w-32">Product</TableHead>
                    <TableHead className="text-slate-700 font-semibold p-6 w-24">Quantity</TableHead>
                    <TableHead className="text-slate-700 font-semibold p-6 w-32">Amount</TableHead>
                    <TableHead className="text-slate-700 font-semibold p-6 w-24">Status</TableHead>
                    <TableHead className="text-slate-700 font-semibold p-6 w-32">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-16 text-slate-500">
                        <div className="flex items-center justify-center space-x-2">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                          <span>Loading quotes...</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : current.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-16 text-slate-500">
                        {filtered.length === 0 ? "No quotes found matching your filters." : "No quotes to display."}
                      </TableCell>
                    </TableRow>
                  ) : (
                    current.map((row, index) => (
                      <TableRow key={row.id} className="hover:bg-slate-50/80 transition-colors duration-200 border-slate-100">
                        <TableCell className="p-6">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                            {row.quoteId}
                          </span>
                        </TableCell>
                        <TableCell className="p-6">
                          <div className="space-y-1">
                            <div className="font-medium text-slate-900">{row.client?.companyName || 'N/A'}</div>
                            <div className="text-sm text-slate-500">{row.client?.contactPerson || 'N/A'}</div>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-slate-700 p-6">{fmtDate(row.date)}</TableCell>
                        <TableCell className="text-sm text-slate-700 p-6">{row.productName || row.product || 'N/A'}</TableCell>
                        <TableCell className="text-sm text-slate-700 p-6">{row.quantity || 0}</TableCell>
                        <TableCell className="p-6">
                          <span className="font-semibold text-slate-900">AED {row.amount ? row.amount.toFixed(2) : '0.00'}</span>
                        </TableCell>
                                                 <TableCell className="p-6">
                           <StatusBadge value={row.status} />
                         </TableCell>
                        <TableCell className="text-center p-6">
                          <div className="flex items-center justify-center space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onView(row)}
                              className="text-blue-600 hover:bg-blue-50 rounded-lg p-2"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onEdit(row.id)}
                              className="text-green-600 hover:bg-green-50 rounded-lg p-2"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            {row.status === "Approved" && (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => handleDownloadPDF(row, 'customer')}
                                    className="text-purple-600 hover:bg-purple-50 rounded-lg p-2"
                                  >
                                    <Download className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-40">
                                  <DropdownMenuItem 
                                    onClick={() => handleDownloadPDF(row, 'customer')}
                                    disabled={downloadingPDF === `${row.id}-customer`}
                                    className="text-green-700 hover:text-green-800 hover:bg-green-50"
                                  >
                                    <Download className="h-3 w-3 mr-2" />
                                    Customer PDF
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    onClick={() => handleDownloadPDF(row, 'operations')}
                                    disabled={downloadingPDF === `${row.id}-operations`}
                                    className="text-orange-700 hover:text-orange-800 hover:bg-orange-50"
                                  >
                                    <Download className="h-3 w-3 mr-2" />
                                    Operations PDF
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Mobile Cards */}
            <div className="lg:hidden space-y-4 p-4">
              {loading ? (
                <div className="text-center py-16 text-slate-500">
                  <div className="flex items-center justify-center space-x-2">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                    <span>Loading quotes...</span>
                  </div>
                </div>
              ) : current.length === 0 ? (
                <div className="text-center py-16 text-slate-500">
                  {filtered.length === 0 ? "No quotes found matching your filters." : "No quotes to display."}
                </div>
              ) : (
                current.map((row, index) => (
                  <Card key={row.id} className="p-4 border-slate-200">
                    <div className="space-y-3">
                      {/* Header with Quote ID and Status */}
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-sm font-medium text-slate-900 bg-slate-100 px-2 py-1 rounded">
                          {row.quoteId}
                        </span>
                                                 <StatusBadge value={row.status} />
                      </div>
                      
                      {/* Client Info */}
                      <div className="space-y-1">
                        <div className="font-medium text-slate-900">{row.clientName || 'N/A'}</div>
                        <div className="text-sm text-slate-500">{row.contactPerson || 'N/A'}</div>
                      </div>
                      
                      {/* Product and Quantity */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="text-sm text-slate-500">Product:</span>
                          <div className="text-sm text-slate-700">{row.productName || row.product || 'N/A'}</div>
                        </div>
                        <div>
                          <span className="text-sm text-slate-500">Quantity:</span>
                          <div className="text-sm text-slate-700">{row.quantity || 0}</div>
                        </div>
                      </div>
                      
                      {/* Date and Amount */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="text-sm text-slate-500">Date:</span>
                          <div className="text-sm text-slate-700">{fmtDate(row.date)}</div>
                        </div>
                        <div>
                          <span className="text-sm text-slate-500">Amount:</span>
                          <div className="font-semibold text-slate-900">AED {row.amount ? row.amount.toFixed(2) : '0.00'}</div>
                        </div>
                      </div>
                      
                      {/* Actions */}
                      <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onView(row)}
                            className="text-blue-600 border-blue-200 hover:bg-blue-50"
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onEdit(row.id)}
                            className="text-green-600 border-green-200 hover:bg-green-50"
                          >
                            <Pencil className="w-4 h-4 mr-1" />
                            Edit
                          </Button>
                        </div>
                        {row.status === "Approved" && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button 
                                variant="outline"
                                size="sm"
                                onClick={() => handleDownloadPDF(row, 'customer')}
                                className="text-purple-600 border-purple-200 hover:bg-purple-50"
                              >
                                <Download className="w-4 h-4 mr-1" />
                                PDF
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-40">
                              <DropdownMenuItem 
                                onClick={() => handleDownloadPDF(row, 'customer')}
                                disabled={downloadingPDF === `${row.id}-customer`}
                                className="text-green-700 hover:text-green-800 hover:bg-green-50"
                              >
                                <Download className="h-3 w-3 mr-2" />
                                Customer PDF
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleDownloadPDF(row, 'operations')}
                                disabled={downloadingPDF === `${row.id}-operations`}
                                className="text-orange-700 hover:text-orange-800 hover:bg-orange-50"
                              >
                                <Download className="h-3 w-3 mr-2" />
                                Operations PDF
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ===== Modal View ===== */}
      <Dialog open={openView} onOpenChange={setOpenView}>
        <DialogContent className="sm:max-w-[800px] rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-900">Quote Details</DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-800 border-b border-slate-200 pb-2">Basic Information</h3>
              <div className="rounded-xl border border-slate-200 overflow-hidden">
                <div className="grid grid-cols-3 gap-0 text-sm">
                  <div className="col-span-1 px-4 py-3 text-slate-500 border-b border-slate-200 bg-slate-50">Quote ID:</div>
                  <div className="col-span-2 px-4 py-3 border-b border-slate-200 font-semibold text-slate-900">{viewRow?.quoteId ?? "—"}</div>

                  <div className="col-span-1 px-4 py-3 text-slate-500 border-b border-slate-200 bg-slate-50">Client:</div>
                  <div className="col-span-2 px-4 py-3 border-b border-slate-200 font-semibold text-slate-900">{viewRow?.clientName ?? "—"}</div>

                  <div className="col-span-1 px-4 py-3 text-slate-500 border-b border-slate-200 bg-slate-50">Contact Person:</div>
                  <div className="col-span-2 px-4 py-3 border-b border-slate-200 font-semibold text-slate-900">{viewRow?.contactPerson ?? "—"}</div>

                  <div className="col-span-1 px-4 py-3 text-slate-500 border-b border-slate-200 bg-slate-50">Date:</div>
                  <div className="col-span-2 px-4 py-3 border-b border-slate-200 font-semibold text-slate-900">
                    {viewRow?.date ? fmtDate(viewRow.date) : "—"}
                  </div>

                  <div className="col-span-1 px-4 py-3 text-slate-500 border-b border-slate-200 bg-slate-50">Status:</div>
                  <div className="col-span-2 px-4 py-3 border-b border-slate-200 font-semibold text-slate-900">
                    <StatusBadge status={viewRow?.status as Status} />
                  </div>

                  <div className="col-span-1 px-4 py-3 text-slate-500 bg-slate-50">Total Amount:</div>
                  <div className="col-span-2 px-4 py-3 border-slate-200 font-semibold text-slate-900 text-green-600">
                    {viewRow?.amount ? currency.format(viewRow.amount) : "—"}
                  </div>
                </div>
              </div>
            </div>

            {/* Product Specifications */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-800 border-b border-slate-200 pb-2">Product Specifications</h3>
              <div className="rounded-xl border border-slate-200 overflow-hidden">
                <div className="grid grid-cols-3 gap-0 text-sm">
                  <div className="col-span-1 px-4 py-3 text-slate-500 border-b border-slate-200 bg-slate-50">Product Name:</div>
                  <div className="col-span-2 px-4 py-3 border-b border-slate-200 font-semibold text-slate-900">
                    {viewRow?.productName ?? viewRow?.product ?? "—"}
                  </div>

                  <div className="col-span-1 px-4 py-3 text-slate-500 border-b border-slate-200 bg-slate-50">Quantity:</div>
                  <div className="col-span-2 px-4 py-3 border-b border-slate-200 font-semibold text-slate-900">
                    {typeof viewRow?.quantity === "number" ? viewRow?.quantity.toLocaleString() : "—"}
                  </div>

                  <div className="col-span-1 px-4 py-3 text-slate-500 border-b border-slate-200 bg-slate-50">Printing Method:</div>
                  <div className="col-span-2 px-4 py-3 border-b border-slate-200 font-semibold text-slate-900">
                    {viewRow?.printingSelection ?? viewRow?.printing ?? "—"}
                  </div>

                  <div className="col-span-1 px-4 py-3 text-slate-500 border-b border-slate-200 bg-slate-50">Sides:</div>
                  <div className="col-span-2 px-4 py-3 border-b border-slate-200 font-semibold text-slate-900">
                    {viewRow?.sides === "1" ? "1 Side" : viewRow?.sides === "2" ? "2 Sides" : "—"}
                  </div>
                </div>
              </div>
            </div>

            {/* Size Specifications */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-800 border-b border-slate-200 pb-2">Size Specifications</h3>
              <div className="rounded-xl border border-slate-200 overflow-hidden">
                <div className="grid grid-cols-3 gap-0 text-sm">
                  <div className="col-span-1 px-4 py-3 text-slate-500 border-b border-slate-200 bg-slate-50">Flat Size (Open):</div>
                  <div className="col-span-2 px-4 py-3 border-b border-slate-200 font-semibold text-slate-900">
                    {viewRow?.flatSize?.width && viewRow?.flatSize?.height 
                      ? `${viewRow.flatSize.width}cm × ${viewRow.flatSize.height}cm${viewRow.flatSize.spine ? ` + ${viewRow.flatSize.spine}cm spine` : ''}`
                      : "—"
                    }
                  </div>

                  <div className="col-span-1 px-4 py-3 text-slate-500 border-b border-slate-200 bg-slate-50">Close Size (Closed):</div>
                  <div className="col-span-2 px-4 py-3 border-b border-slate-200 font-semibold text-slate-900">
                    {viewRow?.useSameAsFlat 
                      ? "Same as Flat Size"
                      : viewRow?.closeSize?.width && viewRow?.closeSize?.height
                        ? `${viewRow.closeSize.width}cm × ${viewRow.closeSize.height}cm${viewRow.closeSize.spine ? ` + ${viewRow.closeSize.spine}cm spine` : ''}`
                        : "—"
                    }
                  </div>
                </div>
              </div>
            </div>

            {/* Color Specifications */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-800 border-b border-slate-200 pb-2">Color Specifications</h3>
              <div className="rounded-xl border border-slate-200 overflow-hidden">
                <div className="grid grid-cols-3 gap-0 text-sm">
                  <div className="col-span-1 px-4 py-3 text-slate-500 border-b border-slate-200 bg-slate-50">Front Side:</div>
                  <div className="col-span-2 px-4 py-3 border-b border-slate-200 font-semibold text-slate-900">
                    {viewRow?.colors?.front || "—"}
                  </div>

                  {viewRow?.sides === "2" && (
                    <>
                      <div className="col-span-1 px-4 py-3 text-slate-500 border-b border-slate-200 bg-slate-50">Back Side:</div>
                      <div className="col-span-2 px-4 py-3 border-b border-slate-200 font-semibold text-slate-900">
                        {viewRow?.colors?.back || "—"}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Additional Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-800 border-b border-slate-200 pb-2">Additional Details</h3>
              <div className="rounded-xl border border-slate-200 overflow-hidden">
                <div className="grid grid-cols-3 gap-0 text-sm">
                  <div className="col-span-1 px-4 py-3 text-slate-500 border-b border-slate-200 bg-slate-50">User ID:</div>
                  <div className="col-span-2 px-4 py-3 border-b border-slate-200 font-semibold text-slate-900">
                    {viewRow?.userId ?? "—"}
                  </div>

                  <div className="col-span-1 px-4 py-3 text-slate-500 bg-slate-50">Created:</div>
                  <div className="col-span-2 px-4 py-3 border-slate-200 font-semibold text-slate-900">
                    {viewRow?.date ? new Date(viewRow.date).toLocaleDateString() : "—"}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button 
              onClick={() => setOpenView(false)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-xl"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ===== Modal Edit ===== */}
      <Dialog open={openEdit} onOpenChange={setOpenEdit}>
        <DialogContent className="sm:max-w-[800px] rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-900">Edit Quote</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-800 border-b border-slate-200 pb-2">Basic Information</h3>
              <div className="grid gap-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <label className="text-right text-sm text-slate-600 font-medium">Quote ID</label>
                  <Input className="col-span-3 bg-slate-100 border-slate-300 rounded-xl" readOnly value={draft.quoteId || draft.id} />
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <label className="text-right text-sm font-medium text-slate-700">Client Name</label>
                  <Input
                    className="col-span-3 border-slate-300 focus:border-blue-500 focus:ring-blue-500 rounded-xl"
                    value={draft.clientName}
                    onChange={(e) => setDraft((d) => ({ ...d, clientName: e.target.value }))}
                  />
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <label className="text-right text-sm font-medium text-slate-700">Contact Person</label>
                  <Input
                    className="col-span-3 border-slate-300 focus:border-blue-500 focus:ring-blue-500 rounded-xl"
                    value={draft.contactPerson}
                    onChange={(e) => setDraft((d) => ({ ...d, contactPerson: e.target.value }))}
                  />
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <label className="text-right text-sm font-medium text-slate-700">Date</label>
                  <Input
                    className="col-span-3 border-slate-300 focus:border-blue-500 focus:ring-blue-500 rounded-xl"
                    type="date"
                    value={draft.date}
                    onChange={(e) => setDraft((d) => ({ ...d, date: e.target.value }))}
                  />
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <label className="text-right text-sm font-medium text-slate-700">Amount</label>
                  <Input
                    className="col-span-3 border-slate-300 focus:border-blue-500 focus:ring-blue-500 rounded-xl"
                    type="number"
                    min={0}
                    step="0.01"
                    value={draft.amount}
                    onChange={(e) =>
                      setDraft((d) => ({ ...d, amount: e.target.value === "" ? "" : Number(e.target.value) }))
                    }
                  />
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <label className="text-right text-sm font-medium text-slate-700">Status</label>
                  <Select
                    value={draft.status}
                    onValueChange={(v: Status) => setDraft((d) => ({ ...d, status: v }))}
                  >
                    <SelectTrigger className="col-span-3 border-slate-300 focus:border-blue-500 focus:ring-blue-500 rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Approved">Approved</SelectItem>
                      <SelectItem value="Pending">Pending</SelectItem>
                      <SelectItem value="Rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Product Specifications */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-800 border-b border-slate-200 pb-2">Product Specifications</h3>
              <div className="grid gap-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <label className="text-right text-sm font-medium text-slate-700">Product Name</label>
                  <Input
                    className="col-span-3 border-slate-300 focus:border-blue-500 focus:ring-blue-500 rounded-xl"
                    value={draft.productName ?? ""}
                    onChange={(e) => setDraft((d) => ({ ...d, productName: e.target.value }))}
                    placeholder="e.g. Business Card"
                  />
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <label className="text-right text-sm font-medium text-slate-700">Quantity</label>
                  <Input
                    className="col-span-3 border-slate-300 focus:border-blue-500 focus:ring-blue-500 rounded-xl"
                    type="number"
                    min={0}
                    value={draft.quantity ?? ""}
                    onChange={(e) =>
                      setDraft((d) => ({ ...d, quantity: e.target.value === "" ? "" : Number(e.target.value) }))
                    }
                    placeholder="e.g. 1000"
                  />
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <label className="text-right text-sm font-medium text-slate-700">Printing Method</label>
                  <Select
                    value={draft.printingSelection ?? draft.printing ?? "Digital"}
                    onValueChange={(v) => setDraft((d) => ({ ...d, printingSelection: v, printing: v }))}
                  >
                    <SelectTrigger className="col-span-3 border-slate-300 focus:border-blue-500 focus:ring-blue-500 rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Digital">Digital</SelectItem>
                      <SelectItem value="Offset">Offset</SelectItem>
                      <SelectItem value="Either">Either</SelectItem>
                      <SelectItem value="Both">Both</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <label className="text-right text-sm font-medium text-slate-700">Sides</label>
                  <Select
                    value={draft.sides ?? "1"}
                    onValueChange={(v) => setDraft((d) => ({ ...d, sides: v }))}
                  >
                    <SelectTrigger className="col-span-3 border-slate-300 focus:border-blue-500 focus:ring-blue-500 rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 Side</SelectItem>
                      <SelectItem value="2">2 Sides</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Size Specifications */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-800 border-b border-slate-200 pb-2">Size Specifications (cm)</h3>
              <div className="grid gap-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <label className="text-right text-sm font-medium text-slate-700">Flat Size Width</label>
                  <Input
                    className="col-span-3 border-slate-300 focus:border-blue-500 focus:ring-blue-500 rounded-xl"
                    type="number"
                    min={0}
                    step="0.1"
                    value={draft.flatSize?.width ?? ""}
                    onChange={(e) => {
                      const newWidth = e.target.value === "" ? null : Number(e.target.value);
                      setDraft((d) => ({ 
                        ...d, 
                        flatSize: { 
                          ...d.flatSize, 
                          width: newWidth 
                        } 
                      }));
                      
                      // If useSameAsFlat is true, also update close size
                      if (draft.useSameAsFlat) {
                        setDraft((d) => ({ 
                          ...d, 
                          closeSize: { 
                            ...d.closeSize, 
                            width: newWidth 
                          } 
                        }));
                      }
                    }}
                    placeholder="e.g. 9.0"
                  />
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <label className="text-right text-sm font-medium text-slate-700">Flat Size Height</label>
                  <Input
                    className="col-span-3 border-slate-300 focus:border-blue-500 focus:ring-blue-500 rounded-xl"
                    type="number"
                    min={0}
                    step="0.1"
                    value={draft.flatSize?.height ?? ""}
                    onChange={(e) => {
                      const newHeight = e.target.value === "" ? null : Number(e.target.value);
                      setDraft((d) => ({ 
                        ...d, 
                        flatSize: { 
                          ...d.flatSize, 
                          height: newHeight 
                        } 
                      }));
                      
                      // If useSameAsFlat is true, also update close size
                      if (draft.useSameAsFlat) {
                        setDraft((d) => ({ 
                          ...d, 
                          closeSize: { 
                            ...d.closeSize, 
                            height: newHeight 
                          } 
                        }));
                      }
                    }}
                    placeholder="e.g. 5.5"
                  />
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <label className="text-right text-sm font-medium text-slate-700">Flat Size Spine</label>
                  <Input
                    className="col-span-3 border-slate-300 focus:border-blue-500 focus:ring-blue-500 rounded-xl"
                    type="number"
                    min={0}
                    step="0.1"
                    value={draft.flatSize?.spine ?? ""}
                    onChange={(e) => {
                      const newSpine = e.target.value === "" ? null : Number(e.target.value);
                      setDraft((d) => ({ 
                        ...d, 
                        flatSize: { 
                          ...d.flatSize, 
                          spine: newSpine 
                        } 
                      }));
                      
                      // If useSameAsFlat is true, also update close size
                      if (draft.useSameAsFlat) {
                        setDraft((d) => ({ 
                          ...d, 
                          closeSize: { 
                            ...d.closeSize, 
                            spine: newSpine 
                          } 
                        }));
                      }
                    }}
                    placeholder="e.g. 0.0"
                  />
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <label className="text-right text-sm font-medium text-slate-700">Use Same as Flat</label>
                  <div className="col-span-3 flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={draft.useSameAsFlat ?? false}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setDraft((d) => ({ 
                          ...d, 
                          useSameAsFlat: checked,
                          // If checking the box, copy flat size to close size
                          closeSize: checked ? d.flatSize : d.closeSize
                        }));
                      }}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-slate-600">Close size uses same dimensions as flat size</span>
                  </div>
                </div>

                {!draft.useSameAsFlat && (
                  <>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <label className="text-right text-sm font-medium text-slate-700">Close Size Width</label>
                      <Input
                        className="col-span-3 border-slate-300 focus:border-blue-500 focus:ring-blue-500 rounded-xl"
                        type="number"
                        min={0}
                        step="0.1"
                        value={draft.closeSize?.width ?? ""}
                        onChange={(e) =>
                          setDraft((d) => ({ 
                            ...d, 
                            closeSize: { 
                              ...d.closeSize, 
                              width: e.target.value === "" ? null : Number(e.target.value) 
                            } 
                          }))
                        }
                        placeholder="e.g. 9.0"
                      />
                    </div>

                    <div className="grid grid-cols-4 items-center gap-4">
                      <label className="text-right text-sm font-medium text-slate-700">Close Size Height</label>
                      <Input
                        className="col-span-3 border-slate-300 focus:border-blue-500 focus:ring-blue-500 rounded-xl"
                        type="number"
                        min={0}
                        step="0.1"
                        value={draft.closeSize?.height ?? ""}
                        onChange={(e) =>
                          setDraft((d) => ({ 
                            ...d, 
                            closeSize: { 
                              ...d.closeSize, 
                              height: e.target.value === "" ? null : Number(e.target.value) 
                            } 
                          }))
                        }
                        placeholder="e.g. 5.5"
                      />
                    </div>

                    <div className="grid grid-cols-4 items-center gap-4">
                      <label className="text-right text-sm font-medium text-slate-700">Close Size Spine</label>
                      <Input
                        className="col-span-3 border-slate-300 focus:border-blue-500 focus:ring-blue-500 rounded-xl"
                        type="number"
                        min={0}
                        step="0.1"
                        value={draft.closeSize?.spine ?? ""}
                        onChange={(e) =>
                          setDraft((d) => ({ 
                            ...d, 
                            closeSize: { 
                              ...d.closeSize, 
                              spine: e.target.value === "" ? null : Number(e.target.value) 
                            } 
                          }))
                        }
                        placeholder="e.g. 0.0"
                      />
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Color Specifications */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-800 border-b border-slate-200 pb-2">Color Specifications</h3>
              <div className="grid gap-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <label className="text-right text-sm font-medium text-slate-700">Front Side Colors</label>
                  <Select
                    value={draft.colors?.front ?? ""}
                    onValueChange={(v) => setDraft((d) => ({ 
                      ...d, 
                      colors: { ...d.colors, front: v } 
                    }))}
                  >
                    <SelectTrigger className="col-span-3 border-slate-300 focus:border-blue-500 focus:ring-blue-500 rounded-xl">
                      <SelectValue placeholder="Select colors" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1 Color">1 Color</SelectItem>
                      <SelectItem value="2 Colors">2 Colors</SelectItem>
                      <SelectItem value="3 Colors">3 Colors</SelectItem>
                      <SelectItem value="4 Colors (CMYK)">4 Colors (CMYK)</SelectItem>
                      <SelectItem value="4+1 Colors">4+1 Colors</SelectItem>
                      <SelectItem value="4+2 Colors">4+2 Colors</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {draft.sides === "2" && (
                  <div className="grid grid-cols-4 items-center gap-4">
                    <label className="text-right text-sm font-medium text-slate-700">Back Side Colors</label>
                    <Select
                      value={draft.colors?.back ?? ""}
                      onValueChange={(v) => setDraft((d) => ({ 
                        ...d, 
                        colors: { ...d.colors, back: v } 
                      }))}
                    >
                      <SelectTrigger className="col-span-3 border-slate-300 focus:border-blue-500 focus:ring-blue-500 rounded-xl">
                        <SelectValue placeholder="Select colors" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1 Color">1 Color</SelectItem>
                        <SelectItem value="2 Colors">2 Colors</SelectItem>
                        <SelectItem value="3 Colors">3 Colors</SelectItem>
                        <SelectItem value="4 Colors (CMYK)">4 Colors (CMYK)</SelectItem>
                        <SelectItem value="4+1 Colors">4+1 Colors</SelectItem>
                        <SelectItem value="4+2 Colors">4+2 Colors</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="ghost" 
              onClick={() => setOpenEdit(false)}
              className="border-slate-300 hover:border-slate-400 hover:bg-slate-50 px-6 py-2 rounded-xl"
            >
              Cancel
            </Button>
            <Button 
              onClick={onSubmitEdit}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-xl"
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Quote Modal */}
      <CreateQuoteModal 
        isOpen={isCreateQuoteModalOpen}
        onClose={() => setIsCreateQuoteModalOpen(false)}
        onSubmit={handleCreateQuote}
      />
    </div>
  );
}
