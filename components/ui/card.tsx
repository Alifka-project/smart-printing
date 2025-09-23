import React from "react";
import { cn } from "@/lib/utils";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: "default" | "elevated" | "outlined";
  hover?: boolean;
}

export function Card({ 
  children, 
  variant = "default", 
  hover = true, 
  className = "", 
  ...props 
}: CardProps) {
  return (
    <div
      className={cn(
        "bg-surface border border-border rounded-2xl transition-all duration-200",
        "focus:outline-none focus:ring-2 focus:ring-primary/20",
        variant === "elevated" && "bg-elev shadow-lg",
        variant === "outlined" && "border-2",
        hover && "hover:shadow-lg hover:-translate-y-1",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function CardHeader({ children, className = "", ...props }: CardHeaderProps) {
  return (
    <div
      className={cn("p-6 pb-4", className)}
      {...props}
    >
      {children}
    </div>
  );
}

interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  children: React.ReactNode;
  as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
}

export function CardTitle({ 
  children, 
  as: Component = "h3", 
  className = "", 
  ...props 
}: CardTitleProps) {
  return (
    <Component
      className={cn("text-xl font-semibold text-foreground", className)}
      {...props}
    >
      {children}
    </Component>
  );
}

interface CardDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {
  children: React.ReactNode;
}

export function CardDescription({ children, className = "", ...props }: CardDescriptionProps) {
  return (
    <p
      className={cn("text-muted-foreground mt-1", className)}
      {...props}
    >
      {children}
    </p>
  );
}

interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function CardContent({ children, className = "", ...props }: CardContentProps) {
  return (
    <div
      className={cn("p-6 pt-0", className)}
      {...props}
    >
      {children}
    </div>
  );
}

interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function CardFooter({ children, className = "", ...props }: CardFooterProps) {
  return (
    <div
      className={cn("p-6 pt-0 flex items-center justify-between", className)}
      {...props}
    >
      {children}
    </div>
  );
}
