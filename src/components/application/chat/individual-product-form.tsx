"use client"


import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Package, PlusCircle, Trash2, ImageIcon, Loader2, Save, AlertCircle } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import Image from "next/image"
import { toast } from "sonner"
import { Form } from "@/components/ui/form"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { createAgentProducts } from "@/actions/producs"
import { productValidatorAgent } from "@/agents/productValidatorAgent"

// Esquema de validación para un producto
const productSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio"),
  description: z.string().min(10, "La descripción debe tener al menos 10 caracteres"),
  price: z.number().min(0.01, "El precio debe ser mayor a 0"),
  stock: z.number().min(0, "El stock no puede ser negativo"),
  images: z.array(z.string()).min(1, "Debe subir al menos una imagen"),
  payment_link: z.string().url("Debe ser una URL válida"),
  category: z.string().min(1, "La categoría es obligatoria"),
})

// Esquema para el formulario completo
const formSchema = z.object({
  products: z.array(productSchema).min(1, "Debe agregar al menos un producto"),
})

// Tipo para un producto individual
export type ProductForm = {
  id: string
  name: string
  description: string
  businessInfo: {
    name: string
    description: string
  }
  price: number
  stock: number
  images: string[]
  category: string
}

// Tipo para los datos del formulario
type FormData = {
  products: ProductForm[]
}

interface ProductFormProps {
  initialProducts?: ProductForm[]
  onSubmitSuccess?: (data: FormData) => void
  agentId?: string
}

