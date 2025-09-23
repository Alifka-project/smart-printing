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
        isExpanded ? "w-72" : isHovered ? "w-72" : "w-16",
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
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
  );
}