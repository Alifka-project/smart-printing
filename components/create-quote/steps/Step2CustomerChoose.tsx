"use client";

import type { FC, Dispatch, SetStateAction } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Eye, Search, X, Edit, FileText, Calendar, DollarSign } from "lucide-react";
import { useState, useEffect } from "react";
import type { QuoteFormData } from "@/types";

interface Step2Props {
  formData: QuoteFormData;
  setFormData: Dispatch<SetStateAction<QuoteFormData>>;
  onCustomerSelect?: (customer: Customer) => void; // Add callback for customer selection
  onQuoteSelect?: (quote: Quote) => void; // Add callback for quote selection
}

// Real customer interface matching database structure
interface Customer {
  id: string;
  clientType?: string;
  companyName?: string;
  contactPerson: string;
  email: string;
  phone?: string;
  countryCode?: string;
  role?: string;
  // New address fields
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}

// Real quote interface matching database structure
interface Quote {
  id: string;
  quoteId: string;
  date: string;
  status: string;
  product: string;
  quantity: number;
  sides: "1" | "2";
  printing: string;
  colors?: string | { front?: string; back?: string }; // Can be JSON string or object
  
  // Enhanced Step 3 fields for product specifications
  productName?: string;
  printingSelection?: string;
  flatSizeWidth?: number;
  flatSizeHeight?: number;
  flatSizeSpine?: number;
  closeSizeWidth?: number;
  closeSizeHeight?: number;
  closeSizeSpine?: number;
  useSameAsFlat?: boolean;
  
  // Enhanced paper and finishing with operational data
  papers?: Array<{ 
    id: string; 
    name: string; 
    gsm: string; 
    quoteId: string;
    inputWidth?: number;
    inputHeight?: number;
    pricePerPacket?: number;
    pricePerSheet?: number;
    sheetsPerPacket?: number;
    recommendedSheets?: number;
    enteredSheets?: number;
    outputWidth?: number;
    outputHeight?: number;
    selectedColors?: string;
  }>;
  finishing?: Array<{ 
    id: string; 
    name: string; 
    quoteId: string;
    cost?: number;
  }>;
  
  // Client with enhanced address fields
  client: {
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
  };
  
  amounts?: {
    base?: number;
    vat?: number;
    total: number;
  };
  
  // Operational data
  operational?: {
    plates?: number;
    units?: number;
  };
}

