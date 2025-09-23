"use client";

import AppHeader from "@/components/ui/AppHeader";
import SideNav from "@/components/ui/SideNav";
import React, { useState } from "react";
import { cn } from "@/lib/utils";

interface ClientLayoutWrapperProps {
  children: React.ReactNode;
}

export default function ClientLayoutWrapper({ children }: ClientLayoutWrapperProps) {
  const [isNavbarOpen, setIsNavbarOpen] = useState(false);
  const [isSideNavExpanded, setIsSideNavExpanded] = useState(false);

  const handleNavbarToggle = () => {
    setIsNavbarOpen(!isNavbarOpen);
  };

  const handleSideNavHover = (isHovering: boolean) => {
    setIsSideNavExpanded(isHovering);
  };

  return (
    <div className="w-full flex min-h-screen bg-background overflow-hidden">
      <SideNav 
        isMobileMenuOpen={isNavbarOpen} 
        onMobileMenuToggle={handleNavbarToggle}
        onHoverChange={handleSideNavHover}
      />
      <div 
        className={cn(
          "flex-1 flex flex-col min-w-0 overflow-hidden transition-all duration-300 ease-in-out",
          "lg:ml-16", // Default collapsed state (64px)
          isSideNavExpanded && "lg:ml-72" // Expanded state (288px)
        )}
      >
        <AppHeader 
          onNavbarToggle={handleNavbarToggle} 
          isNavbarOpen={isNavbarOpen}
          isNavbarExpanded={isSideNavExpanded}
        />
        <main className="flex-1 p-4 sm:p-6 overflow-auto bg-gray-50">
          <div className="max-w-7xl mx-auto w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
