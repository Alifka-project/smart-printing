"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Users, 
  FileText, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Calendar,
  Plus,
  Eye,
  Edit,
  Download,
  MoreVertical,
  Filter
} from "lucide-react";
import Link from "next/link";

import { QuoteStatus } from "@/constants";



export default function DashboardPage() {
  const [allQuotes, setAllQuotes] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [from, setFrom] = useState<string>("");
  const [to, setTo] = useState<string>("");
  const [minAmount, setMinAmount] = useState<string>("");
  const [maxAmount, setMaxAmount] = useState<string>("");
  const [keywordFilter, setKeywordFilter] = useState("");
  const [selectedQuote, setSelectedQuote] = useState<any>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [updateStatusValue, setUpdateStatusValue] = useState<string>("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<{ name: string; role: string } | null>({ name: "Demo User", role: "admin" });
  const [isIpadLandscape, setIsIpadLandscape] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  
  const router = useRouter();

  // Check authentication
  useEffect(() => {
    // Remove authentication requirement - allow access without login
    const currentUser = getCurrentUser();
    
    if (currentUser) {
      setUser({ name: currentUser.name, role: currentUser.role });
    } else {
      // Set a default user for demo purposes
      setUser({ name: "Demo User", role: "admin" });
    }
  }, []); // Remove router dependency to run immediately

  // Detect iPad landscape
  useEffect(() => {
    const checkIpadLandscape = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const isLandscape = width > height;
      
      // Check if it's iPad Mini (1024px) or iPad Air (1180px) in landscape
      const isIpadMini = width === 1024 && height === 768 && isLandscape;
      const isIpadAir = width === 1180 && height === 820 && isLandscape;
      
      setIsIpadLandscape(isIpadMini || isIpadAir);
    };

    checkIpadLandscape();
    window.addEventListener('resize', checkIpadLandscape);
    
    return () => window.removeEventListener('resize', checkIpadLandscape);
  }, []);

  // Cleanup effect for update modal
  useEffect(() => {
    if (!isUpdateModalOpen) {
      // Reset states when modal is closed
      const timer = setTimeout(() => {
        setUpdateStatusValue("");
        setSelectedQuote(null);
        setIsUpdating(false);
      }, 100); // Small delay to ensure modal animation completes
      
      return () => clearTimeout(timer);
    }
  }, [isUpdateModalOpen]);

  // Load quotes from database on page load
  useEffect(() => {
    const loadQuotes = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/quotes');
        if (response.ok) {
          const quotesData = await response.json();
          
          // Transform database quotes to match QuoteRow format
          const transformedQuotes = quotesData.map((quote: any) => {
            // Get proper client name - use the displayName from API or fallback logic
            let customerName = "Unknown Client";
            if (quote.client) {
              // First try to use the displayName that the API provides
              if (quote.client.displayName && quote.client.displayName !== "N/A" && quote.client.displayName.trim() !== "") {
                customerName = quote.client.displayName;
              } else if (quote.client.companyName && quote.client.companyName.trim() !== "") {
                customerName = quote.client.companyName;
              } else if (quote.client.firstName && quote.client.lastName && 
                         quote.client.firstName.trim() !== "" && quote.client.lastName.trim() !== "") {
                customerName = `${quote.client.firstName} ${quote.client.lastName}`;
              } else if (quote.client.contactPerson && quote.client.contactPerson.trim() !== "") {
                customerName = quote.client.contactPerson;
              } else if (quote.client.email && quote.client.email.trim() !== "") {
                customerName = quote.client.email;
              } else {
                customerName = `Client ${quote.quoteId}`;
              }
            } else {
              // If no client data at all, use quote ID as fallback
              customerName = `Client ${quote.quoteId}`;
            }
            
            // Calculate amount - handle both array and object formats from API
            let totalAmount = 0;
            
            if (quote.amounts) {
              if (Array.isArray(quote.amounts) && quote.amounts.length > 0) {
                // amounts is an array, get the first one
                const amount = quote.amounts[0];
                
                if (amount && amount.total && amount.total > 0) {
                  totalAmount = amount.total;
                } else if (amount && amount.base && amount.base > 0) {
                  // If total is missing but base exists, calculate total
                  totalAmount = amount.base + (amount.vat || 0);
                }
              } else if (typeof quote.amounts === 'object' && quote.amounts.total && quote.amounts.total > 0) {
                // Single amount object with total
                totalAmount = quote.amounts.total;
              } else if (typeof quote.amounts === 'object' && quote.amounts.base && quote.amounts.base > 0) {
                // Single amount object with base, calculate total
                totalAmount = quote.amounts.base + (quote.amounts.vat || 0);
              }
            }
            
            // Debug logging for amounts
            console.log('Quote amounts debug:', {
              quoteId: quote.quoteId,
              amounts: quote.amounts,
              amountsType: typeof quote.amounts,
              isArray: Array.isArray(quote.amounts),
              calculatedTotal: totalAmount
            });
            
            return {
              id: quote.id,
              quoteId: quote.quoteId, // This should be the proper quote ID
              customerName: customerName,
              createdDate: quote.date.split('T')[0], // Convert ISO date to YYYY-MM-DD
              status: quote.status,
              totalAmount: totalAmount,
              userId: quote.user?.id || "u1",
              // Preserve original data for view modal
              client: quote.client,
              amounts: quote.amounts,
              date: quote.date,
              product: quote.product,
              quantity: quote.quantity,
            };
          });
          setAllQuotes(transformedQuotes);
        } else {
          console.error('Failed to load quotes');
          // Fallback to dummy data if API fails
          setAllQuotes([]);
        }
      } catch (error) {
        console.error('Error loading quotes:', error);
        // Fallback to dummy data if API fails
        setAllQuotes([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadQuotes();
  }, []);


  // Cleanup function for modals
  useEffect(() => {
    return () => {
      // Cleanup modal states when component unmounts
      setIsViewModalOpen(false);
      setIsUpdateModalOpen(false);
      setSelectedQuote(null);
      setUpdateStatusValue("");
      setIsUpdating(false);
    };
  }, []);


  // Filter quotes based on all filters - use useMemo for better performance
  const filteredQuotes = useMemo(() => {
    const filtered = allQuotes.filter((q) => {
      const k = keywordFilter.trim().toLowerCase();

      // Keyword filter for client, quotation number, product, date, and amount
      const hitKeyword = k === "" || 
        q.customerName?.toLowerCase().includes(k) ||
        q.client?.contactPerson?.toLowerCase().includes(k) ||
        q.quoteId?.toLowerCase().includes(k) ||
        q.product?.toLowerCase().includes(k) ||
        q.createdDate?.toLowerCase().includes(k) ||
        q.totalAmount?.toString().includes(k);

      // Status filter
      const hitStatus = statusFilter === "All" || q.status === statusFilter;
      
      // Amount range filter
      const hitMinAmount = minAmount === "" || (q.totalAmount && q.totalAmount >= Number(minAmount));
      const hitMaxAmount = maxAmount === "" || (q.totalAmount && q.totalAmount <= Number(maxAmount));

      const hitFrom = from === "" || (q.createdDate && q.createdDate >= from);
      const hitTo = to === "" || (q.createdDate && q.createdDate <= to);

      return hitKeyword && hitStatus && hitMinAmount && hitMaxAmount && hitFrom && hitTo;
    });
    
    // Sort by newest first (most recent createdDate first)
    const sorted = [...filtered].sort((a, b) => {
      const dateA = new Date(a.createdDate || a.date || 0);
      const dateB = new Date(b.createdDate || b.date || 0);
      return dateB.getTime() - dateA.getTime(); // Newest first
    });
    
    return sorted;
  }, [allQuotes, statusFilter, keywordFilter, minAmount, maxAmount, from, to]);

  // Pagination logic
  const totalPages = Math.ceil(filteredQuotes.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedQuotes = filteredQuotes.slice(startIndex, endIndex);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, keywordFilter, minAmount, maxAmount, from, to]);

  // Calculate metrics - these will now update automatically when allQuotes changes
  const totalQuotes = useMemo(() => allQuotes.length, [allQuotes]);
  const approvedQuotes = useMemo(() => allQuotes.filter(q => q.status === "Approved").length, [allQuotes]);
  const pendingQuotes = useMemo(() => allQuotes.filter(q => q.status === "Pending").length, [allQuotes]);
  const rejectedQuotes = useMemo(() => allQuotes.filter(q => q.status === "Rejected").length, [allQuotes]);

  const metricCards = useMemo(() => [
    {
      title: "Total Quotes",
      value: totalQuotes.toLocaleString(),
      icon: FileText,
      color: "bg-[#27aae1]/10 text-[#27aae1] border-[#27aae1]/20",
      iconColor: "text-[#27aae1]",
      filterValue: "All"
    },
    {
      title: "Approved",
      value: approvedQuotes.toLocaleString(),
      icon: CheckCircle,
      color: "bg-[#27aae1]/10 text-[#27aae1] border-[#27aae1]/20",
      iconColor: "text-[#27aae1]",
      filterValue: "Approved"
    },
    {
      title: "Pending",
      value: pendingQuotes.toLocaleString(),
      icon: Clock,
      color: "bg-[#f89d1d]/10 text-[#f89d1d] border-[#f89d1d]/20",
      iconColor: "text-[#f89d1d]",
      filterValue: "Pending"
    },
    {
      title: "Rejected",
      value: rejectedQuotes.toLocaleString(),
      icon: XCircle,
      color: "bg-red-50 text-red-700 border-red-200",
      iconColor: "text-red-600",
      filterValue: "Rejected"
    }
  ], [totalQuotes, approvedQuotes, pendingQuotes, rejectedQuotes]);

  // Show loading while checking authentication (this should rarely be needed now)
  if (!user) {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-slate-200 rounded-full"></div>
            <div className="absolute top-0 left-0 w-16 h-16 border-4 border-transparent border-t-[#27aae1] rounded-full animate-spin"></div>
            <div className="absolute top-2 left-2 w-12 h-12 border-4 border-transparent border-t-[#ea078b] rounded-full animate-spin" style={{ animationDirection: "reverse", animationDuration: "0.8s" }}></div>
          </div>
          <div className="flex space-x-1">
            <span className="text-slate-600 animate-pulse">Checking authentication</span>
            <span className="text-[#27aae1] animate-bounce">.</span>
            <span className="text-[#ea078b] animate-bounce" style={{ animationDelay: "0.1s" }}>.</span>
            <span className="text-[#f89d1d] animate-bounce" style={{ animationDelay: "0.2s" }}>.</span>
          </div>
        </div>
      </div>
    );
  }
  

  // Format date function to match image format
  const formatDate = (dateInput: string | Date) => {
    try {
      const date = new Date(dateInput);
      if (isNaN(date.getTime())) {
        return 'Invalid Date';
      }
      const months = [
        "Jan", "Feb", "Mar", "Apr", "May", "Jun",
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
      ];
      const day = date.getDate();
      const month = months[date.getMonth()];
      const year = date.getFullYear();
      return `${day} ${month} ${year}`;
    } catch (error) {
      console.error('Error formatting date:', error, dateInput);
      return 'Invalid Date';
    }
  };

  const handleCardClick = (filterValue: string) => {
    setStatusFilter(filterValue);
  };

  const clearAllFilters = () => {
    setStatusFilter("All");
    setFrom("");
    setTo("");
    setMinAmount("");
    setMaxAmount("");
    setKeywordFilter("");
  };

  const handleViewQuote = (quote: any) => {
    if (!quote || !quote.id) {
      console.error('Invalid quote data provided to view modal');
      alert('Invalid quote data. Please try again.');
      return;
    }
    
    console.log('Opening view modal for quote:', quote);
    setSelectedQuote(quote);
    setIsViewModalOpen(true);
  };

  const handleUpdateQuote = (quote: any) => {
    if (!quote || !quote.id) {
      console.error('Invalid quote data provided to update modal');
      alert('Invalid quote data. Please try again.');
      return;
    }
    
    console.log('Opening update modal for quote:', quote);
    console.log('Quote status:', quote.status);
    
    // Set both states together to ensure consistency
    setSelectedQuote(quote);
    setUpdateStatusValue(quote.status || "");
    
    console.log('Set updateStatusValue to:', quote.status || "");
    
    // Open the modal
    setIsUpdateModalOpen(true);
  };

  const handleStatusUpdate = async (newStatus: string) => {
    // Validate input data
    if (!selectedQuote || !selectedQuote.id) {
      alert('No quote selected for update');
      return;
    }

    if (!updateStatusValue || !newStatus) {
      alert('Please select a valid status before updating.');
      return;
    }

    if (updateStatusValue === selectedQuote.status) {
      alert('Quote already has this status. No changes needed.');
      return;
    }

    try {
      setIsUpdating(true);
      
      // Update the quote status in the database
              const response = await fetch(`/api/quotes/${selectedQuote.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ status: newStatus }),
        });
        
        if (!response.ok) {
          throw new Error('Failed to update quote status');
        }
        
        const updatedQuote = await response.json();
      
      // Update the quote in local state
      const updatedQuotes = allQuotes.map(quote => 
        quote.id === selectedQuote.id 
          ? updatedQuote
          : quote
      );
      
      // Update the quotes state
      setAllQuotes(updatedQuotes);
      
      // Show success message
      setSuccessMessage(`Quote status updated to ${newStatus} successfully!`);
      setShowSuccessMessage(true);
      
      // Hide success message after 3 seconds
      setTimeout(() => {
        setShowSuccessMessage(false);
        setSuccessMessage("");
      }, 3000);
      
      // Force close modal by resetting all states
      setIsUpdateModalOpen(false);
      setUpdateStatusValue("");
      setSelectedQuote(null);
      setIsUpdating(false);
      
    } catch (error) {
      console.error('Error updating quote status:', error);
      alert('Error updating quote status. Please try again.');
      
      // Reset states on error too
      setIsUpdateModalOpen(false);
      setUpdateStatusValue("");
      setSelectedQuote(null);
      setIsUpdating(false);
    }
  };

  const handleDownloadPDF = async (quote: any) => {
    try {
      console.log(`Generating PDF for quote ${quote.quoteId}`);
      
      // Show loading state
      const downloadBtn = document.querySelector(`[data-quote-id="${quote.id}"] .download-btn`);
      if (downloadBtn) {
        downloadBtn.innerHTML = 'Generating...';
        downloadBtn.setAttribute('disabled', 'true');
      }
      
      // Call the PDF generation API
      const response = await fetch(`/api/quotes/${quote.id}/pdf`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'customer' // or 'operations' based on your needs
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate PDF');
      }
      
      // Get the PDF blob
      const pdfBlob = await response.blob();
      
      // Create download link
      const url = window.URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Quote-${quote.quoteId}-${new Date().toISOString().split('T')[0]}.pdf`;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up
      window.URL.revokeObjectURL(url);
      
      console.log(`PDF downloaded successfully for quote ${quote.quoteId}`);
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      // Reset button state
      const downloadBtn = document.querySelector(`[data-quote-id="${quote.id}"] .download-btn`);
      if (downloadBtn) {
        downloadBtn.innerHTML = '<Download className="w-4 h-4" />';
        downloadBtn.removeAttribute('disabled');
      }
    }
  };

  const ViewQuoteModal = () => {
    // Only render if modal should be open
    if (!isViewModalOpen) return null;
    
    return (
      <Dialog 
        open={isViewModalOpen} 
        onOpenChange={(open) => {
          if (!open) {
            // Force close and reset all states
            setIsViewModalOpen(false);
            setSelectedQuote(null);
          }
        }}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-slate-900">Quote Details - {selectedQuote?.quoteId}</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            {/* Client Information */}
            <div className="bg-slate-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-slate-900 mb-3">Client Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-600">Company Name</label>
                  <p className="text-base font-semibold text-slate-900">
                    {selectedQuote?.client?.companyName || selectedQuote?.client?.contactPerson || 'N/A'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-600">Contact Person</label>
                  <p className="text-base font-semibold text-slate-900">
                    {selectedQuote?.client?.contactPerson || 'N/A'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-600">Email</label>
                  <p className="text-base text-slate-700">
                    {selectedQuote?.client?.email || 'N/A'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-600">Phone</label>
                  <p className="text-base text-slate-700">
                    {selectedQuote?.client?.countryCode || ''}{selectedQuote?.client?.phone || 'N/A'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-600">Client Type</label>
                  <p className="text-base text-slate-700">
                    {selectedQuote?.client?.clientType || 'N/A'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-600">Role</label>
                  <p className="text-base text-slate-700">
                    {selectedQuote?.client?.role || 'N/A'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-600">Address</label>
                  <p className="text-base text-slate-700">
                    {selectedQuote?.client?.address || 'N/A'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-600">Location</label>
                  <p className="text-base text-slate-700">
                    {selectedQuote?.client?.city && selectedQuote?.client?.state 
                      ? `${selectedQuote.client.city}, ${selectedQuote.client.state}` 
                      : selectedQuote?.client?.city || selectedQuote?.client?.state || 'N/A'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-600">Country</label>
                  <p className="text-base text-slate-700">
                    {selectedQuote?.client?.country || 'N/A'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-600">Status</label>
                  <p className="text-base text-slate-700">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      selectedQuote?.client?.status === "Active" 
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-700"
                    }`}>
                      {selectedQuote?.client?.status || 'N/A'}
                    </span>
                  </p>
                </div>
              </div>
            </div>

            {/* Quote Information */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-slate-900 mb-3">Quote Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-600">Quote ID</label>
                  <p className="text-base font-semibold text-slate-900">{selectedQuote?.quoteId}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-600">Status</label>
                  <div className="mt-1">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      selectedQuote?.status === "Approved" 
                        ? "bg-emerald-100 text-emerald-700"
                        : selectedQuote?.status === "Pending"
                        ? "bg-amber-100 text-amber-700"
                        : "bg-rose-100 text-rose-700"
                    }`}>
                      {selectedQuote?.status}
                    </span>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-600">Date Created</label>
                  <p className="text-base font-semibold text-slate-900">
                    {selectedQuote?.createdDate ? formatDate(selectedQuote.createdDate) : 
                     selectedQuote?.date ? formatDate(selectedQuote.date) : 'N/A'}
                  </p>
                </div>
              </div>
            </div>

            {/* Product Details */}
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-slate-900 mb-3">Product Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-600">Product</label>
                  <p className="text-base font-semibold text-slate-900">
                    {selectedQuote?.product || selectedQuote?.productName || 'N/A'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-600">Product Name</label>
                  <p className="text-base font-semibold text-slate-900">
                    {selectedQuote?.productName || 'N/A'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-600">Quantity</label>
                  <p className="text-base font-semibold text-slate-900">
                    {selectedQuote?.quantity || 'N/A'} units
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-600">Printing Type</label>
                  <p className="text-base text-slate-700">
                    {selectedQuote?.printing || 'N/A'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-600">Printing Selection</label>
                  <p className="text-base text-slate-700">
                    {selectedQuote?.printingSelection || 'N/A'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-600">Sides</label>
                  <p className="text-base text-slate-700">
                    {selectedQuote?.sides || 'N/A'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-600">Colors</label>
                  <p className="text-base text-slate-700">
                    {selectedQuote?.colors || 'N/A'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-600">Sales Person ID</label>
                  <p className="text-base text-slate-700">
                    {selectedQuote?.salesPersonId || 'N/A'}
                  </p>
                </div>
              </div>
            </div>

            {/* Size Specifications */}
            <div className="bg-orange-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-slate-900 mb-3">Size Specifications</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-600">Flat Size</label>
                  <p className="text-base text-slate-700">
                    {selectedQuote?.flatSizeWidth && selectedQuote?.flatSizeHeight 
                      ? `${selectedQuote.flatSizeWidth} × ${selectedQuote.flatSizeHeight}${selectedQuote?.flatSizeSpine ? ` × ${selectedQuote.flatSizeSpine}` : ''}`
                      : 'N/A'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-600">Close Size</label>
                  <p className="text-base text-slate-700">
                    {selectedQuote?.closeSizeWidth && selectedQuote?.closeSizeHeight 
                      ? `${selectedQuote.closeSizeWidth} × ${selectedQuote.closeSizeHeight}${selectedQuote?.closeSizeSpine ? ` × ${selectedQuote.closeSizeSpine}` : ''}`
                      : 'N/A'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-600">Use Same as Flat</label>
                  <p className="text-base text-slate-700">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      selectedQuote?.useSameAsFlat 
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-700"
                    }`}>
                      {selectedQuote?.useSameAsFlat ? 'Yes' : 'No'}
                    </span>
                  </p>
                </div>
              </div>
            </div>

            {/* Paper Details */}
            {selectedQuote?.papers && selectedQuote.papers.length > 0 && (
              <div className="bg-yellow-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-slate-900 mb-3">Paper Specifications</h3>
                <div className="space-y-3">
                  {selectedQuote.papers.map((paper: any, index: number) => (
                    <div key={index} className="bg-white p-3 rounded border">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div>
                          <label className="text-sm font-medium text-slate-600">Paper Type</label>
                          <p className="text-sm text-slate-900">{paper.name || 'N/A'}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-slate-600">GSM</label>
                          <p className="text-sm text-slate-900">{paper.gsm || 'N/A'}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-slate-600">Price per Sheet</label>
                          <p className="text-sm text-slate-900">AED {paper.pricePerSheet || '0.00'}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-slate-600">Price per Packet</label>
                          <p className="text-sm text-slate-900">AED {paper.pricePerPacket || '0.00'}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-slate-600">Sheets per Packet</label>
                          <p className="text-sm text-slate-900">{paper.sheetsPerPacket || 'N/A'}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-slate-600">Recommended Sheets</label>
                          <p className="text-sm text-slate-900">{paper.recommendedSheets || 'N/A'}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-slate-600">Entered Sheets</label>
                          <p className="text-sm text-slate-900">{paper.enteredSheets || 'N/A'}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-slate-600">Input Size</label>
                          <p className="text-sm text-slate-900">
                            {paper.inputWidth && paper.inputHeight 
                              ? `${paper.inputWidth} × ${paper.inputHeight}`
                              : 'N/A'}
                          </p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-slate-600">Output Size</label>
                          <p className="text-sm text-slate-900">
                            {paper.outputWidth && paper.outputHeight 
                              ? `${paper.outputWidth} × ${paper.outputHeight}`
                              : 'N/A'}
                          </p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-slate-600">Selected Colors</label>
                          <p className="text-sm text-slate-900">{paper.selectedColors || 'N/A'}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Finishing Details */}
            {selectedQuote?.finishing && selectedQuote.finishing.length > 0 && (
              <div className="bg-purple-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-slate-900 mb-3">Finishing Options</h3>
                <div className="space-y-2">
                  {selectedQuote.finishing.map((finish: any, index: number) => (
                    <div key={index} className="bg-white p-3 rounded border flex justify-between items-center">
                      <span className="text-sm font-medium text-slate-900">{finish.name || 'Standard Finishing'}</span>
                      <span className="text-sm text-slate-700">AED {finish.cost || '0.00'}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Pricing Information */}
            <div className="bg-emerald-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-slate-900 mb-3">Pricing Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-600">Base Amount</label>
                  <p className="text-lg font-semibold text-slate-900">
                    AED {(() => {
                      if (selectedQuote?.amounts && Array.isArray(selectedQuote.amounts) && selectedQuote.amounts.length > 0) {
                        return selectedQuote.amounts[0]?.base?.toFixed(2) || '0.00';
                      } else if (selectedQuote?.amounts?.base) {
                        return selectedQuote.amounts.base.toFixed(2);
                      }
                      return '0.00';
                    })()}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-600">VAT (5%)</label>
                  <p className="text-lg font-semibold text-slate-900">
                    AED {(() => {
                      if (selectedQuote?.amounts && Array.isArray(selectedQuote.amounts) && selectedQuote.amounts.length > 0) {
                        return selectedQuote.amounts[0]?.vat?.toFixed(2) || '0.00';
                      } else if (selectedQuote?.amounts?.vat) {
                        return selectedQuote.amounts.vat.toFixed(2);
                      }
                      return '0.00';
                    })()}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-600">Total Amount</label>
                  <p className="text-xl font-bold text-emerald-700">
                    AED {(() => {
                      if (selectedQuote?.amounts && Array.isArray(selectedQuote.amounts) && selectedQuote.amounts.length > 0) {
                        return selectedQuote.amounts[0]?.total?.toFixed(2) || '0.00';
                      } else if (selectedQuote?.amounts?.total) {
                        return selectedQuote.amounts.total.toFixed(2);
                      }
                      return '0.00';
                    })()}
                  </p>
                </div>
              </div>
            </div>

            {/* Discounts & Margins */}
            {(selectedQuote?.discountPercentage || selectedQuote?.discountAmount || selectedQuote?.marginPercentage || selectedQuote?.marginAmount) && (
              <div className="bg-indigo-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-slate-900 mb-3">Discounts & Margins</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-slate-600">Discount Percentage</label>
                    <p className="text-base font-semibold text-slate-900">
                      {selectedQuote?.discountPercentage ? `${selectedQuote.discountPercentage}%` : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-600">Discount Amount</label>
                    <p className="text-base font-semibold text-slate-900">
                      AED {selectedQuote?.discountAmount?.toFixed(2) || '0.00'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-600">Margin Percentage</label>
                    <p className="text-base font-semibold text-slate-900">
                      {selectedQuote?.marginPercentage ? `${selectedQuote.marginPercentage}%` : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-600">Margin Amount</label>
                    <p className="text-base font-semibold text-slate-900">
                      AED {selectedQuote?.marginAmount?.toFixed(2) || '0.00'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Approval Information */}
            {(selectedQuote?.requiresApproval || selectedQuote?.approvalStatus || selectedQuote?.approvedBy) && (
              <div className="bg-amber-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-slate-900 mb-3">Approval Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-slate-600">Requires Approval</label>
                    <p className="text-base text-slate-700">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        selectedQuote?.requiresApproval 
                          ? "bg-orange-100 text-orange-700"
                          : "bg-gray-100 text-gray-700"
                      }`}>
                        {selectedQuote?.requiresApproval ? 'Yes' : 'No'}
                      </span>
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-600">Approval Status</label>
                    <p className="text-base text-slate-700">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        selectedQuote?.approvalStatus === "Approved" 
                          ? "bg-green-100 text-green-700"
                          : selectedQuote?.approvalStatus === "Pending"
                          ? "bg-yellow-100 text-yellow-700"
                          : selectedQuote?.approvalStatus === "Rejected"
                          ? "bg-red-100 text-red-700"
                          : "bg-gray-100 text-gray-700"
                      }`}>
                        {selectedQuote?.approvalStatus || 'N/A'}
                      </span>
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-600">Approval Reason</label>
                    <p className="text-base text-slate-700">
                      {selectedQuote?.approvalReason || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-600">Approved By</label>
                    <p className="text-base text-slate-700">
                      {selectedQuote?.approvedBy || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-600">Approved At</label>
                    <p className="text-base text-slate-700">
                      {selectedQuote?.approvedAt ? formatDate(selectedQuote.approvedAt) : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-600">Approval Notes</label>
                    <p className="text-base text-slate-700">
                      {selectedQuote?.approvalNotes || 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Operational Details */}
            {selectedQuote?.QuoteOperational && (
              <div className="bg-teal-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-slate-900 mb-3">Operational Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-slate-600">Plates</label>
                    <p className="text-base font-semibold text-slate-900">
                      {selectedQuote.QuoteOperational.plates || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-600">Units</label>
                    <p className="text-base font-semibold text-slate-900">
                      {selectedQuote.QuoteOperational.units || 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Additional Information */}
            {(selectedQuote?.finishingComments || selectedQuote?.customerPdfEnabled || selectedQuote?.sendToCustomerEnabled) && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-slate-900 mb-3">Additional Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-slate-600">Finishing Comments</label>
                    <p className="text-base text-slate-700">
                      {selectedQuote?.finishingComments || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-600">Customer PDF Enabled</label>
                    <p className="text-base text-slate-700">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        selectedQuote?.customerPdfEnabled 
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-700"
                      }`}>
                        {selectedQuote?.customerPdfEnabled ? 'Yes' : 'No'}
                      </span>
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-600">Send to Customer Enabled</label>
                    <p className="text-base text-slate-700">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        selectedQuote?.sendToCustomerEnabled 
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-700"
                      }`}>
                        {selectedQuote?.sendToCustomerEnabled ? 'Yes' : 'No'}
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Staff Information */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-slate-900 mb-3">Staff Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-600">Created By</label>
                  <p className="text-base text-slate-700">
                    {selectedQuote?.user?.firstName && selectedQuote?.user?.lastName 
                      ? `${selectedQuote.user.firstName} ${selectedQuote.user.lastName}`
                      : selectedQuote?.user?.email || 'N/A'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-600">Sales Person</label>
                  <p className="text-base text-slate-700">
                    {selectedQuote?.user?.firstName && selectedQuote?.user?.lastName 
                      ? `${selectedQuote.user.firstName} ${selectedQuote.user.lastName}`
                      : selectedQuote?.user?.email || 'N/A'}
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-4 pt-4 border-t border-slate-200">
              <Button 
                variant="outline"
                onClick={() => {
                  // Store the quote reference before closing the view modal
                  const quoteToEdit = selectedQuote;
                  
                  // Close view modal first
                  setIsViewModalOpen(false);
                  
                  // Then open update modal with the stored quote reference
                  handleUpdateQuote(quoteToEdit);
                }}
                className="flex items-center space-x-2"
              >
                <Edit className="w-4 h-4" />
                <span>Edit Quote</span>
              </Button>
              {/* Download PDF Button - Hidden as requested */}
              {/* <Button 
                variant="outline"
                onClick={() => handleDownloadPDF(selectedQuote)}
                className="flex items-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>Download PDF</span>
              </Button> */}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  const UpdateQuoteModal = () => {
    return (
      <Dialog 
        open={isUpdateModalOpen} 
        onOpenChange={(open) => {
          if (!open) {
            // Only reset states when actually closing the modal
            setIsUpdateModalOpen(false);
            // Don't reset other states immediately to avoid race conditions
          }
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Update Quote - {selectedQuote?.quoteId}</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div>
              <label className="text-sm font-medium text-gray-600">Update Status</label>
              <Select 
                value={updateStatusValue} 
                onValueChange={(value) => {
                  console.log('Select value changed to:', value);
                  setUpdateStatusValue(value);
                }}
              >
                <SelectTrigger className="w-full mt-2">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Approved">Approved</SelectItem>
                  <SelectItem value="Rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-3">
              <Button 
                onClick={() => handleStatusUpdate(updateStatusValue)}
                disabled={!updateStatusValue || isUpdating}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUpdating ? 'Updating Status...' : updateStatusValue ? 'Apply Status Change' : 'Select Status First'}
              </Button>
              

              
              <Button 
                onClick={() => {
                  // Force close and reset all states
                  setIsUpdateModalOpen(false);
                  setUpdateStatusValue("");
                  setSelectedQuote(null);
                  setIsUpdating(false);
                  
                  // Navigate to step 2 customer detail choose
                  window.location.href = `/create-quote?step=2&edit=${selectedQuote?.quoteId}`;
                }}
                variant="outline"
                className="w-full flex items-center justify-center space-x-2 py-3"
                disabled={isUpdating}
              >
                <Edit className="w-4 h-4" />
                <span>Edit Quote Details</span>
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-3 xs:p-4 sm:p-6 lg:p-8">
      <style dangerouslySetInnerHTML={{
        __html: `
          .date-input::-webkit-calendar-picker-indicator {
            cursor: pointer !important;
            opacity: 1 !important;
            margin-left: 8px !important;
            font-size: 18px !important;
            background: none !important;
            color: #64748b !important;
            width: 20px !important;
            height: 20px !important;
          }
          .date-input::-webkit-calendar-picker-indicator:hover {
            opacity: 1 !important;
            color: #1e40af !important;
          }
          .date-input {
            background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke-width='1.5' stroke='%2364748b'%3e%3cpath stroke-linecap='round' stroke-linejoin='round' d='M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5'/%3e%3c/svg%3e") !important;
            background-repeat: no-repeat !important;
            background-position: right 12px center !important;
            background-size: 18px 18px !important;
            padding-right: 44px !important;
          }
          
          /* Mobile-specific date input improvements */
          @media (max-width: 1023px) {
            .date-input {
              background-position: right 12px center !important;
              padding-right: 44px !important;
              font-size: 14px !important;
              min-height: 44px !important; /* iOS recommended touch target */
              -webkit-tap-highlight-color: transparent !important;
            }
            .date-input::-webkit-calendar-picker-indicator {
              width: 22px !important;
              height: 22px !important;
              margin-left: 12px !important;
              cursor: pointer !important;
            }
            
            /* iPhone specific touch improvements */
            .date-input:active {
              background-color: #f8fafc !important;
            }
          }
          
          /* Extra small screens (5-inch phones: 320px-375px) */
          @media (max-width: 375px) {
            .date-input {
              background-position: right 8px center !important;
              padding-right: 36px !important;
              font-size: 12px !important;
              min-height: 40px !important;
            }
            .date-input::-webkit-calendar-picker-indicator {
              width: 18px !important;
              height: 18px !important;
              margin-left: 8px !important;
            }
            
            /* Extra small iPhone date range improvements */
            .mobile-filter-container .date-range-grid {
              gap: 0.25rem !important;
            }
            .mobile-filter-container .date-range-grid .date-input {
              font-size: 12px !important;
              padding: 0.375rem !important;
              min-height: 40px !important;
            }
            .mobile-filter-container .date-range-grid label {
              font-size: 10px !important;
              margin-bottom: 0.125rem !important;
            }
          }
          
          /* Small screens (6-inch phones: 375px-414px) */
          @media (min-width: 376px) and (max-width: 414px) {
            .date-input {
              background-position: right 10px center !important;
              padding-right: 40px !important;
              font-size: 13px !important;
              min-height: 42px !important;
            }
            .date-input::-webkit-calendar-picker-indicator {
              width: 20px !important;
              height: 20px !important;
              margin-left: 10px !important;
            }
            
            /* Small iPhone date range improvements */
            .mobile-filter-container .date-range-grid {
              gap: 0.375rem !important;
            }
            .mobile-filter-container .date-range-grid .date-input {
              font-size: 13px !important;
              padding: 0.5rem !important;
              min-height: 42px !important;
            }
            .mobile-filter-container .date-range-grid label {
              font-size: 11px !important;
              margin-bottom: 0.25rem !important;
            }
          }
          
          /* Medium screens (larger phones: 414px-480px) */
          @media (min-width: 415px) and (max-width: 480px) {
            .date-input {
              background-position: right 12px center !important;
              padding-right: 44px !important;
              font-size: 14px !important;
              min-height: 44px !important;
            }
            .date-input::-webkit-calendar-picker-indicator {
              width: 22px !important;
              height: 22px !important;
              margin-left: 12px !important;
            }
            
            /* Medium iPhone date range improvements */
            .mobile-filter-container .date-range-grid {
              gap: 0.5rem !important;
            }
            .mobile-filter-container .date-range-grid .date-input {
              font-size: 14px !important;
              padding: 0.5rem !important;
              min-height: 44px !important;
            }
            .mobile-filter-container .date-range-grid label {
              font-size: 12px !important;
              margin-bottom: 0.25rem !important;
            }
          }
          
          /* Force single column layout on all mobile devices, except for Amount and Date ranges */
          @media (max-width: 1023px) {
            .mobile-filter-container .grid:not(.amount-range-grid):not(.date-range-grid) {
              grid-template-columns: 1fr !important;
            }
            .mobile-filter-container .grid-cols-2:not(.amount-range-grid):not(.date-range-grid) {
              grid-template-columns: 1fr !important;
            }
            .mobile-filter-container .xs\\:grid-cols-2:not(.amount-range-grid):not(.date-range-grid) {
              grid-template-columns: 1fr !important;
            }
            .mobile-filter-container .sm\\:grid-cols-2:not(.amount-range-grid):not(.date-range-grid) {
              grid-template-columns: 1fr !important;
            }
            
            /* Ensure Amount Range and Date Range use two columns */
            .mobile-filter-container .amount-range-grid {
              grid-template-columns: 1fr 1fr !important;
              gap: 0.5rem !important;
            }
            .mobile-filter-container .date-range-grid {
              grid-template-columns: 1fr 1fr !important;
              gap: 0.5rem !important;
            }
            
            /* Ensure date inputs are properly sized and aligned */
            .mobile-filter-container .date-range-grid .date-input {
              width: 100% !important;
              min-width: 0 !important;
              flex: 1 !important;
              font-size: 14px !important;
              padding: 0.5rem !important;
            }
            
            .mobile-filter-container .date-range-grid > div {
              display: flex !important;
              flex-direction: column !important;
              min-width: 0 !important;
            }
            
            /* iPhone specific improvements */
            .mobile-filter-container .date-range-grid label {
              font-size: 12px !important;
              margin-bottom: 0.25rem !important;
              font-weight: 500 !important;
            }
          }
          
          /* iPhone Safari specific fixes */
          @media screen and (-webkit-min-device-pixel-ratio: 0) and (max-width: 1023px) {
            .mobile-filter-container {
              display: flex !important;
              flex-direction: column !important;
            }
            .mobile-filter-container .grid:not(.amount-range-grid):not(.date-range-grid) {
              grid-template-columns: 1fr !important;
            }
            .mobile-filter-container .grid-cols-2:not(.amount-range-grid):not(.date-range-grid) {
              grid-template-columns: 1fr !important;
            }
            .mobile-filter-container .xs\\:grid-cols-2:not(.amount-range-grid):not(.date-range-grid) {
              grid-template-columns: 1fr !important;
            }
            
            /* Ensure Amount Range and Date Range use two columns on Safari */
            .mobile-filter-container .amount-range-grid {
              grid-template-columns: 1fr 1fr !important;
              gap: 0.5rem !important;
            }
            .mobile-filter-container .date-range-grid {
              grid-template-columns: 1fr 1fr !important;
              gap: 0.5rem !important;
            }
            
            /* Safari-specific date input improvements */
            .mobile-filter-container .date-range-grid .date-input {
              -webkit-appearance: none !important;
              border-radius: 0.5rem !important;
              border: 1px solid #cbd5e1 !important;
              padding: 0.5rem !important;
              font-size: 14px !important;
              background-color: white !important;
            }
            
            .mobile-filter-container .date-range-grid .date-input:focus {
              border-color: #3b82f6 !important;
              outline: none !important;
              box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1) !important;
            }
          }
          
          /* iPhone specific media queries */
          @media only screen 
            and (device-width: 375px) 
            and (device-height: 667px) 
            and (-webkit-device-pixel-ratio: 2) {
            .date-input {
              background-position: right 8px center !important;
              padding-right: 36px !important;
              font-size: 12px !important;
            }
            .date-input::-webkit-calendar-picker-indicator {
              width: 18px !important;
              height: 18px !important;
              margin-left: 8px !important;
            }
            
            /* iPhone 6/7/8 specific date range improvements */
            .mobile-filter-container .date-range-grid {
              gap: 0.375rem !important;
            }
            .mobile-filter-container .date-range-grid .date-input {
              font-size: 12px !important;
              padding: 0.375rem !important;
            }
            .mobile-filter-container .date-range-grid label {
              font-size: 11px !important;
              margin-bottom: 0.125rem !important;
            }
          }
          
          @media only screen 
            and (device-width: 414px) 
            and (device-height: 896px) 
            and (-webkit-device-pixel-ratio: 2) {
            .date-input {
              background-position: right 10px center !important;
              padding-right: 40px !important;
              font-size: 13px !important;
            }
            .date-input::-webkit-calendar-picker-indicator {
              width: 20px !important;
              height: 20px !important;
              margin-left: 10px !important;
            }
            
            /* iPhone XR/11 specific date range improvements */
            .mobile-filter-container .date-range-grid {
              gap: 0.5rem !important;
            }
            .mobile-filter-container .date-range-grid .date-input {
              font-size: 13px !important;
              padding: 0.5rem !important;
            }
            .mobile-filter-container .date-range-grid label {
              font-size: 12px !important;
              margin-bottom: 0.25rem !important;
            }
          }
          
          /* iPhone 15 (393px × 852px) */
          @media only screen 
            and (device-width: 393px) 
            and (device-height: 852px) 
            and (-webkit-device-pixel-ratio: 3) {
            .date-input {
              background-position: right 12px center !important;
              padding-right: 44px !important;
              font-size: 14px !important;
            }
            .date-input::-webkit-calendar-picker-indicator {
              width: 22px !important;
              height: 22px !important;
              margin-left: 12px !important;
            }
            
            /* iPhone 15 specific date range improvements */
            .mobile-filter-container .date-range-grid {
              gap: 0.5rem !important;
            }
            .mobile-filter-container .date-range-grid .date-input {
              font-size: 14px !important;
              padding: 0.5rem !important;
            }
            .mobile-filter-container .date-range-grid label {
              font-size: 12px !important;
              margin-bottom: 0.25rem !important;
            }
          }
          
          /* iPhone 15 Plus (428px × 926px) */
          @media only screen 
            and (device-width: 428px) 
            and (device-height: 926px) 
            and (-webkit-device-pixel-ratio: 3) {
            .date-input {
              background-position: right 12px center !important;
              padding-right: 44px !important;
              font-size: 14px !important;
            }
            .date-input::-webkit-calendar-picker-indicator {
              width: 22px !important;
              height: 22px !important;
              margin-left: 12px !important;
            }
          }
          
          /* iPhone 15 Pro (393px × 852px) */
          @media only screen 
            and (device-width: 393px) 
            and (device-height: 852px) 
            and (-webkit-device-pixel-ratio: 3) {
            .date-input {
              background-position: right 12px center !important;
              padding-right: 44px !important;
              font-size: 14px !important;
            }
            .date-input::-webkit-calendar-picker-indicator {
              width: 22px !important;
              height: 22px !important;
              margin-left: 12px !important;
            }
          }
          
          /* iPhone 15 Pro Max (430px × 932px) */
          @media only screen 
            and (device-width: 430px) 
            and (device-height: 932px) 
            and (-webkit-device-pixel-ratio: 3) {
            .date-input {
              background-position: right 12px center !important;
              padding-right: 44px !important;
              font-size: 14px !important;
            }
            .date-input::-webkit-calendar-picker-indicator {
              width: 22px !important;
              height: 22px !important;
              margin-left: 12px !important;
            }
          }
          
          /* iPhone 16 (393px × 852px) */
          @media only screen 
            and (device-width: 393px) 
            and (device-height: 852px) 
            and (-webkit-device-pixel-ratio: 3) {
            .date-input {
              background-position: right 12px center !important;
              padding-right: 44px !important;
              font-size: 14px !important;
            }
            .date-input::-webkit-calendar-picker-indicator {
              width: 22px !important;
              height: 22px !important;
              margin-left: 12px !important;
            }
          }
          
          /* iPhone 16 Plus (428px × 926px) */
          @media only screen 
            and (device-width: 428px) 
            and (device-height: 926px) 
            and (-webkit-device-pixel-ratio: 3) {
            .date-input {
              background-position: right 12px center !important;
              padding-right: 44px !important;
              font-size: 14px !important;
            }
            .date-input::-webkit-calendar-picker-indicator {
              width: 22px !important;
              height: 22px !important;
              margin-left: 12px !important;
            }
          }
          
          /* iPhone 16 Pro (393px × 852px) */
          @media only screen 
            and (device-width: 393px) 
            and (device-height: 852px) 
            and (-webkit-device-pixel-ratio: 3) {
            .date-input {
              background-position: right 12px center !important;
              padding-right: 44px !important;
              font-size: 14px !important;
            }
            .date-input::-webkit-calendar-picker-indicator {
              width: 22px !important;
              height: 22px !important;
              margin-left: 12px !important;
            }
          }
          
          /* iPhone 16 Pro Max (430px × 932px) */
          @media only screen 
            and (device-width: 430px) 
            and (device-height: 932px) 
            and (-webkit-device-pixel-ratio: 3) {
            .date-input {
              background-position: right 12px center !important;
              padding-right: 44px !important;
              font-size: 14px !important;
            }
            .date-input::-webkit-calendar-picker-indicator {
              width: 22px !important;
              height: 22px !important;
              margin-left: 12px !important;
            }
          }
          
          /* Tablet Orientation-based Responsive Design */
          @media (min-width: 768px) and (max-width: 1024px) {
            /* Portrait mode - use EXACT mobile layout */
            @media (orientation: portrait) {
              .tablet-landscape\\:grid-cols-4 {
                grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
              }
              .tablet-landscape\\:lg\\:hidden {
                display: block !important;
              }
              .tablet-landscape\\:lg\\:flex {
                display: none !important;
              }
              .tablet-landscape\\:lg\\:block {
                display: none !important;
              }
              
              /* Force mobile spacing in portrait mode */
              .mobile-filter-container {
                display: flex !important;
                flex-direction: column !important;
              }
              
              /* Add proper top margin for portrait mode to avoid header overlap */
              .mt-4,
              .sm\\:mt-6,
              .md\\:mt-8 {
                margin-top: 8rem !important;
              }
            }
            
            /* Landscape mode - use desktop layout */
            @media (orientation: landscape) {
              .tablet-landscape\\:grid-cols-4 {
                grid-template-columns: repeat(4, minmax(0, 1fr)) !important;
              }
              .tablet-landscape\\:lg\\:hidden {
                display: none !important;
              }
              .tablet-landscape\\:lg\\:flex {
                display: flex !important;
              }
              .tablet-landscape\\:lg\\:block {
                display: block !important;
              }
              
              /* Fix horizontal scrolling for smaller landscape tablets */
              /* Reduce gaps and padding for compact fit */
              .gap-3 {
                gap: 0.5rem !important;
              }
              .gap-4 {
                gap: 0.5rem !important;
              }
              .gap-6 {
                gap: 0.75rem !important;
              }
              .gap-8 {
                gap: 1rem !important;
              }
              .gap-10 {
                gap: 1rem !important;
              }
              .gap-12 {
                gap: 1rem !important;
              }
              
              /* Make filter elements more compact */
              .flex-1 {
                min-width: 0 !important;
              }
              
              /* Reduce table column widths */
              .w-36 {
                width: 5rem !important;
              }
              .w-28 {
                width: 4rem !important;
              }
              .w-20 {
                width: 3rem !important;
              }
              .w-32 {
                width: 4.5rem !important;
              }
              
              /* iPad Mini Landscape - Force 2-line filter layout */
              @media (min-width: 1024px) and (max-width: 1024px) and (orientation: landscape) {
                /* Target the specific filter container */
                .ipad-filter-container {
                  flex-wrap: wrap !important;
                  height: auto !important;
                }
                
                /* Remove min-width constraints - use attribute selectors */
                .ipad-filter-container [class*="min-w-"] {
                  min-width: 0 !important;
                }
                
                /* First row: Keyword, Date From, Date To */
                .ipad-filter-container > div:nth-child(1),
                .ipad-filter-container > div:nth-child(2),
                .ipad-filter-container > div:nth-child(3) {
                  flex: 0 0 32% !important;
                  margin-bottom: 0.5rem !important;
                }
                
                /* Second row: Status, Amount Range, Clear Filters, Create Quote */
                .ipad-filter-container > div:nth-child(4),
                .ipad-filter-container > div:nth-child(5),
                .ipad-filter-container > div:nth-child(6),
                .ipad-filter-container > div:nth-child(7) {
                  flex: 0 0 24% !important;
                }
              }
              
              /* iPad Air Landscape - Apply same 2-line filter layout */
              @media (min-width: 1180px) and (max-width: 1180px) and (orientation: landscape) {
                /* Target the specific filter container */
                .ipad-filter-container {
                  flex-wrap: wrap !important;
                  height: auto !important;
                }
                
                /* Remove min-width constraints - use attribute selectors */
                .ipad-filter-container [class*="min-w-"] {
                  min-width: 0 !important;
                }
                
                /* First row: Keyword, Date From, Date To */
                .ipad-filter-container > div:nth-child(1),
                .ipad-filter-container > div:nth-child(2),
                .ipad-filter-container > div:nth-child(3) {
                  flex: 0 0 32% !important;
                  margin-bottom: 0.5rem !important;
                }
                
                /* Second row: Status, Amount Range, Clear Filters, Create Quote */
                .ipad-filter-container > div:nth-child(4),
                .ipad-filter-container > div:nth-child(5),
                .ipad-filter-container > div:nth-child(6),
                .ipad-filter-container > div:nth-child(7) {
                  flex: 0 0 24% !important;
                }
              }
              
              /* Desktop - Ensure single line layout is preserved */
              @media (min-width: 1301px) {
                .ipad-filter-container {
                  flex-wrap: nowrap !important;
                }
                
                .ipad-filter-container [class*="min-w-"] {
                  min-width: inherit !important;
                }
                
                .ipad-filter-container > div {
                  flex: inherit !important;
                  margin-bottom: 0 !important;
                }
              }
            }
          }
        `
      }} />
      <div className="max-w-7xl mx-auto space-y-4 xs:space-y-6 sm:space-y-8 lg:space-y-12">
        {/* Success Message */}
        {showSuccessMessage && (
          <div className="fixed top-4 right-4 z-[9999] bg-green-500 text-white px-4 sm:px-6 py-3 rounded-lg shadow-lg max-w-sm sm:max-w-md">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm sm:text-base">{successMessage}</span>
            </div>
          </div>
        )}


        {/* Metric Cards - Now Clickable - Responsive for all mobile and tablet sizes */}
        <div className="mt-4 sm:mt-6 md:mt-8 lg:mt-10 xl:mt-12 grid grid-cols-2 lg:grid-cols-4 tablet-landscape:grid-cols-4 gap-3 xs:gap-4 sm:gap-6 md:gap-8 lg:gap-10 xl:gap-12">
          {metricCards.map((metric, index) => {
            const IconComponent = metric.icon;
            const isActive = statusFilter === metric.filterValue;
            return (
              <Card 
                key={index} 
                className={`bg-white border border-[#27aae1]/20 hover:border-[#27aae1]/40 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer ${
                  isActive ? 'ring-2 ring-[#27aae1] ring-opacity-50 border-[#27aae1]' : ''
                }`}
                onClick={() => handleCardClick(metric.filterValue)}
              >
                <CardContent className="p-3 xs:p-4 sm:p-6 md:p-7 lg:p-8 xl:p-10">
                  <div className="flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs xs:text-sm md:text-base lg:text-lg font-medium text-slate-600 mb-1 xs:mb-2 md:mb-3 lg:mb-4 truncate">{metric.title}</p>
                      <p className="text-lg xs:text-xl sm:text-2xl md:text-2xl lg:text-3xl xl:text-4xl font-bold text-slate-900 truncate">{metric.value}</p>
                    </div>
                    <div className={`w-8 h-8 xs:w-10 xs:h-10 sm:w-12 sm:h-12 md:w-13 md:h-13 lg:w-14 lg:h-14 xl:w-16 xl:h-16 rounded-xl ${metric.color} flex items-center justify-center flex-shrink-0 shadow-sm ml-2`}>
                      <IconComponent className={`w-4 h-4 xs:w-5 xs:h-5 sm:w-6 sm:h-6 md:w-6 md:h-6 lg:w-7 lg:h-7 xl:w-8 xl:h-8 ${metric.iconColor}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Filters and Create Quote Button */}
        <div className="space-y-3 sm:space-y-4">
          {/* Mobile Layout - Portrait mode for tablets */}
          <div className="lg:hidden tablet-landscape:lg:hidden space-y-3 sm:space-y-4 md:space-y-5 lg:space-y-6 mobile-filter-container">
            {/* Search Bar - Full Width */}
            <div className="w-full">
              <label className="text-xs sm:text-sm md:text-base lg:text-lg font-medium text-slate-700 mb-1 sm:mb-2 md:mb-3 lg:mb-4 block">Search</label>
              <Input
                placeholder="Search quotes, clients, products..."
                value={keywordFilter}
                onChange={(e) => setKeywordFilter(e.target.value)}
                className="border-slate-300 focus:border-blue-500 focus:ring-blue-500 rounded-lg h-9 sm:h-10 md:h-11 lg:h-12 text-xs sm:text-sm md:text-base lg:text-lg px-2 sm:px-3 md:px-4 lg:px-5"
              />
            </div>

            {/* Filter Row 1: Status and Amount Range - Side by side */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
              {/* Status Filter - Left side */}
              <div>
                <label className="text-xs sm:text-sm md:text-base lg:text-lg font-medium text-slate-700 mb-1 sm:mb-2 md:mb-3 lg:mb-4 block">Status</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="border-slate-300 focus:border-blue-500 focus:ring-blue-500 rounded-lg h-9 sm:h-10 md:h-11 text-xs sm:text-sm md:text-base px-2 sm:px-3 md:px-4">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    <SelectItem value="All">All Status</SelectItem>
                    <SelectItem value="Approved">Approved</SelectItem>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="Rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Amount Range - Right side */}
              <div>
                <label className="text-xs sm:text-sm md:text-base font-medium text-slate-700 mb-1 sm:mb-2 md:mb-3 block">Amount Range</label>
                <div className="grid grid-cols-2 gap-2 sm:gap-3 md:gap-4 amount-range-grid">
                  <div>
                    <label className="text-xs sm:text-sm md:text-base font-medium text-slate-500 mb-1 md:mb-2 block">Min</label>
                    <Input
                      type="number"
                      placeholder="Min"
                      value={minAmount}
                      onChange={(e) => setMinAmount(e.target.value)}
                      className="border-slate-300 focus:border-blue-500 focus:ring-blue-500 rounded-lg h-9 sm:h-10 md:h-11 lg:h-12 text-xs sm:text-sm md:text-base lg:text-lg px-2 sm:px-3 md:px-4 lg:px-5"
                    />
                  </div>
                  <div>
                    <label className="text-xs sm:text-sm md:text-base font-medium text-slate-500 mb-1 md:mb-2 block">Max</label>
                    <Input
                      type="number"
                      placeholder="Max"
                      value={maxAmount}
                      onChange={(e) => setMaxAmount(e.target.value)}
                      className="border-slate-300 focus:border-blue-500 focus:ring-blue-500 rounded-lg h-9 sm:h-10 md:h-11 lg:h-12 text-xs sm:text-sm md:text-base lg:text-lg px-2 sm:px-3 md:px-4 lg:px-5"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Filter Row 3: Date Range - Two columns side by side */}
            <div>
              <label className="text-xs sm:text-sm md:text-base font-medium text-slate-700 mb-1 sm:mb-2 md:mb-3 block">Date Range</label>
              <div className="grid grid-cols-2 gap-2 sm:gap-3 md:gap-4 date-range-grid">
                <div className="flex flex-col min-w-0">
                  <label className="text-xs sm:text-sm md:text-base font-medium text-slate-600 mb-1 sm:mb-2 md:mb-3 block">From</label>
                  <Input
                    type="date"
                    value={from}
                    onChange={(e) => setFrom(e.target.value)}
                    className="border-slate-300 focus:border-blue-500 focus:ring-blue-500 rounded-lg h-9 sm:h-10 md:h-11 lg:h-12 text-xs sm:text-sm md:text-base lg:text-lg date-input px-2 sm:px-3 md:px-4 lg:px-5 w-full min-w-0"
                  />
                </div>
                <div className="flex flex-col min-w-0">
                  <label className="text-xs sm:text-sm md:text-base font-medium text-slate-600 mb-1 sm:mb-2 md:mb-3 block">To</label>
                  <Input
                    type="date"
                    value={to}
                    onChange={(e) => setTo(e.target.value)}
                    className="border-slate-300 focus:border-blue-500 focus:ring-blue-500 rounded-lg h-9 sm:h-10 md:h-11 lg:h-12 text-xs sm:text-sm md:text-base lg:text-lg date-input px-2 sm:px-3 md:px-4 lg:px-5 w-full min-w-0"
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons - Responsive sizing */}
            <div className="grid grid-cols-1 gap-2 sm:gap-3 pt-1 sm:pt-2">
              <Button 
                onClick={clearAllFilters}
                variant="outline"
                className="border-slate-300 text-slate-600 hover:bg-slate-50 px-3 sm:px-4 py-2 rounded-lg font-medium shadow-sm hover:shadow-md transition-all duration-200 h-9 sm:h-10 text-xs sm:text-sm"
              >
                <Filter className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                Clear Filters
              </Button>
              
              <Link href="/create-quote" className="block">
                <Button 
                  className="bg-[#27aae1] hover:bg-[#1e8bc3] text-white px-3 sm:px-4 py-2 rounded-lg font-medium shadow-md hover:shadow-lg transition-all duration-200 h-9 sm:h-10 text-xs sm:text-sm w-full"
                >
                  <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  New Quote
                </Button>
              </Link>
            </div>
          </div>

          {/* Desktop Layout - Landscape mode for tablets */}
          <div 
            className="hidden lg:flex lg:flex-nowrap tablet-landscape:lg:flex tablet-landscape:lg:flex-nowrap gap-2 items-end ipad-filter-container"
            style={isIpadLandscape ? {
              flexWrap: 'wrap',
              height: 'auto'
            } : {}}
          >
          {/* Keyword Filter */}
          <div 
            className="flex-1 min-w-[200px]"
            style={isIpadLandscape ? {
              minWidth: '0',
              flex: '0 0 32%',
              marginBottom: '0.5rem'
            } : {}}
          >
            <label className="text-xs font-medium text-slate-600 mb-1 block">Keyword</label>
            <Input
              placeholder="Search..."
              value={keywordFilter}
              onChange={(e) => setKeywordFilter(e.target.value)}
              className="border-slate-300 focus:border-blue-500 focus:ring-blue-500 rounded-lg h-9 text-sm"
            />
          </div>

          {/* Date Range */}
          <div 
            className="min-w-[140px]"
            style={isIpadLandscape ? {
              minWidth: '0',
              flex: '0 0 32%',
              marginBottom: '0.5rem'
            } : {}}
          >
            <label className="text-xs font-medium text-slate-800 mb-1 block">From</label>
            <Input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="border-slate-300 focus:border-blue-500 focus:ring-blue-500 rounded-lg h-9 text-sm date-input"
            />
          </div>
          
          <div 
            className="min-w-[140px]"
            style={isIpadLandscape ? {
              minWidth: '0',
              flex: '0 0 32%',
              marginBottom: '0.5rem'
            } : {}}
          >
            <label className="text-xs font-medium text-slate-600 mb-1 block">To</label>
            <Input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="border-slate-300 focus:border-blue-500 focus:ring-blue-500 rounded-lg h-9 text-sm date-input"
            />
          </div>
          
          {/* Status Filter */}
          <div 
            className="min-w-[120px]"
            style={isIpadLandscape ? {
              minWidth: '0',
              flex: '0 0 24%'
            } : {}}
          >
            <label className="text-xs font-medium text-slate-600 mb-1 block">Status</label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="border-slate-300 focus:border-blue-500 focus:ring-blue-500 rounded-lg h-9 text-sm">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                <SelectItem value="All">All</SelectItem>
                <SelectItem value="Approved">Approved</SelectItem>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="Rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Amount Range */}
          <div 
            className="min-w-[160px]"
            style={isIpadLandscape ? {
              minWidth: '0',
              flex: '0 0 24%'
            } : {}}
          >
            <label className="text-xs font-medium text-slate-600 mb-1 block">Amount</label>
            <div className="grid grid-cols-2 gap-1">
              <Input
                type="number"
                placeholder="Min"
                value={minAmount}
                onChange={(e) => setMinAmount(e.target.value)}
                className="border-slate-300 focus:border-blue-500 focus:ring-blue-500 rounded-lg h-9 text-xs"
              />
              <Input
                type="number"
                placeholder="Max"
                value={maxAmount}
                onChange={(e) => setMaxAmount(e.target.value)}
                className="border-slate-300 focus:border-blue-500 focus:ring-blue-500 rounded-lg h-9 text-xs"
              />
            </div>
          </div>

          {/* Clear Filters Button */}
          <div 
            className="min-w-[120px]"
            style={isIpadLandscape ? {
              minWidth: '0',
              flex: '0 0 24%'
            } : {}}
          >
            <label className="text-xs font-medium text-slate-600 mb-1 block opacity-0">Clear</label>
            <Button 
              onClick={clearAllFilters}
              variant="outline"
              className="border-slate-300 text-slate-600 hover:bg-slate-50 px-3 py-2 rounded-lg font-medium shadow-sm hover:shadow-md transition-all duration-200 h-9 text-sm whitespace-nowrap w-full"
            >
              <Filter className="h-4 w-4 mr-1" />
              Clear Filters
            </Button>
          </div>

          {/* Create New Quote Button */}
          <div 
            className="min-w-[160px]"
            style={isIpadLandscape ? {
              minWidth: '0',
              flex: '0 0 24%'
            } : {}}
          >
            <label className="text-xs font-medium text-slate-600 mb-1 block opacity-0">Create</label>
            <Link href="/create-quote" className="block w-full">
              <Button 
                className="bg-[#27aae1] hover:bg-[#1e8bc3] text-white px-4 py-2 rounded-lg font-medium shadow-md hover:shadow-lg transition-all duration-200 h-9 text-sm whitespace-nowrap w-full"
              >
                <Plus className="h-4 w-4 mr-1" />
                Create New Quote
              </Button>
            </Link>
            </div>
          </div>
        </div>

        {/* Recent Quotations Section */}
        <div className="space-y-6 sm:space-y-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900">Recent Quotations</h2>
          </div>

          {/* Quotations Table - Mobile Responsive */}
          <Card className="border-0 shadow-lg">
            <CardContent className="p-0">
              {/* Desktop Table - Landscape mode for tablets */}
              <div className="hidden lg:block tablet-landscape:lg:block overflow-x-auto">
                <table className="w-full table-fixed" style={{ tableLayout: 'fixed' }}>
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50">
                      <th className="text-left p-4 font-semibold text-slate-700 w-36">Quote ID</th>
                      <th className="text-left p-4 font-semibold text-slate-700 w-36">Client Name</th>
                      <th className="text-left p-4 font-semibold text-slate-700 w-36">Product</th>
                      <th className="text-left p-4 font-semibold text-slate-700 w-28">Date</th>
                      <th className="text-left p-4 font-semibold text-slate-700 w-28">Amount</th>
                      <th className="text-left p-4 font-semibold text-slate-700 w-20">Status</th>
                      <th className="text-left p-4 font-semibold text-slate-700 w-32">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading ? (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-slate-500">
                          <div className="flex items-center justify-center space-x-2">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#27aae1]"></div>
                            <span>Loading quotes...</span>
                          </div>
                        </td>
                      </tr>
                    ) : filteredQuotes.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-slate-500">
                          No quotes found. {statusFilter !== "All" && `No quotes with status "${statusFilter}".`}
                        </td>
                      </tr>
                    ) : (
                      paginatedQuotes.map((quote: any, index: number) => (
                      <tr key={`${quote.id}-${quote.status}`} className="border-b border-slate-100 hover:bg-slate-50 transition-colors duration-200">
                        <td className="p-4 w-36">
                          <div className="truncate">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                              {quote.quoteId}
                            </span>
                          </div>
                        </td>
                        <td className="p-4 w-36">
                          <div className="truncate">
                            <div className="flex items-center space-x-3">
                              <span className="font-medium text-slate-900">{quote.customerName}</span>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 w-36">
                          <div className="truncate">
                            <div className="flex items-center space-x-2">
                              <span className="text-slate-700">{quote.product || 'N/A'}</span>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 w-28">
                          <div className="truncate">
                            <div className="flex items-center space-x-2">
                              <span className="text-slate-700">{formatDate(quote.createdDate)}</span>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 w-28">
                          <div className="truncate">
                            <span className="font-semibold text-slate-900">AED {isNaN(quote.totalAmount) ? '0.00' : (quote.totalAmount || 0).toFixed(2)}</span>
                          </div>
                        </td>
                        <td className="p-4 w-20">
                          <div className="truncate">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              quote.status === "Approved" 
                                ? "bg-emerald-100 text-emerald-700"
                                : quote.status === "Pending"
                                ? "bg-amber-100 text-amber-700"
                                : "bg-rose-100 text-rose-700"
                            }`}>
                              {quote.status}
                            </span>
                          </div>
                        </td>
                        <td className="p-4 w-32">
                          <div className="truncate">
                            <div className="flex items-center space-x-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleViewQuote(quote)}
                                className="p-2 hover:bg-[#27aae1]/10 text-[#27aae1] rounded-lg transition-colors duration-200"
                                title="View Quote"
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleUpdateQuote(quote)}
                                className="p-2 hover:bg-[#ea078b]/10 text-[#ea078b] rounded-lg transition-colors duration-200"
                                title="Edit Quote"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              {/* Download button hidden as requested */}
                              {/* <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDownloadPDF(quote)}
                                className="p-2 hover:bg-[#f89d1d]/10 text-[#f89d1d] rounded-lg transition-colors duration-200 download-btn"
                                title="Download PDF"
                                data-quote-id={quote.id}
                              >
                                <Download className="w-4 h-4" />
                              </Button> */}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards - Portrait mode for tablets */}
              <div className="lg:hidden tablet-landscape:lg:hidden space-y-3 xs:space-y-4 p-3 xs:p-4">
                {isLoading ? (
                  <div className="text-center py-16 text-slate-500">
                    <div className="flex items-center justify-center space-x-2">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#27aae1]"></div>
                      <span>Loading quotes...</span>
                    </div>
                  </div>
                ) : filteredQuotes.length === 0 ? (
                  <div className="text-center py-16 text-slate-500">
                    No quotes found. {statusFilter !== "All" && `No quotes with status "${statusFilter}".`}
                  </div>
                ) : (
                  paginatedQuotes.map((quote: any, index: number) => (
                    <Card key={`${quote.id}-${quote.status}`} className="p-4 border-slate-200">
                      <div className="space-y-3">
                        {/* Header with Quote ID and Status */}
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-sm font-medium text-slate-900 bg-slate-100 px-2 py-1 rounded">
                            {quote.quoteId}
                          </span>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            quote.status === "Pending" 
                              ? "bg-amber-100 text-amber-700"
                              : quote.status === "Approved"
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-rose-100 text-rose-700"
                          }`}>
                            {quote.status}
                          </span>
                        </div>
                        
                        {/* Client Info */}
                        <div className="flex items-center space-x-3">
                          <div>
                            <div className="font-medium text-slate-900">{quote.customerName}</div>
                            <div className="text-sm text-slate-500">Client</div>
                          </div>
                        </div>
                        
                        {/* Product Info */}
                        <div className="flex items-center space-x-3">
                          <div>
                            <div className="font-medium text-slate-900">{quote.product || 'N/A'}</div>
                            <div className="text-sm text-slate-500">Product</div>
                          </div>
                        </div>
                        
                        {/* Date and Amount */}
                        <div className="grid grid-cols-2 gap-4">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-slate-700">{formatDate(quote.createdDate)}</span>
                          </div>
                          <div>
                            <span className="text-sm text-slate-500">Amount:</span>
                            <div className="font-semibold text-slate-900">AED {isNaN(quote.totalAmount) ? '0.00' : (quote.totalAmount || 0).toFixed(2)}</div>
                          </div>
                        </div>
                        
                        {/* Actions */}
                        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewQuote(quote)}
                              className="text-blue-600 border-blue-200 hover:bg-blue-50"
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              View
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleUpdateQuote(quote)}
                              className="text-blue-600 border-blue-200 hover:bg-blue-50"
                            >
                              <Edit className="w-4 h-4 mr-1" />
                              Edit
                            </Button>
                            {/* Download button hidden as requested */}
                            {/* <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDownloadPDF(quote)}
                              className="text-blue-600 border-blue-200 hover:bg-blue-50 download-btn"
                              data-quote-id={quote.id}
                            >
                              <Download className="w-4 h-4 mr-1" />
                              PDF
                            </Button> */}
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Pagination Controls */}
          {filteredQuotes.length > itemsPerPage && (
            <div className="flex items-center justify-between mt-6 px-4">
              <div className="text-sm text-slate-600">
                Showing {startIndex + 1} to {Math.min(endIndex, filteredQuotes.length)} of {filteredQuotes.length} quotes
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="flex items-center space-x-1"
                >
                  <span>Previous</span>
                </Button>
                
                <div className="flex items-center space-x-1">
                  <span className="text-sm text-slate-600">Page</span>
                  <span className="text-sm font-medium text-slate-900">{currentPage}</span>
                  <span className="text-sm text-slate-600">of</span>
                  <span className="text-sm font-medium text-slate-900">{totalPages}</span>
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="flex items-center space-x-1"
                >
                  <span>Next</span>
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <ViewQuoteModal />
      <UpdateQuoteModal />

          </div>
    );
}