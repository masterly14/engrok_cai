import type * as React from "react";
import { cn } from "@/lib/utils";

interface LoadingSpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  variant?: "primary" | "secondary" | "ghost";
}

export function LoadingSpinner({
  size = "md",
  variant = "primary",
  className,
  ...props
}: LoadingSpinnerProps) {
  const sizeClasses = {
    xs: "h-3 w-3 border-[1.5px]",
    sm: "h-4 w-4 border-2",
    md: "h-6 w-6 border-2",
    lg: "h-8 w-8 border-[3px]",
    xl: "h-12 w-12 border-4",
  };

  const variantClasses = {
    primary: "border-primary/30 border-t-primary",
    secondary: "border-secondary/30 border-t-secondary",
    ghost: "border-muted-foreground/30 border-t-muted-foreground",
  };

  return (
    <div
      className={cn(
        "animate-spin rounded-full",
        sizeClasses[size],
        variantClasses[variant],
        className,
      )}
      {...props}
    />
  );
}
