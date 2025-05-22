"use client"

import React, { useState } from "react"
import {
  Package,
  PlusCircle,
  Trash2,
  Image as ImageIcon,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import Image from "next/image"
import { toast } from "sonner"

// Tipo para un producto individual
export type ProductForm = {
  id: string
  name: string
  description: string
  price: number
  stock: number
  images: string[]
  payment_link: string
  category: string
}

interface ProductsStepProps {
  formData: {
    products: ProductForm[]
  }
  updateFormData: (data: Partial<ProductsStepProps["formData"]>) => void
}

export default function ProductsStep({ formData, updateFormData }: ProductsStepProps) {
  const [localProducts, setLocalProducts] = useState<ProductForm[]>(formData.products || [])

  // Añade un nuevo producto vacío
  const addProduct = () => {
    const newProduct: ProductForm = {
      id: crypto.randomUUID(),
      name: "",
      description: "",
      price: 0,
      stock: 0,
      images: [],
      payment_link: "",
      category: "",
    }
    const updated = [...localProducts, newProduct]
    setLocalProducts(updated)
    updateFormData({ products: updated })
  }

  // Elimina un producto según su ID
  const removeProduct = (id: string) => {
    const updated = localProducts.filter((p) => p.id !== id)
    setLocalProducts(updated)
    updateFormData({ products: updated })
  }

  // Maneja cambios en un campo de un producto
  const handleChange = (id: string, field: keyof ProductForm, value: any) => {
    const updated = localProducts.map((p) => (p.id === id ? { ...p, [field]: value } : p))
    setLocalProducts(updated)
    updateFormData({ products: updated })
  }

  // Sube la imagen a la API que integra Cloudinary y guarda la URL resultante
  const handleImageUpload = async (id: string, files: FileList | null) => {
    if (!files || files.length === 0) return
    const file = files[0]

    const form = new FormData()
    form.append("file", file)

    try {
      const res = await fetch("/api/upload-image", {
        method: "POST",
        body: form,
      })

      if (!res.ok) throw new Error("Upload failed")

      const { url } = await res.json()
      const product = localProducts.find((p) => p.id === id)
      if (!product) return
      const updatedImages = [...product.images, url]
      handleChange(id, "images", updatedImages)
      toast("Imagen subida correctamente")
    } catch (e) {
      console.error(e)
      toast("Error al subir la imagen")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-primary mb-4">
        <Package size={24} />
        <h2 className="text-xl font-semibold">Productos</h2>
      </div>

      <div className="space-y-4">
        {localProducts.map((product, idx) => (
          <Card key={product.id} className="border-muted-foreground/20">
            <CardContent className="pt-6 space-y-4">
              <div className="flex justify-between items-start">
                <h3 className="font-medium">Producto {idx + 1}</h3>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeProduct(product.id)}
                >
                  <Trash2 size={16} />
                </Button>
              </div>

              {/* Campos del producto */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nombre</Label>
                  <Input
                    value={product.name}
                    onChange={(e) => handleChange(product.id, "name", e.target.value)}
                    placeholder="Nombre del producto"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Precio</Label>
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    value={product.price}
                    onChange={(e) => handleChange(product.id, "price", parseFloat(e.target.value))}
                    placeholder="0.00"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Stock</Label>
                  <Input
                    type="number"
                    min={0}
                    value={product.stock}
                    onChange={(e) => handleChange(product.id, "stock", parseInt(e.target.value || "0"))}
                    placeholder="0"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Categoría</Label>
                  <Input
                    value={product.category}
                    onChange={(e) => handleChange(product.id, "category", e.target.value)}
                    placeholder="Ej: Electrónica"
                  />
                </div>

                <div className="col-span-full space-y-2">
                  <Label>Descripción</Label>
                  <Textarea
                    value={product.description}
                    onChange={(e) => handleChange(product.id, "description", e.target.value)}
                    placeholder="Descripción detallada del producto"
                    className="min-h-[80px]"
                  />
                </div>
              </div>

              {/* Imágenes */}
              <div className="space-y-2">
                <Label>Imágenes</Label>
                <div className="flex flex-wrap gap-4 items-center">
                  {product.images.map((src, i) => (
                    <Image
                      key={i}
                      src={src}
                      alt={`Imagen ${i + 1}`}
                      width={80}
                      height={80}
                      className="rounded-md object-cover border"
                    />
                  ))}

                  <Button asChild variant="secondary" size="sm" className="gap-1">
                    <label className="flex items-center cursor-pointer">
                      <ImageIcon size={16} /> Subir
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleImageUpload(product.id, e.target.files)}
                      />
                    </label>
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Link de pago</Label>
                <Input
                  value={product.payment_link}
                  onChange={(e) => handleChange(product.id, "payment_link", e.target.value)}
                  placeholder="https://mi-tienda.com/checkout/123"
                />
              </div>
            </CardContent>
          </Card>
        ))}

        <Button variant="outline" className="flex items-center gap-2" onClick={addProduct}>
          <PlusCircle size={16} /> Añadir producto
        </Button>
      </div>
    </div>
  )
} 