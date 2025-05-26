import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import Link from "next/link";
import ProductForm from "../individual-product-form";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

interface EmptyProductsProps {
  agentId: string;
}

export function EmptyProducts({ agentId }: EmptyProductsProps) {
  return (
    <div className="flex flex-col items-center p-5 justify-center py-12 px-4 text-center rounded-lg border border-dashed min-h-[400px] space-y-4">
      <div className="max-w-md space-y-4">
        <h3 className="text-2xl font-bold">No hay productos</h3>
        <p className="text-muted-foreground">
          Tu agente aún no tiene productos para vender. Crea tu primer producto
          para que tu agente pueda comenzar a generar ventas.
        </p>
        <Sheet>
          <SheetTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Nuevo producto
            </Button>
          </SheetTrigger>
          <SheetContent className="overflow-y-auto p-6">
            <SheetHeader>
              <SheetTitle>Crear producto</SheetTitle>
              <SheetDescription>
                Crea productos para que tu agente pueda comenzar a generar ventas.
              </SheetDescription>
            </SheetHeader>
            <div className="py-4">
              <ProductForm agentId={agentId}/>
            </div>
            <SheetFooter>
              <SheetClose asChild>
                <Button type="submit">Guardar producto</Button>
              </SheetClose>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}
