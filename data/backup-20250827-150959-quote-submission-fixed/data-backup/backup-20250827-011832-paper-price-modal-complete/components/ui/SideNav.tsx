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
  Monitor,
  Activity,
  User,
  Printer,
  LucideIcon
} from "lucide-react";
import { getSidebarItems } from "@/constants";
import { getCurrentUser } from "@/lib/auth";

interface SideNavProps {
  className?: string;
}

export default function SideNav({ className = "" }: SideNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [role, setRole] = React.useState<"admin" | "estimator">("estimator");
  const [isExpanded, setIsExpanded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [user, setUser] = React.useState<any>(null);
  const [mounted, setMounted] = useState(false);

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
    <aside
      className={cn(
        "sticky top-0 left-0 h-screen transition-all duration-300 ease-in-out",
        "bg-white border-r border-slate-200 shadow-lg",
        isExpanded ? "w-64" : isHovered ? "w-64" : "w-16",
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Header */}
      <div className="p-4 border-b border-slate-200">
        {shouldExpand && (
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Printer className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-lg font-bold text-slate-800">Smart Printing</div>
              <div className="text-slate-500 text-xs font-medium uppercase tracking-wide">
                Professional Print Management
              </div>
            </div>
          </div>
        )}
        
        {!shouldExpand && (
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mx-auto">
            <Printer className="w-5 h-5 text-white" />
          </div>
        )}
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
                "flex items-center px-2 py-2 rounded-xl transition-all duration-300 group",
                isActive 
                  ? "bg-purple-600 text-white shadow-md" 
                  : "text-slate-600 hover:bg-purple-50 hover:text-purple-700",
                !shouldExpand && "justify-center"
              )}
            >
              {IconComponent && (
                <div className={cn(
                  "flex items-center justify-center w-6 h-6 rounded-lg transition-all duration-300 flex-shrink-0",
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
              {shouldExpand && (
                <span className="ml-3 font-medium transition-opacity duration-300">
                  {link.label}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
