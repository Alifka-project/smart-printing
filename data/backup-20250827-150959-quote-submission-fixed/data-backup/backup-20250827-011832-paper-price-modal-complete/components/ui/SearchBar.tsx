"use client";

import React from "react";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchBarProps {
  placeholder?: string;
  className?: string;
  onSearch?: (query: string) => void;
  defaultValue?: string;
}

export default function SearchBar({ 
  placeholder = "Search quotes, clients, suppliers...",
  className = "",
  onSearch,
  defaultValue = ""
}: SearchBarProps) {
  const [query, setQuery] = React.useState(defaultValue);
  const [isFocused, setIsFocused] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Debounced search effect
  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (onSearch && query.trim()) {
        onSearch(query.trim());
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, onSearch]);

  // Keyboard shortcuts
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "/" && !isFocused) {
        e.preventDefault();
        inputRef.current?.focus();
      }
      if (e.key === "Escape" && isFocused) {
        inputRef.current?.blur();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isFocused]);

  const handleClear = () => {
    setQuery("");
    inputRef.current?.focus();
  };

  return (
    <div className={cn("relative", className)}>
      <div className="relative">
        <Search 
          className={cn(
            "absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 transition-colors duration-200",
            isFocused ? "text-primary" : "text-muted-foreground"
          )} 
        />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          className={cn(
            "w-full pl-12 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-2xl",
            "text-foreground placeholder:text-muted-foreground",
            "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white",
            "transition-all duration-200 ease-out",
            "hover:border-primary/50 hover:bg-white",
            "shadow-sm hover:shadow-md",
            isFocused && "ring-2 ring-primary/20 border-primary shadow-lg bg-white"
          )}
          role="combobox"
          aria-expanded={false}
          aria-haspopup="listbox"
          aria-controls="search-results"
          aria-label="Search"
        />
        {query && (
          <button
            onClick={handleClear}
            className={cn(
              "absolute right-3 top-1/2 transform -translate-y-1/2",
              "p-1 rounded-full hover:bg-muted transition-colors duration-200",
              "focus:outline-none focus:ring-2 focus:ring-primary/20"
            )}
            aria-label="Clear search"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        )}
      </div>
    </div>
  );
}
