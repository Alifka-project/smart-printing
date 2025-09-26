"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getSidebarItems } from "@/constants";
import { getUser } from "@/lib/auth";

const Sidebar = () => {
  const pathname = usePathname();
  const [role, setRole] = React.useState<"admin" | "estimator">("estimator");
  const [isCollapsed, setIsCollapsed] = React.useState(false);

  React.useEffect(() => {
    const u = getUser();
    console.log('Sidebar: Current user:', u);
    if (u?.role === "admin" || u?.role === "estimator") {
      setRole(u.role);
      console.log('Sidebar: Setting role to:', u.role);
    } else {
      console.log('Sidebar: No valid role found, defaulting to admin');
      setRole("admin"); // Default to admin for now
    }
  }, []);

  const sideBarItems = getSidebarItems(role);

  return (
    <aside className={cn(
      "sticky z-10 top-0 left-0 bg-purple-600 shadow-lg min-h-screen transition-all duration-500 ease-in-out",
      isCollapsed ? "w-20" : "w-80"
    )}>
      {/* Header with Admin User Info */}
      <div className="p-4 border-b border-purple-500">
        {!isCollapsed && (
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-purple-700 rounded-full flex items-center justify-center">
              <span className="text-white font-semibold text-sm">J</span>
            </div>
            <span className="text-white font-medium">{role}</span>
          </div>
        )}
        
        {isCollapsed && (
          <div className="w-8 h-8 bg-purple-700 rounded-full flex items-center justify-center mx-auto">
            <span className="text-white font-semibold text-sm">J</span>
          </div>
        )}
      </div>

      {/* Navigation Items */}
      <div className="p-4 space-y-2">
        {sideBarItems.map((link) => {
          const isActive = pathname === link.route;
          const IconComponent = link.icons;
          return (
            <Link className="block" href={link.route} key={link.label}>
              <div
                className={cn(
                  "flex items-center p-3 rounded-lg transition-all duration-300 group",
                  isActive 
                    ? "bg-purple-700 text-white shadow-md" 
                    : "text-purple-100 hover:bg-purple-500 hover:text-white"
                )}
              >
                {!!IconComponent && (
                  <IconComponent
                    size={20}
                    className="flex-shrink-0"
                  />
                )}
                {!isCollapsed && (
                  <span className={cn(
                    "ml-3 font-medium transition-opacity duration-300",
                    isCollapsed ? "opacity-0" : "opacity-100"
                  )}>
                    {link.label}
                  </span>
                )}
              </div>
            </Link>
          );
        })}
      </div>

      {/* Toggle Button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute bottom-4 left-4 right-4 p-2 rounded-lg bg-purple-700 hover:bg-purple-800 text-white transition-colors"
      >
        {isCollapsed ? <ChevronRight className="w-4 h-4 mx-auto" /> : <ChevronLeft className="w-4 h-4 mx-auto" />}
      </button>

      {/* Bottom Icon */}
      <div className="absolute bottom-16 left-4 right-4">
        <div className="w-8 h-8 bg-purple-700 rounded-full flex items-center justify-center mx-auto">
          <span className="text-white font-semibold text-sm">N</span>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;