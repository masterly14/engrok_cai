"use client";

import { Calendar, Building2, MoreHorizontal } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card, CardContent } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import type { Lead, Tag } from "@/lib/data";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { deleteLead } from "@/actions/crm";

interface LeadCardProps {
  lead: Lead;
  tags: Tag[];
  onClick: () => void;
  compact?: boolean; // Nueva propiedad para modo compacto
}

export function LeadCard({
  lead,
  tags,
  onClick,
  compact = false,
}: LeadCardProps) {
  // Ajustar clases basadas en modo compacto
  const paddingClass = compact ? "p-2" : "p-3";
  const titleClass = compact ? "text-xs font-medium" : "font-medium text-sm";
  const iconSize = compact ? "h-2.5 w-2.5" : "h-3 w-3";
  const textSize = compact ? "text-[10px]" : "text-xs";
  const buttonSize = compact ? "h-6 w-6" : "h-8 w-8";
  const valueClass = compact ? "text-xs font-medium" : "text-sm font-medium";
  const tagClass = compact ? "text-[9px] px-1 py-0.5" : "text-xs";
  const marginClass = compact ? "mt-1" : "mt-2";

  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={onClick}
    >
      <CardContent className={paddingClass}>
        <div className="flex justify-between items-start">
          <div>
            <h3 className={titleClass}>{lead.name}</h3>
            <div
              className={`flex items-center text-muted-foreground ${textSize} ${compact ? "mt-0.5" : "mt-1"}`}
            >
              <Building2 className={`${iconSize} mr-1`} />
              {lead.company}
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="sm" className={`${buttonSize} p-0`}>
                <MoreHorizontal className={compact ? "h-3 w-3" : "h-4 w-4"} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Edit</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {lead.tags.length > 0 && (
          <div className={`flex flex-wrap gap-0.5 ${marginClass}`}>
            {lead.tags.map((tagName) => {
              const tagData = tags.find((t) => t.name === tagName);
              return tagData ? (
                <Badge
                  key={tagName}
                  variant="outline"
                  className={tagClass}
                  style={{
                    borderColor: tagData.color,
                    backgroundColor: `${tagData.color}20`, // 20% opacity
                    color: tagData.color,
                  }}
                >
                  {compact && tagName.length > 8
                    ? `${tagName.substring(0, 6)}...`
                    : tagName}
                </Badge>
              ) : null;
            })}
          </div>
        )}

        <div
          className={`flex items-center text-muted-foreground ${textSize} ${marginClass}`}
        >
          <Calendar className={`${iconSize} mr-1`} />
          {compact ? "Last: " : "Last contact: "}
          {formatDate(lead.lastContact)}
        </div>

        {lead.value && (
          <div className={`${marginClass} ${valueClass}`}>
            ${lead.value.toLocaleString()}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
