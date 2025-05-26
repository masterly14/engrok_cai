"use client"

import { useState } from "react"
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import ProductsStep, {
  ProductForm,
} from "@/components/application/chat/products-step"
import { useCreateAgentProducts } from "@/hooks/use-products"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

interface AssignProductsModalProps {
  /**
   * React element that will act as the button/element that opens the modal.
   * It will be wrapped with `DialogTrigger asChild`, so make sure it can accept refs.
   */
  trigger: React.ReactElement
  /**
   * ID of the chat agent to assign products to
   */
  agentId: string
}

export default function AssignProductsModal({
  trigger,
  agentId,
}: AssignProductsModalProps) {
  const [formData, setFormData] = useState<{ products: ProductForm[] }>({
    products: [],
  })
  const [isOpen, setIsOpen] = useState(false)
  
  const createProductsMutation = useCreateAgentProducts()

  const updateFormData = (
    data: Partial<{ products: ProductForm[] }>
  ) => {
    setFormData((prev) => ({ ...prev, ...data }))
  }

  const handleSave = async () => {
    if (!formData.products || formData.products.length === 0) {
      toast.error("Debe agregar al menos un producto")
      return
    }

    // Validar que todos los productos tienen los campos requeridos
    for (const product of formData.products) {
      if (!product.name || !product.description || product.price <= 0) {
        toast.error(`Producto incompleto: ${product.name || 'Sin nombre'}`)
        return
      }
    }

    try {
      await createProductsMutation.mutateAsync({ 
        agentId, 
        products: formData.products 
      })
      setIsOpen(false)
      // Limpiar el formulario
      window.location.reload()
      setFormData({ products: [] })
    } catch (error) {
      // El error ya se maneja en el hook
      console.error("Error saving products:", error)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Asignar productos</DialogTitle>
          <DialogDescription>
            Añade nuevos productos para este agente. Completa la información y
            guarda los cambios.
          </DialogDescription>
        </DialogHeader>

        <ProductsStep formData={formData} updateFormData={updateFormData} />

        <DialogFooter className="mt-4">
          <DialogClose asChild>
            <Button variant="outline" disabled={createProductsMutation.isPending}>
              Cancelar
            </Button>
          </DialogClose>
          <Button 
            onClick={handleSave} 
            disabled={createProductsMutation.isPending || formData.products.length === 0}
            className="flex items-center gap-2"
          >
            {createProductsMutation.isPending && (
              <Loader2 className="h-4 w-4 animate-spin" />
            )}
            Guardar productos
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 