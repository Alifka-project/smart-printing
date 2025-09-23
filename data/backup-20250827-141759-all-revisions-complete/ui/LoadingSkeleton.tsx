import React from "react";
import { cn } from "@/lib/utils";

interface LoadingSkeletonProps {
  className?: string;
  lines?: number;
  height?: string;
}

export function LoadingSkeleton({ 
  className = "", 
  lines = 1, 
  height = "h-4" 
}: LoadingSkeletonProps) {
  return (
    <div className={cn("space-y-3", className)}>
      {Array.from({ length: lines }).map((_, index) => (
        <div
          key={index}
          className={cn(
            "bg-muted animate-pulse rounded-lg",
            height,
            index === lines - 1 ? "w-full" : "w-3/4"
          )}
        />
      ))}
    </div>
  );
}

interface TableSkeletonProps {
  rows?: number;
  columns?: number;
  className?: string;
}

export function TableSkeleton({ 
  rows = 5, 
  columns = 4, 
  className = "" 
}: TableSkeletonProps) {
  return (
    <div className={cn("bg-surface border border-border rounded-2xl overflow-hidden", className)}>
      <div className="p-6 border-b border-border">
        <LoadingSkeleton lines={1} height="h-6" className="w-1/3" />
      </div>
      
      <div className="p-6 space-y-4">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="flex space-x-4">
            {Array.from({ length: columns }).map((_, colIndex) => (
              <div
                key={colIndex}
                className={cn(
                  "bg-muted animate-pulse rounded-lg",
                  "h-4",
                  colIndex === 0 ? "w-1/4" : colIndex === columns - 1 ? "w-1/6" : "w-1/3"
                )}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

interface CardSkeletonProps {
  className?: string;
}

export function CardSkeleton({ className = "" }: CardSkeletonProps) {
  return (
    <div className={cn("bg-surface border border-border rounded-2xl p-6", className)}>
      <div className="space-y-4">
        <LoadingSkeleton lines={1} height="h-6" className="w-1/2" />
        <LoadingSkeleton lines={2} height="h-4" />
        <LoadingSkeleton lines={1} height="h-10" className="w-1/3" />
      </div>
    </div>
  );
}