const Step2CustomerChoose: FC<Step2Props> = ({ formData, setFormData, onCustomerSelect, onQuoteSelect }) => {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  
  // Separate state for view and edit modals
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [quoteForModal, setQuoteForModal] = useState<Quote | null>(null);
  const [editingQuote, setEditingQuote] = useState<Quote | null>(null); // New state for editing
  const [quoteItems, setQuoteItems] = useState<Quote[]>([]);
  const [loadingQuoteItems, setLoadingQuoteItems] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [showAll, setShowAll] = useState(false);
  const quotesPerPage = 10;

  // Fetch real quotes from database
  useEffect(() => {
    const fetchQuotes = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/quotes');
        if (response.ok) {
          const data = await response.json();
          console.log('Fetched quotes from database:', data);
          setQuotes(data);
        } else {
          console.error('Failed to fetch quotes');
          setQuotes([]);
        }
      } catch (error) {
        console.error('Error fetching quotes:', error);
        setQuotes([]);
      } finally {
        setLoading(false);
      }
    };

    fetchQuotes();
  }, []);

  const filteredQuotes = quotes.filter(quote =>
    (quote.client?.companyName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (quote.client?.contactPerson?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (quote.client?.email?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (quote.quoteId?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (quote.product?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  // Pagination calculations
  const totalPages = Math.ceil(filteredQuotes.length / quotesPerPage);
  const startIndex = (currentPage - 1) * quotesPerPage;
  const endIndex = startIndex + quotesPerPage;
  const currentQuotes = showAll ? filteredQuotes : filteredQuotes.slice(startIndex, endIndex);

  // Reset to first page when search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const handleQuoteSelect = (quoteId: string) => {
    const selected = quotes.find(q => q.id === quoteId);
    if (selected) {
      setSelectedQuote(selected);
      
      // Call the quote selection callback to inform parent about the selected quote
      if (onQuoteSelect) {
        console.log('Calling onQuoteSelect with quote:', selected);
        onQuoteSelect(selected);
      }
      
      // Also call the customer selection callback for backward compatibility
      if (onCustomerSelect && selected.client) {
        console.log('Calling onCustomerSelect with:', selected.client);
        onCustomerSelect(selected.client);
      }
    }
  };

  const handleViewQuote = async (quote: Quote, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setQuoteForModal(quote);
    setLoadingQuoteItems(true);
    setShowViewModal(true);
    
    try {
      // Fetch all quotes with the same quoteId to get all products for this quote
      const response = await fetch('/api/quotes');
      if (response.ok) {
        const allQuotes = await response.json();
        const relatedQuotes = allQuotes.filter((q: Quote) => q.quoteId === quote.quoteId);
        setQuoteItems(relatedQuotes);
      } else {
        console.error('Failed to fetch quote items');
        setQuoteItems([quote]); // Fallback to just the current quote
      }
    } catch (error) {
      console.error('Error fetching quote items:', error);
      setQuoteItems([quote]); // Fallback to just the current quote
    } finally {
      setLoadingQuoteItems(false);
    }
  };

  const handleEditQuote = (quote: Quote, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setQuoteForModal(quote);
    // Create a deep copy for editing
    setEditingQuote(JSON.parse(JSON.stringify(quote)));
    setShowEditModal(true);
  };

  // Function to update editing quote data
  const updateEditingQuote = (field: string, value: any, subField?: string) => {
    if (!editingQuote) return;
    
    setEditingQuote(prev => {
      if (!prev) return prev;
      
      if (subField) {
        // Handle nested fields like client.companyName
        const currentField = prev[field as keyof Quote] as any;
        if (currentField && typeof currentField === 'object') {
          return {
            ...prev,
            [field]: {
              ...currentField,
              [subField]: value
            }
          };
        }
      }
      
      // Handle direct fields
      return {
        ...prev,
        [field]: value
      };
    });
  };

  // Function to save changes
  const handleSaveChanges = async () => {
    if (!editingQuote) return;
    
    try {
      // Update the quote in the database
      const response = await fetch(`/api/quotes/${editingQuote.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editingQuote),
      });
      
      if (response.ok) {
        // Update local state
        setQuotes(prev => prev.map(q => q.id === editingQuote.id ? editingQuote : q));
        setQuoteForModal(editingQuote);
        
        // Close modal
        setShowEditModal(false);
        setEditingQuote(null);
        
        // Show success message (you can add a toast notification here)
        console.log('Quote updated successfully');
      } else {
        console.error('Failed to update quote');
      }
    } catch (error) {
      console.error('Error updating quote:', error);
    }
  };

  const isSelectionValid = selectedQuote !== null;

  return (
    <div className="space-y-6">
      {/* Page Title - Clear explanation of what we're selecting */}
      <div className="text-center">
        <h2 className="font-bold text-3xl text-gray-900">Select Quote Template</h2>
        <p className="text-gray-600 mt-2">Choose an existing quote to use as a template. The customer details and product specifications will be automatically filled in the next steps.</p>
      </div>

      {/* Select Existing Customer Section - White card container */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h4 className="text-lg font-semibold text-gray-900">Existing Customer Quotes</h4>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">
              {loading ? 'Loading...' : `${quotes.length} quote templates available`}
            </span>
            {!loading && totalPages > 1 && !showAll && (
              <span className="text-sm text-gray-500">
                Page {currentPage} of {totalPages}
              </span>
            )}
            {!loading && totalPages > 1 && (
              <button
                onClick={() => {
                  setShowAll(!showAll);
                  if (!showAll) {
                    setCurrentPage(1); // Reset to first page when switching to paged mode
                  }
                }}
                className="text-[#27aae1] hover:text-[#1e8bc3] hover:bg-[#27aae1]/10 px-3 py-1 rounded-md text-sm font-medium transition-colors"
              >
                {showAll ? 'Show Paged' : `Show All (${filteredQuotes.length})`}
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#27aae1] mx-auto mb-4"></div>
            <p className="text-gray-600">Loading quotes...</p>
          </div>
        ) : quotes.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No quotes found in the database.</p>
            <p className="text-sm mt-2">Please ensure the database is properly seeded.</p>
          </div>
        ) : (
          <>
            {/* Search Bar */}
            <div className="relative mb-6">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search by quote ID, product, or customer name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#27aae1] focus:border-[#27aae1]"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Quote Table - Similar style to quote management */}
            <div className="overflow-hidden border border-slate-200 rounded-2xl">
              {/* Mobile responsive table */}
              <div className="block md:hidden">
                {currentQuotes.map((quote) => (
                  <div 
                    key={quote.id} 
                    className={`p-4 border-b border-slate-200 hover:bg-slate-50 transition-colors duration-200 cursor-pointer ${
                      selectedQuote?.id === quote.id ? 'bg-[#27aae1]/10 ring-2 ring-[#27aae1]/20' : ''
                    }`}
                    onClick={() => handleQuoteSelect(quote.id)}
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-900 text-sm">Quote ID:</span>
                        <span className="font-medium text-slate-700 text-sm">{quote.quoteId}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-900 text-sm">Product:</span>
                        <span className="text-slate-700 text-sm">{quote.product}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-900 text-sm">Customer:</span>
                        <span className="text-slate-700 text-sm">{quote.client?.companyName || quote.client?.contactPerson || 'N/A'}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-900 text-sm">Date:</span>
                        <span className="text-slate-700 text-sm">{new Date(quote.date).toISOString().slice(0, 10)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-900 text-sm">Status:</span>
                        <span className="text-slate-700 text-sm">{quote.status}</span>
                      </div>
                      <div className="flex items-center justify-center w-full pt-3">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={(e) => handleViewQuote(quote, e)}
                            className="w-10 h-10 hover:bg-[#27aae1]/10 hover:text-[#27aae1] transition-colors duration-200 p-2 rounded-lg bg-[#27aae1]/20 text-[#27aae1] flex items-center justify-center"
                            title="View Quote Details"
                          >
                            <Eye className="h-5 w-5" />
                          </button>
                          <button
                            onClick={(e) => handleEditQuote(quote, e)}
                            className="w-10 h-10 hover:bg-[#27aae1]/10 hover:text-[#27aae1] transition-colors duration-200 p-2 rounded-md bg-[#27aae1]/20 text-[#27aae1] flex items-center justify-center"
                            title="Edit Quote"
                          >
                            <Edit className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Desktop table */}
              <table className="w-full hidden md:table">
                <thead className="bg-slate-50">
                  <tr className="border-slate-200">
                    <th className="text-slate-700 font-semibold p-6 text-left">Quote ID</th>
                    <th className="text-slate-700 font-semibold p-6 text-left">Product</th>
                    <th className="text-slate-700 font-semibold p-6 text-left">Customer</th>
                    <th className="text-slate-700 font-semibold p-6 text-left">Date</th>
                    <th className="text-slate-700 font-semibold p-6 text-left">Status</th>
                    <th className="text-slate-700 font-semibold p-6 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentQuotes.map((quote) => (
                    <tr 
                      key={quote.id} 
                      className={`hover:bg-slate-50 transition-colors duration-200 border-slate-100 cursor-pointer ${
                        selectedQuote?.id === quote.id ? 'bg-[#27aae1]/10 ring-2 ring-[#27aae1]/20' : ''
                      }`}
                      onClick={() => handleQuoteSelect(quote.id)}
                    >
                      <td className="font-medium text-slate-900 p-6">{quote.quoteId}</td>
                      <td className="text-slate-700 p-6">{quote.product}</td>
                      <td className="text-slate-700 p-6">{quote.client?.companyName || quote.client?.contactPerson || 'N/A'}</td>
                      <td className="text-slate-700 p-6">{new Date(quote.date).toISOString().slice(0, 10)}</td>
                      <td className="text-slate-700 p-6">{quote.status}</td>
                      <td className="p-6">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => handleViewQuote(quote, e)}
                            className="w-8 h-8 hover:bg-[#27aae1]/10 hover:text-[#27aae1] transition-colors duration-200 p-2 rounded-md"
                            title="View Quote Details"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={(e) => handleEditQuote(quote, e)}
                            className="w-8 h-8 hover:bg-[#27aae1]/10 hover:text-[#27aae1] transition-colors duration-200 p-2 rounded-md"
                            title="Edit Quote"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && !showAll && (
              <div className="flex flex-col sm:flex-row items-center justify-between mt-6 gap-4">
                <div className="text-sm text-gray-600 text-center sm:text-left w-full sm:w-auto">
                  Showing {startIndex + 1} to {Math.min(endIndex, filteredQuotes.length)} of {filteredQuotes.length} quotes
                </div>
                <div className="flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 sm:space-x-2 w-full sm:w-auto">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className={`px-3 py-2 text-sm font-medium rounded-md transition-colors w-full sm:w-auto ${
                      currentPage === 1
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Previous
                  </button>
                  
                  {/* Page Numbers - Mobile friendly */}
                  <div className="flex items-center justify-center space-x-1 flex-wrap w-full sm:w-auto max-w-full overflow-hidden">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`px-2 py-2 text-sm font-medium rounded-md transition-colors min-w-[36px] h-[36px] flex items-center justify-center ${
                          currentPage === page
                            ? 'bg-[#27aae1] text-white'
                            : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                  </div>
                  
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className={`px-3 py-2 text-sm font-medium rounded-md transition-colors w-full sm:w-auto ${
                      currentPage === totalPages
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}

            {/* No Results Message */}
            {filteredQuotes.length === 0 && searchTerm && (
              <div className="text-center py-8 text-gray-500">
                <p>No quotes found matching your search criteria.</p>
              </div>
            )}
          </>
        )}
      </div>

                  {/* Selection Status */}
      {isSelectionValid && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
              <span className="text-white text-xs font-bold">✓</span>
            </div>
            <div className="text-green-700">
              <p className="font-medium mb-1">Quote template selected successfully!</p>
              <p className="text-sm">
                <strong>Quote ID:</strong> {selectedQuote?.quoteId} | 
                <strong> Product:</strong> {selectedQuote?.product} | 
                <strong> Customer:</strong> {selectedQuote?.client.companyName || selectedQuote?.client.contactPerson}
              </p>
              <p className="text-sm mt-1">Customer details and product specifications will be auto-filled in the next steps.</p>
            </div>
          </div>
        </div>
      )}

      {/* No Selection Warning */}
      {!isSelectionValid && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <div className="w-5 h-5 rounded-full bg-yellow-500 flex items-center justify-center">
              <span className="text-white text-xs font-bold">!</span>
            </div>
                          <div className="text-yellow-700">
              <p className="font-medium mb-1">Please select a quote template to continue</p>
              <p className="text-sm">Click on any quote row in the table above to use it as a template for your new quote.</p>
            </div>
          </div>
        </div>
      )}

      {/* View Quote Modal */}
      <Dialog open={showViewModal} onOpenChange={setShowViewModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <FileText className="w-5 h-5 mr-2 text-[#27aae1]" />
              Quote Details - {quoteForModal?.quoteId}
            </DialogTitle>
          </DialogHeader>
          
          {quoteForModal && (
            <div className="space-y-6">
              {/* Quote Header */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <FileText className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-600">Quote ID:</span>
                    <span className="font-medium text-gray-900">{quoteForModal.quoteId}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-600">Quote Date:</span>
                    <span className="font-medium text-gray-900">{new Date(quoteForModal.date).toISOString().slice(0, 10)}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <DollarSign className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-600">Total Amount:</span>
                                            <span className="font-bold text-lg text-[#27aae1]">AED {(quoteForModal.amounts?.total || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">Status:</span>
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                      {quoteForModal.status}
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="text-sm">
                    <span className="text-gray-600">Company:</span>
                    <span className="font-medium text-gray-900 ml-2">{quoteForModal.client.companyName || 'Individual'}</span>
                  </div>
                  <div className="text-sm">
                    <span className="text-gray-600">Contact Person:</span>
                    <span className="font-medium text-gray-900 ml-2">{quoteForModal.client.contactPerson}</span>
                  </div>
                  <div className="text-sm">
                    <span className="text-gray-600">Email:</span>
                    <span className="font-medium text-gray-900 ml-2">{quoteForModal.client.email}</span>
                  </div>
                  <div className="text-sm">
                    <span className="text-gray-600">Phone:</span>
                    <span className="font-medium text-gray-900 ml-2">{quoteForModal.client.phone}</span>
                  </div>
                  {quoteForModal.client.role && (
                    <div className="text-sm">
                      <span className="text-gray-600">Role:</span>
                      <span className="font-medium text-gray-900 ml-2">{quoteForModal.client.role}</span>
                    </div>
                  )}
                  {quoteForModal.client.countryCode && (
                    <div className="text-sm">
                      <span className="text-gray-600">Country Code:</span>
                      <span className="font-medium text-gray-900 ml-2">{quoteForModal.client.countryCode}</span>
                    </div>
                  )}
                  
                  {/* Address Information */}
                  {(quoteForModal.client.address || quoteForModal.client.city || quoteForModal.client.state || quoteForModal.client.postalCode || quoteForModal.client.country) && (
                    <div className="pt-2 border-t border-gray-100">
                      <div className="text-xs font-medium text-gray-600 mb-1">Address:</div>
                      <div className="space-y-1">
                        {quoteForModal.client.address && (
                          <div className="text-sm text-gray-900">{quoteForModal.client.address}</div>
                        )}
                        {(quoteForModal.client.city || quoteForModal.client.state || quoteForModal.client.postalCode) && (
                          <div className="text-sm text-gray-900">
                            {[quoteForModal.client.city, quoteForModal.client.state, quoteForModal.client.postalCode].filter(Boolean).join(', ')}
                          </div>
                        )}
                        {quoteForModal.client.country && (
                          <div className="text-sm text-gray-900">{quoteForModal.client.country}</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Quote Items */}
              <div>
                <h5 className="text-md font-semibold text-gray-900 mb-3">Quote Items</h5>
                <div className="bg-gray-50 rounded-lg p-4">
                  {loadingQuoteItems ? (
                    <div className="text-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#27aae1] mx-auto mb-2"></div>
                      <p className="text-gray-600 text-sm">Loading quote items...</p>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-3">
                        {quoteItems.map((item, idx) => {
                          // Calculate individual item price if available
                          const itemPrice = item.amounts?.total || 0;
                          
                          // Parse colors if they exist as JSON string
                          let colorInfo = '';
                          if (item.colors) {
                            try {
                              const colors = typeof item.colors === 'string' ? JSON.parse(item.colors) : item.colors;
                              if (colors.front || colors.back) {
                                colorInfo = ` • Colors: ${colors.front || ''}${colors.front && colors.back ? ' / ' : ''}${colors.back || ''}`;
                              }
                            } catch (e) {
                              // If parsing fails, treat as string
                              if (typeof item.colors === 'string' && item.colors) {
                                colorInfo = ` • Colors: ${item.colors}`;
                              }
                            }
                          }
                          
                          return (
                            <div key={idx} className="bg-white p-3 rounded border border-gray-200">
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <span className="text-gray-900 font-medium text-base">{item.productName || item.product || 'Product'}</span>
                                  <div className="text-sm text-gray-600 mt-1 space-y-1">
                                    <div>
                                      <span className="font-medium">Quantity:</span> {item.quantity} units
                                      {item.sides && <span> • <span className="font-medium">Sides:</span> {item.sides}</span>}
                                      {(item.printingSelection || item.printing) && <span> • <span className="font-medium">Printing:</span> {item.printingSelection || item.printing}</span>}
                                    </div>
                                    {item.papers && item.papers.length > 0 && (
                                      <div>
                                        <span className="font-medium">Paper:</span> {item.papers[0].name} {item.papers[0].gsm}gsm
                                        {item.papers[0].inputWidth && item.papers[0].inputHeight && (
                                          <span> • Input: {item.papers[0].inputWidth} × {item.papers[0].inputHeight} cm</span>
                                        )}
                                        {item.papers[0].outputWidth && item.papers[0].outputHeight && (
                                          <span> • Output: {item.papers[0].outputWidth} × {item.papers[0].outputHeight} cm</span>
                                        )}
                                        {item.papers[0].sheetsPerPacket && (
                                          <span> • Sheets per packet: {item.papers[0].sheetsPerPacket}</span>
                                        )}
                                        {item.papers[0].pricePerSheet && (
                                          <span> • Price per sheet: AED {item.papers[0].pricePerSheet}</span>
                                        )}
                                      </div>
                                    )}
                                    {item.finishing && item.finishing.length > 0 && (
                                      <div>
                                        <span className="font-medium">Finishing:</span> {item.finishing.map(f => f.name).join(', ')}
                                        {item.finishing.some(f => f.cost) && (
                                          <span> • Total cost: AED {item.finishing.reduce((sum, f) => sum + (f.cost || 0), 0).toFixed(2)}</span>
                                        )}
                                      </div>
                                    )}
                                    {colorInfo && (
                                      <div><span className="font-medium">Colors:</span> {colorInfo.replace(' • Colors: ', '')}</div>
                                    )}
                                    {(item.flatSizeWidth || item.flatSizeHeight) && (
                                      <div>
                                        <span className="font-medium">Flat Size:</span> {item.flatSizeWidth || 0} × {item.flatSizeHeight || 0} cm
                                        {item.flatSizeSpine && <span> × {item.flatSizeSpine} cm (spine)</span>}
                                      </div>
                                    )}
                                    {(item.closeSizeWidth || item.closeSizeHeight) && !item.useSameAsFlat && (
                                      <div>
                                        <span className="font-medium">Close Size:</span> {item.closeSizeWidth || 0} × {item.closeSizeHeight || 0} cm
                                        {item.closeSizeSpine && <span> × {item.closeSizeSpine} cm (spine)</span>}
                                      </div>
                                    )}
                                    {item.operational && (
                                      <div>
                                        <span className="font-medium">Operational:</span> 
                                        {item.operational.plates && <span> {item.operational.plates} plates</span>}
                                        {item.operational.units && <span> • {item.operational.units} units</span>}
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <div className="text-right ml-4">
                                  <span className="font-bold text-lg text-[#27aae1]">AED {itemPrice.toFixed(2)}</span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      <div className="border-t border-gray-200 mt-3 pt-3 flex justify-between items-center">
                        <span className="font-semibold text-gray-900">Total:</span>
                        <span className="font-bold text-lg text-[#27aae1]">
                          AED {quoteItems.reduce((total, item) => total + (item.amounts?.total || 0), 0).toFixed(2)}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Quote Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Edit className="w-5 h-5 mr-2 text-[#27aae1]" />
              Edit Quote - {editingQuote?.quoteId}
            </DialogTitle>
          </DialogHeader>
          
          {editingQuote && (
            <div className="space-y-6">
              {/* Customer Information Section */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-3">Customer Information</h4>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                    <Input
                      value={editingQuote.client.companyName || ''}
                      onChange={(e) => updateEditingQuote('client', e.target.value, 'companyName')}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Contact Person</label>
                    <Input
                      value={editingQuote.client?.contactPerson || ''}
                      onChange={(e) => updateEditingQuote('client', e.target.value, 'contactPerson')}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <Input
                      type="email"
                      value={editingQuote.client?.email || ''}
                      onChange={(e) => updateEditingQuote('client', e.target.value, 'email')}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    <Input
                      value={editingQuote.client?.phone || ''}
                      onChange={(e) => updateEditingQuote('client', e.target.value, 'phone')}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Country Code</label>
                    <Input
                      value={editingQuote.client.countryCode || '+971'}
                      onChange={(e) => updateEditingQuote('client', e.target.value, 'countryCode')}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                    <Input
                      value={editingQuote.client.role || ''}
                      onChange={(e) => updateEditingQuote('client', e.target.value, 'role')}
                      className="w-full"
                    />
                  </div>
                </div>
                
                {/* Address Fields */}
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <h5 className="text-sm font-medium text-gray-700 mb-3">Address Information</h5>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Address</label>
                      <Input
                        value={editingQuote.client.address || ''}
                        onChange={(e) => updateEditingQuote('client', e.target.value, 'address')}
                        className="w-full"
                        placeholder="Street address"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">City</label>
                      <Input
                        value={editingQuote.client.city || ''}
                        onChange={(e) => updateEditingQuote('client', e.target.value, 'city')}
                        className="w-full"
                        placeholder="City"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">State/Province</label>
                      <Input
                        value={editingQuote.client.state || ''}
                        onChange={(e) => updateEditingQuote('client', e.target.value, 'state')}
                        className="w-full"
                        placeholder="State or province"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Postal Code</label>
                      <Input
                        value={editingQuote.client.postalCode || ''}
                        onChange={(e) => updateEditingQuote('client', e.target.value, 'postalCode')}
                        className="w-full"
                        placeholder="Postal code"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Country</label>
                      <Input
                        value={editingQuote.client.country || ''}
                        onChange={(e) => updateEditingQuote('client', e.target.value, 'country')}
                        className="w-full"
                        placeholder="Country"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Quote Details Section */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-3">Quote Details</h4>
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Quote Date</label>
                    <Input
                      type="date"
                      value={new Date(editingQuote.date).toISOString().slice(0, 10)}
                      onChange={(e) => {
                        console.log("Date updated:", e.target.value);
                      }}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select
                      value={editingQuote.status}
                      onChange={(e) => {
                        console.log("Status updated:", e.target.value);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#27aae1] focus:border-transparent"
                    >
                      <option value="New">New</option>
                      <option value="Sent">Sent</option>
                      <option value="Accepted">Accepted</option>
                      <option value="Rejected">Rejected</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Total Amount</label>
                    <Input
                      value={`AED ${(editingQuote.amounts?.total || 0).toFixed(2)}`}
                      onChange={(e) => {
                        console.log("Amount updated:", e.target.value);
                      }}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>

              {/* Step 3 Product Specifications Section */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-3">Product Specifications (Step 3)</h4>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
                    <Input
                      value={editingQuote.productName || editingQuote.product || ''}
                      onChange={(e) => {
                        console.log("Product name updated:", e.target.value);
                      }}
                      className="w-full"
                      placeholder="e.g., Business Cards, Letterheads"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Printing Selection</label>
                    <select
                      value={editingQuote.printingSelection || editingQuote.printing || 'Digital'}
                      onChange={(e) => {
                        console.log("Printing selection updated:", e.target.value);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#27aae1] focus:border-transparent"
                    >
                      <option value="Digital">Digital</option>
                      <option value="Offset">Offset</option>
                      <option value="Either">Either</option>
                      <option value="Both">Both</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                    <Input
                      type="number"
                      value={editingQuote.quantity}
                      onChange={(e) => {
                        console.log("Quantity updated:", e.target.value);
                      }}
                      className="w-full"
                      placeholder="Quantity"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Sides</label>
                    <select
                      value={editingQuote.sides}
                      onChange={(e) => {
                        console.log("Sides updated:", e.target.value);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#27aae1] focus:border-transparent"
                    >
                      <option value="1">1 Side</option>
                      <option value="2">2 Sides</option>
                    </select>
                  </div>
                </div>

                {/* Size Specifications */}
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <h5 className="text-sm font-medium text-gray-700 mb-3">Size Specifications</h5>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Flat Size Width (cm)</label>
                      <Input
                        type="number"
                        step="0.1"
                        value={editingQuote.flatSizeWidth || ''}
                        onChange={(e) => {
                          console.log("Flat size width updated:", e.target.value);
                        }}
                        className="w-full"
                        placeholder="Width"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Flat Size Height (cm)</label>
                      <Input
                        type="number"
                        step="0.1"
                        value={editingQuote.flatSizeHeight || ''}
                        onChange={(e) => {
                          console.log("Flat size height updated:", e.target.value);
                        }}
                        className="w-full"
                        placeholder="Height"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Flat Size Spine (cm)</label>
                      <Input
                        type="number"
                        step="0.1"
                        value={editingQuote.flatSizeSpine || ''}
                        onChange={(e) => {
                          console.log("Flat size spine updated:", e.target.value);
                        }}
                        className="w-full"
                        placeholder="Spine"
                      />
                    </div>
                  </div>
                  
                  <div className="mt-3">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={editingQuote.useSameAsFlat || false}
                        onChange={(e) => {
                          console.log("Use same as flat updated:", e.target.checked);
                        }}
                        className="rounded border-gray-300 text-[#27aae1] focus:ring-[#27aae1]"
                      />
                      <span className="text-sm font-medium text-gray-700">Use same dimensions for close size</span>
                    </label>
                  </div>

                  {!editingQuote.useSameAsFlat && (
                    <div className="grid md:grid-cols-3 gap-4 mt-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Close Size Width (cm)</label>
                        <Input
                          type="number"
                          step="0.1"
                          value={editingQuote.closeSizeWidth || ''}
                          onChange={(e) => {
                            console.log("Close size width updated:", e.target.value);
                          }}
                          className="w-full"
                          placeholder="Width"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Close Size Height (cm)</label>
                        <Input
                          type="number"
                          step="0.1"
                          value={editingQuote.closeSizeHeight || ''}
                          onChange={(e) => {
                            console.log("Close size height updated:", e.target.value);
                          }}
                          className="w-full"
                          placeholder="Height"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Close Size Spine (cm)</label>
                        <Input
                          type="number"
                          step="0.1"
                          value={editingQuote.closeSizeSpine || ''}
                          onChange={(e) => {
                            console.log("Close size spine updated:", e.target.value);
                          }}
                          className="w-full"
                          placeholder="Spine"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Quote Items Section */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-gray-900">Quote Items</h4>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      // In a real app, you'd add a new item here
                      console.log("Add new item clicked");
                    }}
                    className="text-[#27aae1] hover:text-[#1e8bc3]"
                  >
                    + Add Item
                  </Button>
                </div>
                
                <div className="space-y-3">
                  {/* Display actual quote data with enhanced fields */}
                  <div className="bg-white p-4 rounded border border-gray-200">
                    <div className="space-y-3">
                      {/* Basic Product Info */}
                      <div className="grid md:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Product Name</label>
                          <Input
                            value={editingQuote.productName || editingQuote.product || ''}
                            onChange={(e) => {
                              console.log(`Product name updated:`, e.target.value);
                            }}
                            className="w-full text-sm"
                            placeholder="Product name"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Quantity</label>
                          <Input
                            type="number"
                            value={editingQuote.quantity}
                            onChange={(e) => {
                              console.log(`Quantity updated:`, e.target.value);
                            }}
                            className="w-full text-sm"
                            placeholder="Quantity"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Total Price</label>
                          <Input
                            value={`AED ${(editingQuote.amounts?.total || 0).toFixed(2)}`}
                            onChange={(e) => {
                              console.log(`Price updated:`, e.target.value);
                            }}
                            className="w-full text-sm"
                            placeholder="Price"
                          />
                        </div>
                      </div>

                      {/* Paper Specifications */}
                      {editingQuote.papers && editingQuote.papers.length > 0 && (
                        <div className="border-t border-gray-100 pt-3">
                          <h6 className="text-xs font-medium text-gray-700 mb-2">Paper Specifications</h6>
                          <div className="grid md:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-medium text-gray-500 mb-1">Paper Type</label>
                              <Input
                                value={editingQuote.papers[0].name}
                                onChange={(e) => {
                                  console.log(`Paper name updated:`, e.target.value);
                                }}
                                className="w-full text-sm"
                                placeholder="Paper name"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-500 mb-1">GSM</label>
                              <Input
                                value={editingQuote.papers[0].gsm}
                                onChange={(e) => {
                                  console.log(`GSM updated:`, e.target.value);
                                }}
                                className="w-full text-sm"
                                placeholder="GSM"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-500 mb-1">Input Size (W × H cm)</label>
                              <div className="flex space-x-2">
                                <Input
                                  type="number"
                                  step="0.1"
                                  value={editingQuote.papers[0].inputWidth || ''}
                                  onChange={(e) => {
                                    console.log(`Input width updated:`, e.target.value);
                                  }}
                                  className="w-full text-sm"
                                  placeholder="Width"
                                />
                                <Input
                                  type="number"
                                  step="0.1"
                                  value={editingQuote.papers[0].inputHeight || ''}
                                  onChange={(e) => {
                                    console.log(`Input height updated:`, e.target.value);
                                  }}
                                  className="w-full text-sm"
                                  placeholder="Height"
                                />
                              </div>
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-500 mb-1">Price per Sheet</label>
                              <Input
                                type="number"
                                step="0.01"
                                value={editingQuote.papers[0].pricePerSheet || ''}
                                onChange={(e) => {
                                  console.log(`Price per sheet updated:`, e.target.value);
                                }}
                                className="w-full text-sm"
                                placeholder="Price"
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Finishing Specifications */}
                      {editingQuote.finishing && editingQuote.finishing.length > 0 && (
                        <div className="border-t border-gray-100 pt-3">
                          <h6 className="text-xs font-medium text-gray-700 mb-2">Finishing Specifications</h6>
                          <div className="grid md:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-medium text-gray-500 mb-1">Finishing Type</label>
                              <Input
                                value={editingQuote.finishing[0].name}
                                onChange={(e) => {
                                  console.log(`Finishing name updated:`, e.target.value);
                                }}
                                className="w-full text-sm"
                                placeholder="Finishing name"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-500 mb-1">Cost</label>
                              <Input
                                type="number"
                                step="0.01"
                                value={editingQuote.finishing[0].cost || ''}
                                onChange={(e) => {
                                  console.log(`Finishing cost updated:`, e.target.value);
                                }}
                                className="w-full text-sm"
                                placeholder="Cost"
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="border-t border-gray-100 pt-3 flex justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            console.log(`Remove item`);
                          }}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          Remove Item
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Operational Data Section */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-3">Operational Data</h4>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Plates</label>
                    <Input
                      type="number"
                      value={editingQuote.operational?.plates || ''}
                      onChange={(e) => {
                        console.log("Plates updated:", e.target.value);
                      }}
                      className="w-full"
                      placeholder="Number of plates"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Units</label>
                    <Input
                      type="number"
                      value={editingQuote.operational?.units || ''}
                      onChange={(e) => {
                        console.log("Units updated:", e.target.value);
                      }}
                      className="w-full"
                      placeholder="Number of units"
                    />
                  </div>
                </div>
              </div>

              {/* Additional Notes Section */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-3">Additional Notes</h4>
                <textarea
                  placeholder="Add any additional notes, special requirements, or comments..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#27aae1] focus:border-transparent"
                  rows={3}
                  onChange={(e) => {
                    console.log("Notes updated:", e.target.value);
                  }}
                />
              </div>
            </div>
          )}

          <DialogFooter className="pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setShowEditModal(false);
                setEditingQuote(null);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveChanges}
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Step2CustomerChoose;