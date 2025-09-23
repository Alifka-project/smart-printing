"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { ChevronRight, Home } from "lucide-react";
import Link from "next/link";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface PageHeaderProps {
  title: string;
  description?: string;
  breadcrumbs?: BreadcrumbItem[];
  actions?: React.ReactNode;
  className?: string;
}

export default function PageHeader({ 
  title, 
  description, 
  breadcrumbs = [], 
  actions, 
  className = "" 
}: PageHeaderProps) {
  return (
    <div className={cn("mb-8", className)}>
      {/* Breadcrumbs */}
      {breadcrumbs.length > 0 && (
        <nav className="flex items-center space-x-3 text-sm text-muted-foreground mb-6" aria-label="Breadcrumb">
          <Link 
            href="/" 
            className="flex items-center space-x-2 hover:text-foreground transition-colors duration-200 font-medium"
          >
            <Home className="w-4 h-4" />
            <span>Home</span>
          </Link>
          
          {breadcrumbs.map((item, index) => (
            <React.Fragment key={index}>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
              {item.href ? (
                <Link 
                  href={item.href}
                  className="hover:text-foreground transition-colors duration-200 font-medium"
                >
                  {item.label}
                </Link>
              ) : (
                <span className="text-foreground font-semibold">{item.label}</span>
              )}
            </React.Fragment>
          ))}
        </nav>
      )}

      {/* Title and Actions Row */}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-foreground mb-3">
            {title}
          </h1>
          {description && (
            <p className="text-lg text-muted-foreground max-w-3xl leading-relaxed">
              {description}
            </p>
          )}
        </div>
        
        {actions && (
          <div className="flex items-center space-x-3 ml-6">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}
