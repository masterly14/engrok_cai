"use client";

import * as React from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { Plus } from "lucide-react";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CreditDisplayProps {
  amount: number;
  maxAmount?: number;
  className?: string;
}

export function CreditDisplay({
  amount,
  maxAmount = 1000,
  className,
}: CreditDisplayProps) {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest) => Math.round(latest));
  const displayText = useTransform(rounded, (latest) =>
    latest.toLocaleString()
  );

  React.useEffect(() => {
    const animation = animate(count, amount, {
      duration: 2,
      ease: "easeOut",
    });

    return animation.stop;
  }, [amount, count]);

  const percentage = Math.min(100, Math.round((amount / maxAmount) * 100));

  return (
    <>
      <SidebarGroup className={cn("px-4 py-2", className)}>
          <div
            className="rounded-lg border bg-background border-[var(--border)] p-4 shadow-sm"
            style={{ color: "var(--card-foreground)" }}
          >
            <div className="mb-3 flex items-center justify-between">
              <SidebarGroupLabel
                className="m-0 p-0 text-sm font-medium"
                style={{ color: "var(--foreground)" }}
              >
                Tus créditos
              </SidebarGroupLabel>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 gap-1 text-xs hover:bg-[var(--secondary)] text-[var(--primary)] hover:text-[var(--primary-foreground)]"
              >
                <Plus className="h-3 w-3" />
                Agregar
              </Button>
            </div>

            <SidebarGroupContent className="p-0">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm text-[var(--muted-foreground)]">
                  Disponibles
                </span>
                <motion.span className="text-lg font-semibold text-[var(--foreground)]">
                  {displayText}
                </motion.span>
              </div>

              <Progress
                value={percentage}
                className="h-1.5 bg-[var(--muted)]"
              />

              <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-[var(--muted-foreground)]">
                    Inicial/mes
                  </span>
                  <p className="font-medium text-[var(--foreground)]">
                    {maxAmount.toLocaleString()}
                  </p>
                </div>
                <div>
                  <span className="text-[var(--muted-foreground)]">
                    Usados este mes
                  </span>
                  <p className="font-medium text-[var(--foreground)]">
                    {(maxAmount - amount).toLocaleString()}
                  </p>
                </div>
              </div>
            </SidebarGroupContent>
          </div>
      </SidebarGroup>
    </>
  );
}
