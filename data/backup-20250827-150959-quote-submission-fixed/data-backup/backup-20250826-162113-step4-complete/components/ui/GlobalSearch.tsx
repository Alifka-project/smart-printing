"use client";

import React, { useState, useEffect, useRef } from "react";
import { Search, Clock, TrendingUp, X, User, Building, FileText, Package } from "lucide-react";
import { Button } from "./button";
import { useRouter } from "next/navigation";

interface SearchResult {
  id: string;
  type: 'quote' | 'client' | 'supplier' | 'material' | 'user';
  title: string;
  subtitle: string;
  data: any;
}

export default function GlobalSearch() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load search history from API
  useEffect(() => {
    const loadSearchHistory = async () => {
      try {
        setIsLoadingHistory(true);
        const response = await fetch('/api/search/history');
        if (response.ok) {
          const history = await response.json();
          setSearchHistory(history.map((h: any) => h.query));
        } else {
          console.error('Failed to load search history:', response.status);
          setSearchHistory([]);
        }
      } catch (error) {
        console.error('Error loading search history:', error);
        setSearchHistory([]);
      } finally {
        setIsLoadingHistory(false);
      }
    };
    
    if (isOpen) {
      loadSearchHistory();
    }
  }, [isOpen]);

  // Handle click outside to close search
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setQuery("");
        setResults([]);
        setSearchError(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isOpen) {
        event.preventDefault();
        setIsOpen(false);
        setQuery("");
        setResults([]);
        setSearchError(null);
      }
      // Add "/" key to open search when not focused
      if (event.key === "/" && !isOpen && !event.ctrlKey && !event.metaKey) {
        event.preventDefault();
        setIsOpen(true);
        setTimeout(() => inputRef.current?.focus(), 100);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  // Focus trap for modal
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
      
      // Focus trap: keep focus within modal
      const handleTabKey = (e: KeyboardEvent) => {
        if (e.key === 'Tab') {
          const focusableElements = searchRef.current?.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          );
          
          if (focusableElements && focusableElements.length > 0) {
            const firstElement = focusableElements[0] as HTMLElement;
            const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;
            
            if (e.shiftKey) {
              if (document.activeElement === firstElement) {
                e.preventDefault();
                lastElement.focus();
              }
            } else {
              if (document.activeElement === lastElement) {
                e.preventDefault();
                firstElement.focus();
              }
            }
          }
        }
      };
      
      document.addEventListener('keydown', handleTabKey);
      return () => document.removeEventListener('keydown', handleTabKey);
    }
  }, [isOpen]);

  const performSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      setSearchError(null);
      return;
    }

    setIsSearching(true);
    setSearchError(null);
    try {
      // Search using API
      const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`);
      if (response.ok) {
        const results = await response.json();
        setResults(results);
      } else {
        console.error('Search API error:', response.status, response.statusText);
        setResults([]);
        setSearchError('Search failed. Please try again.');
        // Show error message to user
        setShowHistory(false);
      }
      
      // Save search history
      if (searchQuery.trim()) {
        try {
          await fetch('/api/search/history', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ query: searchQuery.trim() }),
          });
        } catch (historyError) {
          console.error('Failed to save search history:', historyError);
          // Don't show error to user for history saving
        }
      }

    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
      setSearchError('Search failed. Please check your connection and try again.');
      setShowHistory(false);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      performSearch(query);
      setShowHistory(false);
    }
  };

  const handleHistoryClick = (historyItem: string) => {
    setQuery(historyItem);
    setSearchError(null);
    performSearch(historyItem);
    setShowHistory(false);
  };

  const clearHistory = async () => {
    setSearchHistory([]);
    setSearchError(null);
    // Note: In a real app, you'd want to clear from database too
  };

  const getResultIcon = (type: string) => {
    switch (type) {
      case 'quote':
        return <FileText className="w-4 h-4 text-blue-600" />;
      case 'client':
        return <Building className="w-4 h-4 text-green-600" />;
      case 'supplier':
        return <Package className="w-4 h-4 text-purple-600" />;
      case 'material':
        return <Package className="w-4 h-4 text-orange-600" />;
      case 'user':
        return <User className="w-4 h-4 text-indigo-600" />;
      default:
        return <Search className="w-4 h-4 text-gray-600" />;
    }
  };

  const getResultTypeLabel = (type: string) => {
    switch (type) {
      case 'quote':
        return 'Quote';
      case 'client':
        return 'Client';
      case 'supplier':
        return 'Supplier';
      case 'material':
        return 'Material';
      case 'user':
        return 'User';
      default:
        return 'Item';
    }
  };

  const handleResultClick = (result: SearchResult) => {
    // Handle result click based on type with proper navigation
    switch (result.type) {
      case 'quote':
        // Navigate to quote management page with the specific quote
        router.push(`/quote-management?quoteId=${result.data.quoteId || result.data.id}`);
        break;
      case 'client':
        // Navigate to client management page with the specific client
        router.push(`/client-management?clientId=${result.data.id}`);
        break;
      case 'supplier':
        // Navigate to supplier management page with the specific supplier
        router.push(`/supplier-management?supplierId=${result.data.id}`);
        break;
      case 'material':
        // Navigate to supplier management page with the specific material
        router.push(`/supplier-management?materialId=${result.data.id}`);
        break;
      case 'user':
        // Navigate to user management page with the specific user
        router.push(`/user-management?userId=${result.data.id}`);
        break;
    }
    
    // Close search modal
    setIsOpen(false);
    setQuery("");
    setResults([]);
    setSearchError(null);
  };

  return (
    <div className="relative" ref={searchRef}>
      {/* Search Trigger Button */}
      <Button
        variant="outline"
        className="w-full justify-start text-sm text-muted-foreground bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 rounded-2xl shadow-sm hover:shadow-md"
        onClick={() => setIsOpen(true)}
      >
        <Search className="mr-3 h-4 w-4 text-gray-400" />
        <span className="text-gray-600">Search quotes, clients, suppliers...</span>
        <kbd className="ml-auto hidden md:inline-flex items-center px-2 py-1 text-xs font-mono text-gray-500 bg-gray-100 rounded-lg border border-gray-200">
          /
        </kbd>
      </Button>

      {/* Search Modal */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm flex items-start justify-center pt-20"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsOpen(false);
              setQuery("");
              setResults([]);
              setSearchError(null);
            }
          }}
        >
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl mx-4 max-h-[80vh] overflow-hidden border border-gray-100">
            {/* Search Input */}
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Global Search</h3>
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    setQuery("");
                    setResults([]);
                    setSearchError(null);
                  }}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                  aria-label="Close search"
                >
                  <X className="w-5 h-5 text-gray-500 hover:text-gray-700" />
                </button>
              </div>
              <form onSubmit={handleSearch} className="relative">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    ref={inputRef}
                    type="text"
                    placeholder="Search quotes, clients, suppliers, materials, users..."
                    value={query}
                    onChange={(e) => {
                      setQuery(e.target.value);
                      if (e.target.value.trim()) {
                        performSearch(e.target.value);
                      } else {
                        setResults([]);
                        setShowHistory(true);
                      }
                    }}
                    onFocus={() => setShowHistory(true)}
                    onKeyDown={(e) => {
                      if (e.key === "Escape") {
                        e.preventDefault();
                        setIsOpen(false);
                        setQuery("");
                        setResults([]);
                        setSearchError(null);
                      }
                    }}
                    className="w-full pl-12 pr-12 py-4 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-gray-900 placeholder:text-gray-500"
                  />
                  {query && (
                    <button
                      type="button"
                      onClick={() => {
                        setQuery("");
                        setResults([]);
                        setSearchError(null);
                        setShowHistory(true);
                      }}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* Search Results */}
            <div className="flex-1 overflow-y-auto">
              {searchError ? (
                <div className="p-12 text-center text-gray-500">
                  <div className="space-y-3">
                    <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center">
                      <X className="w-8 h-8 text-red-400" />
                    </div>
                    <div className="space-y-2">
                      <p className="text-red-600 font-medium">Search Error</p>
                      <p className="text-gray-600">{searchError}</p>
                    </div>
                    <div className="pt-4">
                      <button
                        onClick={() => {
                          setSearchError(null);
                          performSearch(query);
                        }}
                        className="text-sm text-blue-600 hover:text-blue-700 hover:underline transition-colors"
                      >
                        Try again
                      </button>
                    </div>
                  </div>
                </div>
              ) : isSearching ? (
                <div className="p-12 text-center text-gray-500">
                  <div className="flex items-center justify-center space-x-3">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                    <span className="text-gray-600">Searching...</span>
                  </div>
                </div>
              ) : results.length > 0 ? (
                <div className="p-3">
                  <div className="mb-3 px-2">
                    <p className="text-sm text-gray-600">
                      Found {results.length} result{results.length !== 1 ? 's' : ''} for "{query}"
                    </p>
                  </div>
                  {results.map((result) => (
                    <div
                      key={result.id}
                      onClick={() => handleResultClick(result)}
                      className="flex items-center space-x-4 p-4 hover:bg-gray-50 rounded-lg cursor-pointer transition-all duration-200 group border border-transparent hover:border-gray-200"
                    >
                      <div className="flex-shrink-0 w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center group-hover:bg-blue-50 transition-colors">
                        {getResultIcon(result.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                            {getResultTypeLabel(result.type)}
                          </span>
                          <p className="text-sm font-semibold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                            {result.title}
                          </p>
                        </div>
                        <p className="text-sm text-gray-500 truncate">
                          {result.subtitle}
                        </p>
                      </div>
                      <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : showHistory && searchHistory.length > 0 ? (
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-gray-700">Recent Searches</h3>
                    <button
                      onClick={clearHistory}
                      className="text-sm text-gray-500 hover:text-gray-700 transition-colors px-2 py-1 rounded hover:bg-gray-100"
                    >
                      Clear
                    </button>
                  </div>
                  <div className="space-y-2">
                    {isLoadingHistory ? (
                      <div className="p-3 text-center text-gray-500">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                        <span className="text-gray-600">Loading history...</span>
                      </div>
                    ) : searchHistory.length === 0 ? (
                      <div className="p-3 text-center text-gray-500">
                        <p className="text-gray-600">No recent searches.</p>
                      </div>
                    ) : (
                      searchHistory.slice(0, 5).map((historyItem, index) => (
                        <div
                          key={index}
                          onClick={() => handleHistoryClick(historyItem)}
                          className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-all duration-200 group border border-transparent hover:border-gray-200"
                        >
                          <Clock className="w-4 h-4 text-gray-400 group-hover:text-blue-500 transition-colors" />
                          <span className="text-sm text-gray-600 group-hover:text-gray-900 transition-colors flex-1">{historyItem}</span>
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ) : query && !isSearching ? (
                <div className="p-12 text-center text-gray-500">
                  <div className="space-y-3">
                    <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center">
                      <Search className="w-8 h-8 text-gray-400" />
                    </div>
                    <div className="space-y-2">
                      <p className="text-gray-600">No results found for</p>
                      <p className="text-gray-900 font-medium">"{query}"</p>
                      <p className="text-sm text-gray-400">Try different keywords or check spelling</p>
                    </div>
                    <div className="pt-4">
                      <button
                        onClick={() => {
                          setQuery("");
                          setResults([]);
                          setSearchError(null);
                          setShowHistory(true);
                        }}
                        className="text-sm text-blue-600 hover:text-blue-700 hover:underline transition-colors"
                      >
                        Clear search and try again
                      </button>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-100 bg-gray-50">
              <div className="text-center text-xs text-gray-500">
                <span>Press <kbd className="px-2 py-1 bg-gray-200 rounded text-xs font-mono">Esc</kbd> to close or click the <X className="w-3 h-3 inline" /> button</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
