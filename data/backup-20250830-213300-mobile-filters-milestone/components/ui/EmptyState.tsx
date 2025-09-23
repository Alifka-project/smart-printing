import React from "react";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export default function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className = ""
}: EmptyStateProps) {
  return (
    <div className={cn(
      "flex flex-col items-center justify-center p-12 text-center",
      "bg-surface border border-border rounded-2xl",
      className
    )}>
      {Icon && (
        <div className="w-16 h-16 bg-muted bg-opacity-50 rounded-full flex items-center justify-center mb-6">
          <Icon className="w-8 h-8 text-muted-foreground" />
        </div>
      )}
      
      <h3 className="text-xl font-semibold text-foreground mb-2">
        {title}
      </h3>
      
      {description && (
        <p className="text-muted-foreground max-w-md mb-6">
          {description}
        </p>
      )}
      
      {action && (
        <div className="flex items-center justify-center">
          {action}
        </div>
      )}
    </div>
  );
}
