"use client";

import React from "react";
import { toast as sonnerToast, Toaster as SonnerToaster } from "sonner";
import { cn } from "@/lib/utils";
import { CheckCircle, XCircle, AlertTriangle, Info, X } from "lucide-react";

interface ToastProps {
  title: string;
  description?: string;
  type?: "success" | "error" | "warning" | "info";
  duration?: number;
}

const toastIcons = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

const toastStyles = {
  success: "border-green-200 bg-green-50 text-green-800",
  error: "border-red-200 bg-red-50 text-red-800",
  warning: "border-[#f89d1d]/20 bg-[#f89d1d]/10 text-[#f89d1d]/80",
  info: "border-[#27aae1]/20 bg-[#27aae1]/10 text-[#27aae1]/80",
};

export function toast({ title, description, type = "info", duration = 4000 }: ToastProps) {
  const Icon = toastIcons[type];
  
  return sonnerToast.custom(
    (t) => (
      <div
        className={cn(
          "flex items-start space-x-3 p-4 rounded-2xl border shadow-lg",
          "min-w-[320px] max-w-[480px]",
          toastStyles[type]
        )}
      >
        <Icon className="w-5 h-5 mt-0.5 flex-shrink-0" />
        
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-sm">{title}</h4>
          {description && (
            <p className="text-sm mt-1 opacity-90">{description}</p>
          )}
        </div>
        
        <button
          onClick={() => sonnerToast.dismiss(t)}
          className="p-1 rounded-full hover:bg-black/10 transition-colors duration-200"
          aria-label="Dismiss toast"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    ),
    {
      duration,
      position: "top-right",
    }
  );
}

// Convenience methods
export const toastSuccess = (title: string, description?: string) => 
  toast({ title, description, type: "success" });

export const toastError = (title: string, description?: string) => 
  toast({ title, description, type: "error" });

export const toastWarning = (title: string, description?: string) => 
  toast({ title, description, type: "warning" });

export const toastInfo = (title: string, description?: string) => 
  toast({ title, description, type: "info" });

// Export the Sonner Toaster for use in layout
export { SonnerToaster };
