"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  SquarePen,
  FileText,
  Building2,
  Package,
  Users,
  Home,
  ChevronRight,
  ChevronLeft,
  Monitor,
  Activity,
  User,
  Printer,
  LucideIcon,
  Menu,
  X
} from "lucide-react";
import { getSidebarItems } from "@/constants";
import { getCurrentUser } from "@/lib/auth";
import GlobalSearch from "./GlobalSearch";

interface SideNavProps {
  className?: string;
  isMobileMenuOpen?: boolean;
  onMobileMenuToggle?: () => void;
  onHoverChange?: (isHovered: boolean) => void;
}

export default function SideNav({ 
  className = "", 
  isMobileMenuOpen = false,
  onMobileMenuToggle,
  onHoverChange
}: SideNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [role, setRole] = React.useState<"admin" | "estimator">("estimator");
  const [isExpanded, setIsExpanded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [user, setUser] = React.useState<any>(null);
  const [mounted, setMounted] = useState(false);
  const [isMobileMenuOpenState, setIsMobileMenuOpenState] = useState(false);
  const [isMobileNavVisible, setIsMobileNavVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isClosing, setIsClosing] = useState(false);
  const [isOpening, setIsOpening] = useState(false);
  
  // Use props for mobile menu state if provided, otherwise use local state
  const isMenuOpen = onMobileMenuToggle ? isMobileMenuOpen : isMobileMenuOpenState;

  React.useEffect(() => {
    setMounted(true);
    
    const loadUser = async () => {
      try {
        const u = await getCurrentUser();
        if (u?.role === "admin" || u?.role === "estimator") {
          setRole(u.role);
        }
        setUser(u);
      } catch (error) {
        console.error('Error loading user:', error);
      }
    };
    
    loadUser();
  }, []);

  // Scroll detection for mobile navigation
  React.useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Show navigation when scrolling up or at the top
      if (currentScrollY < lastScrollY || currentScrollY < 100) {
        setIsMobileNavVisible(true);
      } 
      // Hide navigation when scrolling down (after scrolling more than 100px)
      else if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsMobileNavVisible(false);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  // Handle mobile menu open with entry animation
  const handleMobileMenuOpen = () => {
    if (onMobileMenuToggle) {
      onMobileMenuToggle();
    } else {
      setIsMobileMenuOpenState(true);
    }
    setIsOpening(true);
    // Reset opening state after animation completes
    setTimeout(() => {
      setIsOpening(false);
    }, 300);
  };

  // Handle mobile menu close with exit animation
  const handleMobileMenuClose = () => {
    setIsClosing(true);
    // Wait for exit animation to complete before hiding
    setTimeout(() => {
      if (onMobileMenuToggle) {
        onMobileMenuToggle();
      } else {
        setIsMobileMenuOpenState(false);
      }
      setIsClosing(false);
    }, 300); // Match transition duration
  };
  // Don't render until mounted to prevent hydration issues
  if (!mounted) {
    return null;
  }

  const sideBarItems = getSidebarItems(role);

  const getIconComponent = (iconName: LucideIcon) => {
    return iconName;
  };

  const shouldExpand = isExpanded || isHovered;

  return (
    <>
      {/* Desktop SideNav - Fixed and non-sliding */}
      <aside
        className={cn(
          "hidden lg:block fixed top-0 left-0 h-screen transition-all duration-300 ease-in-out overflow-hidden z-40",
          "bg-white border-r border-slate-200 shadow-lg",
          isExpanded ? "w-72" : isHovered ? "w-72" : "w-16",
          className
        )}
        onMouseEnter={() => {
          setIsHovered(true);
          onHoverChange?.(true);
        }}
        onMouseLeave={() => {
          setIsHovered(false);
          onHoverChange?.(false);
        }}
      >
        {/* Header */}
        <div className="p-4">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <Printer className="w-5 h-5 text-white" />
            </div>
            <div className={cn(
              "ml-3 flex-1 min-w-0 transition-all duration-200 ease-out",
              shouldExpand ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-2"
            )}>
              <div className="text-lg font-bold text-slate-800 whitespace-nowrap">Smart Printing</div>
              <div className="text-slate-500 text-xs font-medium uppercase tracking-wide">
                <div>Professional Print</div>
                <div>Management</div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {sideBarItems.map((link) => {
            const isActive = pathname === link.route;
            const IconComponent = getIconComponent(link.icons);
            
            return (
              <Link
                key={link.label}
                href={link.route}
                className={cn(
                  "flex items-center px-2 py-2 rounded-xl transition-all duration-300 group w-full",
                  isActive 
                    ? "bg-purple-600 text-white shadow-md" 
                    : "text-slate-600 hover:bg-purple-50 hover:text-purple-700"
                )}
              >
                <div className="flex items-center w-full">
                  {IconComponent && (
                    <div className={cn(
                      "flex items-center w-6 h-6 rounded-lg transition-all duration-300 flex-shrink-0",
                      isActive 
                        ? "text-white" 
                        : "text-slate-500 group-hover:text-purple-600"
                    )}>
                      <IconComponent
                        size={18}
                        className="flex-shrink-0"
                      />
                    </div>
                  )}
                  <div className={cn(
                    "ml-3 transition-opacity duration-200 ease-out",
                    shouldExpand ? "opacity-100" : "opacity-0"
                  )}>
                    <span className="font-medium whitespace-nowrap">
                      {link.label}
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Mobile SideNav - Overlay with enhanced slide animation */}
      {isMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-40">
          {/* Backdrop */}
          <div 
            className={cn(
              "fixed inset-0 bg-black/50 transition-opacity duration-300 ease-out",
              isClosing ? "opacity-0" : "opacity-100"
            )}
            onClick={handleMobileMenuClose}
          />
          
          {/* Sidebar */}
          <aside className={cn(
            "fixed top-0 left-0 h-screen w-72 bg-white border-r border-slate-200 shadow-lg z-50",
            isOpening ? "mobile-sidebar-enter" : isClosing ? "mobile-sidebar-exit" : ""
          )}>
            {/* Header */}
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Printer className="w-5 h-5 text-white" />
                  </div>
                  <div className="ml-3">
                    <div className="text-lg font-bold text-slate-800">Smart Printing</div>
                    <div className="text-slate-500 text-xs font-medium uppercase tracking-wide">
                      <div>Professional Print</div>
                      <div>Management</div>
                    </div>
                  </div>
                </div>
                <button
                  onClick={handleMobileMenuClose}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-2">
              {sideBarItems.map((link) => {
                const isActive = pathname === link.route;
                const IconComponent = getIconComponent(link.icons);
                
                return (
                  <Link
                    key={link.label}
                    href={link.route}
                    onClick={handleMobileMenuClose}
                    className={cn(
                      "flex items-center px-3 py-3 rounded-xl transition-all duration-300 group w-full",
                      isActive 
                        ? "bg-purple-600 text-white shadow-md" 
                        : "text-slate-600 hover:bg-purple-50 hover:text-purple-700"
                    )}
                  >
                    <div className="flex items-center w-full">
                      {IconComponent && (
                        <div className={cn(
                          "flex items-center w-6 h-6 rounded-lg transition-all duration-300 flex-shrink-0",
                          isActive 
                            ? "text-white" 
                            : "text-slate-500 group-hover:text-purple-600"
                        )}>
                          <IconComponent
                            size={20}
                            className="flex-shrink-0"
                          />
                        </div>
                      )}
                      <div className="ml-3">
                        <span className="font-medium whitespace-nowrap">
                          {link.label}
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </nav>
          </aside>
        </div>
      )}
    </>
  );
}