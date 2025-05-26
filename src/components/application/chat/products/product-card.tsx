import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Image from "next/image"
import Link from "next/link"
import { ExternalLink, Edit } from "lucide-react"

interface ProductCardProps {
  product: {
    id: string
    name: string
    description?: string
    price: number
    stock: number
    images: any // Objeto de links de imágenes
    category?: string
    chatAgentId: string
  }
}

export function ProductCard({ product }: ProductCardProps) {
  // Obtener la primera imagen del objeto de imágenes
  const firstImage =
    product.images && typeof product.images === "object"
      ? Object.values(product.images)[0]
      : "/placeholder.svg?height=200&width=200"

  return (
    <Card className="overflow-hidden">
      <div className="relative aspect-square">
        <Image src={(firstImage as string) || "/placeholder.svg"} alt={product.name} fill className="object-cover" />
      </div>
      <CardHeader className="p-4">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-semibold text-lg line-clamp-1">{product.name}</h3>
            {product.category && (
              <Badge variant="outline" className="mt-1">
                {product.category}
              </Badge>
            )}
          </div>
          <div className="text-lg font-bold">${product.price.toFixed(2)}</div>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        {product.description && <p className="text-muted-foreground text-sm line-clamp-2">{product.description}</p>}
        <div className="mt-2 text-sm">
          <span className={product.stock > 0 ? "text-green-600" : "text-red-600"}>
            {product.stock > 0 ? `${product.stock} en stock` : "Sin stock"}
          </span>
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0 flex gap-2">
        <Button variant="outline" size="sm" asChild>
          <Link href={`/agents/${product.chatAgentId}/products/${product.id}`}>
            <Edit className="h-4 w-4 mr-2" />
            Editar
          </Link>
        </Button>
      </CardFooter>
    </Card>
  )
}
