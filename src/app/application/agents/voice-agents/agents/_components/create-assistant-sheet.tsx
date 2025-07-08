import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Plus } from "lucide-react";
import React from "react";

type Props = {};

const CreateAssistantSheet = (props: Props) => {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="flex gap-2 w-[70%] bg-gradient-to-r from-gray-900 via-blue-900 to-gray-900 border border-blue-500/30 hover:border-blue-400/50 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 text-white"
        >
          <Plus className="h-5 w-5" />
          <p className="text-sm font-medium">Nuevo agente</p>
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Nuevo agente</SheetTitle>
        </SheetHeader>
      </SheetContent>
    </Sheet>
  );
};

export default CreateAssistantSheet;