export default function ProductForm({ initialProducts = [], onSubmitSuccess, agentId }: ProductFormProps) {
  const queryClient = useQueryClient()
  // Estado local para los productos
  const [localProducts, setLocalProducts] = useState<ProductForm[]>(
    initialProducts.length > 0
      ? initialProducts
      : [
          {
            id: crypto.randomUUID(),
            name: "",
            description: "",
            businessInfo: {
              name: "",
              description: "",
            },
            price: 0,
            stock: 0,
            images: [],
            category: "",
          },
        ],
  )

  // Estado para controlar la carga durante el envío
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Estado para las validaciones de cada producto
  const [productValidations, setProductValidations] = useState<Record<string, { isValid: boolean; recommendations?: string[] }>>({})

  // Configuración del formulario con React Hook Form
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema as any),
    defaultValues: {
      products: localProducts,
    },
  })

  const createProductsMutation = useMutation({
    mutationFn: async (data: FormData) => {
      if (!agentId) throw new Error("Missing agentId")
      const response = await createAgentProducts(agentId, data.products)
      return response.data
    },
    onSuccess: (data) => {
      toast.success("Productos guardados correctamente")
      queryClient.invalidateQueries({ queryKey: ["conversations", agentId] })
      if (onSubmitSuccess) {
        onSubmitSuccess({ 
          products: data.map((product) => ({ 
            id: product.id,
            businessInfo: {
              name: product.name,
              description: product.description || "",
            },
            name: product.name,
            description: product.description || "",
            price: product.price,
            stock: product.stock,
            images: (product.images as string[]) || [],
            category: product.category || ""
          }))
        })
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || "Error al guardar los productos")
    }
  })

  // Añade un nuevo producto vacío
  const addProduct = () => {
    const newProduct: ProductForm = {
      id: crypto.randomUUID(),
      name: "",
      description: "",
      price: 0,
      businessInfo: {
        name: "",
        description: "",
      },
      stock: 0,
      images: [],
      category: "",
    }
    const updated = [...localProducts, newProduct]
    setLocalProducts(updated)
    form.setValue("products", updated)
  }

  // Elimina un producto según su ID
  const removeProduct = (id: string) => {
    if (localProducts.length <= 1) {
      toast.error("Debe haber al menos un producto")
      return
    }

    const updated = localProducts.filter((p) => p.id !== id)
    setLocalProducts(updated)
    form.setValue("products", updated)
  }

  // Maneja cambios en un campo de un producto
  const handleChange = (id: string, field: keyof ProductForm, value: any) => {
    const updated = localProducts.map((p) => (p.id === id ? { ...p, [field]: value } : p))
    setLocalProducts(updated)
    form.setValue("products", updated)
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
      toast.success("Imagen subida correctamente")
    } catch (e) {
      console.error(e)
      toast.error("Error al subir la imagen")
    }
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
    
    return allValid
  }

  // Modificar el onSubmit para incluir la validación
  const onSubmit = async (data: FormData) => {
    try {
      setIsSubmitting(true)
      const isValid = await validateAllProducts()
      if (!isValid) {
        toast.error("Por favor, revisa las recomendaciones para mejorar tus productos")
        return
      }
      await createProductsMutation.mutateAsync(data)
    } catch (error) {
      console.error("Error al enviar el formulario:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-primary">
            <Package size={24} />
            <h2 className="text-xl font-semibold">Productos</h2>
          </div>

          <Button type="button" disabled={isSubmitting} className="flex items-center gap-2" onClick={() => onSubmit(form.getValues())}>
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Guardar productos
          </Button>
        </div>

        <div className="space-y-4">
          {localProducts.map((product, idx) => (
            <Card key={product.id} className="border-muted-foreground/20">
              <CardContent className="pt-6 space-y-4">
                <div className="flex justify-between items-start">
                  <h3 className="font-medium">Producto {idx + 1}</h3>
                  <Button type="button" variant="ghost" size="icon" onClick={() => removeProduct(product.id)}>
                    <Trash2 size={16} />
                  </Button>
                </div>

                {/* Campos del producto */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor={`name-${product.id}`}>Nombre</Label>
                    <Input
                      id={`name-${product.id}`}
                      value={product.name}
                      onChange={(e) => handleChange(product.id, "name", e.target.value)}
                      placeholder="Nombre del producto"
                      className={form.formState.errors.products?.[idx]?.name ? "border-destructive" : ""}
                    />
                    {form.formState.errors.products?.[idx]?.name && (
                      <p className="text-sm text-destructive">{form.formState.errors.products[idx]?.name?.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`price-${product.id}`}>Precio</Label>
                    <Input
                      id={`price-${product.id}`}
                      type="number"
                      min={0}
                      step="0.01"
                      value={product.price}
                      onChange={(e) => handleChange(product.id, "price", Number.parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                      className={form.formState.errors.products?.[idx]?.price ? "border-destructive" : ""}
                    />
                    {form.formState.errors.products?.[idx]?.price && (
                      <p className="text-sm text-destructive">{form.formState.errors.products[idx]?.price?.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`stock-${product.id}`}>Stock</Label>
                    <Input
                      id={`stock-${product.id}`}
                      type="number"
                      min={0}
                      value={product.stock}
                      onChange={(e) => handleChange(product.id, "stock", Number.parseInt(e.target.value || "0"))}
                      placeholder="0"
                      className={form.formState.errors.products?.[idx]?.stock ? "border-destructive" : ""}
                    />
                    {form.formState.errors.products?.[idx]?.stock && (
                      <p className="text-sm text-destructive">{form.formState.errors.products[idx]?.stock?.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`category-${product.id}`}>Categoría</Label>
                    <Input
                      id={`category-${product.id}`}
                      value={product.category}
                      onChange={(e) => handleChange(product.id, "category", e.target.value)}
                      placeholder="Ej: Electrónica"
                      className={form.formState.errors.products?.[idx]?.category ? "border-destructive" : ""}
                    />
                    {form.formState.errors.products?.[idx]?.category && (
                      <p className="text-sm text-destructive">
                        {form.formState.errors.products[idx]?.category?.message}
                      </p>
                    )}
                  </div>

                  <div className="col-span-full space-y-2">
                    <Label htmlFor={`description-${product.id}`}>Descripción</Label>
                    <Textarea
                      id={`description-${product.id}`}
                      value={product.description}
                      onChange={(e) => handleChange(product.id, "description", e.target.value)}
                      placeholder="Descripción detallada del producto"
                      className={`min-h-[80px] ${form.formState.errors.products?.[idx]?.description ? "border-destructive" : ""}`}
                    />
                    {form.formState.errors.products?.[idx]?.description && (
                      <p className="text-sm text-destructive">
                        {form.formState.errors.products[idx]?.description?.message}
                      </p>
                    )}
                    
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
                </div>

                {/* Imágenes */}
                <div className="space-y-2">
                  <Label>Imágenes</Label>
                  <div className="flex flex-wrap gap-4 items-center">
                    {product.images.map((src, i) => (
                      <div key={i} className="relative group">
                        <Image
                          src={src || "/placeholder.svg"}
                          alt={`Imagen ${i + 1}`}
                          width={80}
                          height={80}
                          className="rounded-md object-cover border"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const updatedImages = product.images.filter((_, index) => index !== i)
                            handleChange(product.id, "images", updatedImages)
                          }}
                          className="absolute top-1 right-1 bg-destructive text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}

                    <Button type="button" asChild variant="secondary" size="sm" className="gap-1">
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
                  {form.formState.errors.products?.[idx]?.images && (
                    <p className="text-sm text-destructive">{form.formState.errors.products[idx]?.images?.message}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}

          <Button type="button" variant="outline" className="flex items-center gap-2" onClick={addProduct}>
            <PlusCircle size={16} /> Añadir producto
          </Button>

          {form.formState.errors.products && !Array.isArray(form.formState.errors.products) && (
            <p className="text-sm text-destructive">{form.formState.errors.products.message}</p>
          )}
        </div>
      </form>
    </Form>
  )
}
