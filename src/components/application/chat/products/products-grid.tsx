import { ProductCard } from "./product-card"

interface ProductsGridProps {
  products: Array<{
    id: string
    name: string
    price: number
    stock: number
    images: any
    category?: string
    chatAgentId: string
  }>
}

export function ProductsGrid({ products }: ProductsGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 p-5">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  )
}
