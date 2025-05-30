"use client"

import { useState, useEffect } from "react"
import {
  Package,
  PlusCircle,
  Trash2,
  ImageIcon,
  DollarSign,
  Hash,
  Tag,
  FileText,
  Link,
  Sparkles,
  Building2,
  AlertCircle,
  CheckCircle,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import Image from "next/image"
import { toast } from "sonner"
import { productValidatorAgent } from "@/agents/productValidatorAgent"

// Tipo para un producto individual
export type ProductForm = {
  id: string
  name: string
  description: string
  price: number
  stock: number
  images: string[]
  category: string
}



interface ProductsStepProps {
  formData: {
    products: ProductForm[]
  }
  updateFormData: (data: Partial<ProductsStepProps["formData"]>) => void
  onValidationComplete?: (isValid: boolean, validations: Record<string, { isValid: boolean; recommendations?: string[] }>) => void
}

export default function ProductsStep({ formData, updateFormData, onValidationComplete }: ProductsStepProps) {
  const [localProducts, setLocalProducts] = useState<ProductForm[]>(() => {
    if (!formData.products || formData.products.length === 0) {
      const defaultProduct: ProductForm = {
        id: crypto.randomUUID(),
        name: "",
        description: "",
        price: 0,
        stock: 0,
        images: [],
        category: "",
      }
      return [defaultProduct]
    }
    return formData.products
  })

  // Estado para las validaciones de cada producto
  const [productValidations, setProductValidations] = useState<Record<string, { isValid: boolean; recommendations?: string[] }>>({})
  
  useEffect(() => {
    if (localProducts.length > 0 && (!formData.products || formData.products.length === 0)) {
      updateFormData({ products: localProducts })
    }
  }, [])


  // Añade un nuevo producto vacío
  const addProduct = (): void => {
    const newProduct: ProductForm = {
      id: crypto.randomUUID(),
      name: "",
      description: "",
      price: 0,
      stock: 0,
      images: [],
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

  // Modificar la función handleChange para eliminar la validación automática
  const handleChange = (id: string, field: keyof ProductForm, value: any) => {
    const updated = localProducts.map((p) => (p.id === id ? { ...p, [field]: value } : p))
    setLocalProducts(updated)
    updateFormData({ products: updated })
  }
  
  // Función para validar un producto individual
  const validateProduct = async (product: ProductForm) => {
    const validation = await productValidatorAgent.validateProduct({
      name: product.name,
      description: product.description,
      category: product.category,
      price: product.price
    })
    
    setProductValidations(prev => ({
      ...prev,
      [product.id]: validation
    }))
    
    return validation.isValid
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

  const getCompletionPercentage = (product: ProductForm) => {
    const fields = [product.name, product.description, product.category]
    const filledFields = fields.filter((field) => field && field.trim() !== "").length
    const hasPrice = product.price > 0
    const hasStock = product.stock >= 0
    const hasImages = product.images.length > 0

    const totalChecks = fields.length + 3 // 4 text fields + price + stock + images
    const completedChecks = filledFields + (hasPrice ? 1 : 0) + (hasStock ? 1 : 0) + (hasImages ? 1 : 0)

    return Math.round((completedChecks / totalChecks) * 100)
  }

  // Función para validar todos los productos
  const validateAllProducts = async () => {
    const validations: Record<string, { isValid: boolean; recommendations?: string[] }> = {}
    let allValid = true
    
    for (const product of localProducts) {
      const isValid = await validateProduct(product)
      if (!isValid) {
        allValid = false
      }
    }
    
    // Notificar al componente padre si se proporcionó el callback
    if (onValidationComplete) {
      onValidationComplete(allValid, validations)
    }
    
    return allValid
  }
  
  // Exponer la función de validación para que el padre pueda llamarla
  useEffect(() => {
    // Agregar la función al objeto window temporalmente para que el padre pueda acceder
    (window as any).validateProducts = validateAllProducts
    
    return () => {
      delete (window as any).validateProducts
    }
  }, [localProducts])

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header con animación */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-3 text-primary">
          <div className="p-3 bg-primary/10 rounded-full">
            <Building2 size={28} className="text-primary" />
          </div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Tu Negocio y Productos
          </h2>
          <Sparkles size={24} className="text-primary animate-pulse" />
        </div>
        <p className="text-muted-foreground text-lg">
          Configura la información de tu negocio y añade tus productos increíbles
        </p>
      </div>

      {/* Sección de Productos */}
      <div className="space-y-6">
        <div className="flex items-center gap-2 text-primary">
          <Package size={24} />
          <h3 className="text-2xl font-semibold">
            Productos{" "}
            {localProducts.length > 0 && (
              <span className="text-lg text-muted-foreground">({localProducts.length})</span>
            )}
          </h3>
        </div>

        {localProducts.map((product, idx) => {
          const completion = getCompletionPercentage(product)
          return (
            <Card
              key={product.id}
              className="border-2 border-muted-foreground/10 hover:border-primary/20 transition-all duration-300 hover:shadow-lg bg-gradient-to-br from-background to-muted/20"
            >
              <CardContent className="pt-6 space-y-6">
                {/* Header del producto con progreso */}
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold text-sm">
                        {idx + 1}
                      </div>
                      <h4 className="font-semibold text-lg">{product.name || `Producto ${idx + 1}`}</h4>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-primary to-primary/60 transition-all duration-500 ease-out"
                          style={{ width: `${completion}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground font-medium">{completion}% completo</span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeProduct(product.id)}
                    className="hover:bg-destructive/10 hover:text-destructive transition-colors"
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>

                {/* Campos principales en grid mejorado */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Nombre */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2 text-sm font-medium">
                      <Tag size={16} className="text-primary" />
                      Nombre del producto
                    </Label>
                    <Input
                      value={product.name}
                      onChange={(e) => handleChange(product.id, "name", e.target.value)}
                      placeholder="Ej: iPhone 15 Pro Max"
                      className="border-2 focus:border-primary transition-colors"
                    />
                  </div>

                  {/* Precio */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2 text-sm font-medium">
                      <DollarSign size={16} className="text-green-600" />
                      Precio
                    </Label>
                    <div className="relative">
                      <DollarSign
                        size={16}
                        className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"
                      />
                      <Input
                        type="number"
                        min={0}
                        step="0.01"
                        value={product.price}
                        onChange={(e) => handleChange(product.id, "price", Number.parseFloat(e.target.value))}
                        placeholder="0.00"
                        className="pl-10 border-2 focus:border-green-500 transition-colors"
                      />
                    </div>
                  </div>

                  {/* Stock */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2 text-sm font-medium">
                      <Hash size={16} className="text-blue-600" />
                      Stock disponible
                    </Label>
                    <Input
                      type="number"
                      min={0}
                      value={product.stock}
                      onChange={(e) => handleChange(product.id, "stock", Number.parseInt(e.target.value || "0"))}
                      placeholder="Ej: 50"
                      className="border-2 focus:border-blue-500 transition-colors"
                    />
                  </div>

                  {/* Categoría */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2 text-sm font-medium">
                      <Package size={16} className="text-purple-600" />
                      Categoría
                    </Label>
                    <Input
                      value={product.category}
                      onChange={(e) => handleChange(product.id, "category", e.target.value)}
                      placeholder="Ej: Electrónica, Ropa, Hogar"
                      className="border-2 focus:border-purple-500 transition-colors"
                    />
                  </div>
                </div>

                {/* Descripción */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-sm font-medium">
                    <FileText size={16} className="text-orange-600" />
                    Descripción
                  </Label>
                  <Textarea
                    value={product.description}
                    onChange={(e) => handleChange(product.id, "description", e.target.value)}
                    placeholder="Describe tu producto de manera atractiva. ¿Qué lo hace especial?"
                    className="min-h-[100px] border-2 focus:border-orange-500 transition-colors resize-none"
                  />
                  
                  {/* Mostrar recomendaciones solo si existen y el producto no es válido */}
                  {productValidations[product.id] && !productValidations[product.id].isValid && (
                    <div className="mt-3 space-y-2 p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                      <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-medium text-sm">
                        <AlertCircle size={16} />
                        Sugerencias para mejorar tu descripción:
                      </div>
                      <ul className="space-y-1.5 text-sm text-amber-600 dark:text-amber-500">
                        {productValidations[product.id].recommendations?.map((rec, index) => (
                          <li key={index} className="flex items-start gap-1">
                            <span className="mt-0.5">•</span>
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Sección de imágenes mejorada */}
                <div className="space-y-3">
                  <Label className="flex items-center gap-2 text-sm font-medium">
                    <ImageIcon size={16} className="text-pink-600" />
                    Imágenes del producto
                  </Label>
                  <div className="border-2 border-dashed border-muted-foreground/20 rounded-lg p-6 bg-muted/10">
                    <div className="flex flex-wrap gap-4 items-center justify-center">
                      {product.images.map((src, i) => (
                        <div key={i} className="relative group">
                          <Image
                            src={src || "/placeholder.svg"}
                            alt={`Imagen ${i + 1}`}
                            width={100}
                            height={100}
                            className="rounded-lg object-cover border-2 border-muted shadow-md group-hover:shadow-lg transition-shadow"
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 rounded-lg transition-colors" />
                        </div>
                      ))}

                      <Button
                        asChild
                        variant="outline"
                        size="lg"
                        className="border-2 border-dashed border-primary/50 hover:border-primary hover:bg-primary/5 transition-all min-h-[100px] min-w-[100px] flex-col gap-2"
                      >
                        <label className="cursor-pointer">
                          <ImageIcon size={24} className="text-primary" />
                          <span className="text-xs font-medium">Subir imagen</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handleImageUpload(product.id, e.target.files)}
                          />
                        </label>
                      </Button>
                    </div>
                    {product.images.length === 0 && (
                      <p className="text-center text-muted-foreground text-sm mt-2">
                        Las imágenes ayudan a vender más. ¡Sube al menos una!
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}

        {/* Botón para agregar producto */}
        <div className="flex justify-center">
          <Button
            variant="outline"
            size="lg"
            className="flex items-center gap-3 border-2 border-dashed border-primary/50 hover:border-primary hover:bg-primary/5 transition-all py-6 px-8 text-lg font-medium"
            onClick={addProduct}
          >
            <div className="p-2 bg-primary/10 rounded-full">
              <PlusCircle size={20} className="text-primary" />
            </div>
            {localProducts.length === 0 ? "Crear mi primer producto" : "Añadir otro producto"}
          </Button>
        </div>
      </div>
    </div>
  )
}
