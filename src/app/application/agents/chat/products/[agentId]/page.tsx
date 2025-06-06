"use client";

import { useParams } from "next/navigation";
import { useAgentProducts } from "@/hooks/use-products";
import { ProductsGrid } from "@/components/application/chat/products/products-grid";
import { EmptyProducts } from "@/components/application/chat/products/empty-product";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import Link from "next/link";
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
import ProductForm from "@/components/application/chat/individual-product-form";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

export default function ProductsPage() {
  const params = useParams();
  const [isOpen, setIsOpen] = useState(false);
  const rawAgentId = params.agentId as string;
  const agentId = decodeURIComponent(rawAgentId || "").replace(/%[0-9A-Fa-f]{2}/g, '');

  

  const { productsData, productsLoading, productsError } =
    useAgentProducts(agentId);

  if (productsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (productsError) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center rounded-lg border border-dashed min-h-[400px] space-y-4">
        <h3 className="text-2xl font-bold">Error al cargar productos</h3>
        <p className="text-muted-foreground">
          Ocurrió un error al cargar los productos. Por favor, intenta
          nuevamente.
        </p>
        <Button variant="outline" onClick={() => window.location.reload()}>
          Reintentar
        </Button>
      </div>
    );
  }

  const products = productsData || [];
  const queryClient = useQueryClient();

  return (
    <div className="container py-8 space-y-6 p-5">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Productos</h1>
        {products.length > 0 && (
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                Nuevo producto
              </Button>
            </SheetTrigger>
            <SheetContent className="max-w-2xl overflow-y-auto">
              <SheetHeader>
                <SheetTitle>Edit profile</SheetTitle>
                <SheetDescription>
                  Make changes to your profile here. Click save when you're
                  done.
                </SheetDescription>
              </SheetHeader>
              <div className="py-4 overflow-y-auto">
                <ProductForm agentId={agentId} onSubmitSuccess={() => {
                  queryClient.invalidateQueries({ queryKey: ["agent-products", agentId] });
                  setIsOpen(false);
                }}/>
              </div>
            </SheetContent>
          </Sheet>
        )}
      </div>

      {products.length === 0 ? (
        <EmptyProducts agentId={agentId} />
      ) : (
        <ProductsGrid
          products={products.map((product) => ({
            ...product,
            category: product.category || undefined,
          }))}
        />
      )}
    </div>
  );
}
