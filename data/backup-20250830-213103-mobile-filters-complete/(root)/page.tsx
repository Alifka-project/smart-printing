"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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


// Motivational quotes collection
const motivationalQuotes = [
  "Success is not final, failure is not fatal: it is the courage to continue that counts. - Winston Churchill",
  "The only way to do great work is to love what you do. - Steve Jobs",
  "Innovation distinguishes between a leader and a follower. - Steve Jobs",
  "Quality is not an act, it is a habit. - Aristotle",
  "The future belongs to those who believe in the beauty of their dreams. - Eleanor Roosevelt",
  "Excellence is never an accident. It is always the result of high intention, sincere effort, and intelligent execution. - Aristotle",
  "Success usually comes to those who are too busy to be looking for it. - Henry David Thoreau",
  "The only limit to our realization of tomorrow will be our doubts of today. - Franklin D. Roosevelt",
  "What you get by achieving your goals is not as important as what you become by achieving your goals. - Zig Ziglar",
  "The way to get started is to quit talking and begin doing. - Walt Disney",
  "Don't watch the clock; do what it does. Keep going. - Sam Levenson",
  "The best way to predict the future is to create it. - Peter Drucker",
  "Success is walking from failure to failure with no loss of enthusiasm. - Winston Churchill",
  "Your work is going to fill a large part of your life, and the only way to be truly satisfied is to do what you believe is great work. - Steve Jobs",
  "The difference between ordinary and extraordinary is that little extra. - Jimmy Johnson"
];

export default function DashboardPage() {
  const [allQuotes, setAllQuotes] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [selectedQuote, setSelectedQuote] = useState<any>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [currentMotivationalQuote, setCurrentMotivationalQuote] = useState("");
  const [updateStatusValue, setUpdateStatusValue] = useState<string>("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<{ name: string; role: string } | null>({ name: "Demo User", role: "admin" });
  
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

  // Set initial quote and change it periodically
  useEffect(() => {
    // Function to get a random motivational quote
    const getRandomQuote = () => {
      const randomIndex = Math.floor(Math.random() * motivationalQuotes.length);
      return motivationalQuotes[randomIndex];
    };
    
    setCurrentMotivationalQuote(getRandomQuote());
    
    // Change quote every 45 seconds for variety
    const interval = setInterval(() => {
      setCurrentMotivationalQuote(getRandomQuote());
    }, 45000);

    return () => clearInterval(interval);
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

  // Filter quotes based on selected status - use useMemo for better performance
  const filteredQuotes = useMemo(() => {
    const filtered = statusFilter === "All" 
      ? allQuotes 
      : allQuotes.filter(q => q.status === statusFilter);
    
    // Sort by newest first (most recent createdDate first)
    const sorted = [...filtered].sort((a, b) => {
      const dateA = new Date(a.createdDate || a.date || 0);
      const dateB = new Date(b.createdDate || b.date || 0);
      return dateB.getTime() - dateA.getTime(); // Newest first
    });
    
    return sorted;
  }, [allQuotes, statusFilter]);

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
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Quote Details - {selectedQuote?.quoteId}</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-600">Client Name</label>
                <p className="text-lg font-semibold">{selectedQuote?.client?.contactPerson || selectedQuote?.client?.companyName}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Amount</label>
                <p className="text-lg font-semibold">
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
              <div>
                <label className="text-sm font-medium text-gray-600">Date Created</label>
                <p className="text-lg font-semibold">
                  {selectedQuote?.date ? formatDate(selectedQuote.date) : 'No date available'}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Status</label>
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
              <label className="text-sm font-medium text-gray-600">Products & Services</label>
              <div className="mt-2 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-700">
                  {selectedQuote?.product ? (
                    `• ${selectedQuote.product} - ${selectedQuote?.quantity || 0} units`
                  ) : (
                    "• No product details available"
                  )}
                </p>
              </div>
            </div>

            <div className="flex space-x-4">
              {/* Download button hidden */}
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
              >
                Edit Quote
              </Button>
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8 lg:space-y-12">
        {/* Success Message */}
        {showSuccessMessage && (
          <div className="fixed top-4 right-4 z-[9999] bg-green-500 text-white px-4 sm:px-6 py-3 rounded-lg shadow-lg max-w-sm sm:max-w-md">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm sm:text-base">{successMessage}</span>
            </div>
          </div>
        )}

        {/* Welcome Header */}
        <div className="text-center space-y-4 pb-6 border-b border-slate-200">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold bg-gradient-to-r from-[#27aae1] to-[#ea078b] bg-clip-text text-transparent">
            Welcome Back, {user?.name}
          </h1>
          <div className="max-w-4xl mx-auto px-4">
            <p className="text-base sm:text-lg lg:text-xl text-slate-600 italic leading-relaxed">
              "{currentMotivationalQuote.split(' - ')[0]}"
            </p>
            <p className="text-xs sm:text-sm lg:text-base text-slate-500 mt-1 font-medium">
              — {currentMotivationalQuote.split(' - ')[1]}
            </p>
          </div>
        </div>

        {/* Metric Cards - Now Clickable */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
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
                <CardContent className="p-4 sm:p-6 lg:p-8">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs sm:text-sm font-medium text-slate-600 mb-2">{metric.title}</p>
                      <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900">{metric.value}</p>
                    </div>
                    <div className={`w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 rounded-xl ${metric.color} flex items-center justify-center flex-shrink-0 shadow-sm`}>
                      <IconComponent className={`w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 ${metric.iconColor}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Recent Quotations Section */}
        <div className="space-y-6 sm:space-y-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900">Recent Quotations</h2>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
              {/* Status Filter Dropdown */}
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-auto bg-white border-slate-300 focus:border-[#ea078b] focus:ring-[#ea078b] rounded-xl">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  <SelectItem value="All">All Status</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Approved">Approved</SelectItem>
                  <SelectItem value="Rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
              
              <Link href="/create-quote" className="w-full sm:w-auto">
                <Button 
                  className="bg-[#27aae1] hover:bg-[#1e8bc3] text-white px-4 sm:px-6 py-2 sm:py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 w-full sm:w-auto"
                >
                  <Plus className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                  <span className="text-sm sm:text-base">Create a New Quote</span>
                </Button>
              </Link>
            </div>
          </div>

          {/* Quotations Table - Mobile Responsive */}
          <Card className="border-0 shadow-lg">
            <CardContent className="p-0">
              {/* Desktop Table */}
              <div className="hidden lg:block overflow-x-auto">
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
                      filteredQuotes.map((quote: any, index: number) => (
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
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDownloadPDF(quote)}
                                className="p-2 hover:bg-[#f89d1d]/10 text-[#f89d1d] rounded-lg transition-colors duration-200 download-btn"
                                title="Download PDF"
                                data-quote-id={quote.id}
                              >
                                <Download className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="lg:hidden space-y-4 p-4">
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
                  filteredQuotes.map((quote: any, index: number) => (
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
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDownloadPDF(quote)}
                              className="text-blue-600 border-blue-200 hover:bg-blue-50 download-btn"
                              data-quote-id={quote.id}
                            >
                              <Download className="w-4 h-4 mr-1" />
                              PDF
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modals */}
      <ViewQuoteModal />
      <UpdateQuoteModal />

          </div>
    );
}