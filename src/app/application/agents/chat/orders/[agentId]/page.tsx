'use client'

import { useState } from "react"
import { useAllOrders } from "@/hooks/use-all-orders"
import { useAgentProducts } from "@/hooks/use-products"
import { OrderStatus } from "@prisma/client"
import { format } from "date-fns"
import { usePathname } from "next/navigation"
import {
  Package,
  DollarSign,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  CreditCard,
  Filter,
  Search,
  MoreVertical,
  Eye,
  Download,
  RefreshCw,
  User,
  MapPin,
  FileText,
  Hash,
  Mail,
  Truck,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"

type OrderWithQuantities = {
  id: string
  chatAgentId: string
  userId: string
  productIds: string[]
  totalAmount: number
  paymentLink: string
  status: OrderStatus
  createdAt: Date
  updatedAt: Date
  amountInCents?: number
  billingData?: any
  currency?: string
  customerData?: any
  customerEmail?: string
  origin?: string
  paymentLinkId?: string
  paymentMethod?: any
  paymentMethodType?: string
  paymentSourceId?: string
  productQuantities?: Record<string, number>
  redirectUrl?: string
  reference?: string
  shippingAddress?: any
  statusMessage?: string
  transactionCreatedAt?: Date
  transactionFinalizedAt?: Date
  transactionId?: string
}

const statusConfig = {
  [OrderStatus.PENDING]: {
    label: "Pendiente",
    icon: Clock,
    color: "bg-yellow-500",
    bgColor: "bg-yellow-50 dark:bg-yellow-950/30",
    borderColor: "border-yellow-200 dark:border-yellow-800",
    textColor: "text-yellow-800 dark:text-yellow-300",
  },
  [OrderStatus.APPROVED]: {
    label: "Aprobado",
    icon: CheckCircle,
    color: "bg-blue-500",
    bgColor: "bg-blue-50 dark:bg-blue-950/30",
    borderColor: "border-blue-200 dark:border-blue-800",
    textColor: "text-blue-800 dark:text-blue-300",
  },
  [OrderStatus.FAILED]: {
    label: "Fallido",
    icon: XCircle,
    color: "bg-red-500",
    bgColor: "bg-red-50 dark:bg-red-950/30",
    borderColor: "border-red-200 dark:border-red-800",
    textColor: "text-red-800 dark:text-red-300",
  },
  [OrderStatus.CANCELLED]: {
    label: "Cancelado",
    icon: XCircle,
    color: "bg-red-500",
    bgColor: "bg-red-50 dark:bg-red-950/30",
    borderColor: "border-red-200 dark:border-red-800",
    textColor: "text-red-800 dark:text-red-300",
  },
}
function OrderDetailsModal({ order, products }: { order: OrderWithQuantities; products: any[] }) {
  const statusInfo = statusConfig[order.status as keyof typeof statusConfig]
  const StatusIcon = statusInfo.icon

  const getProductInfo = (productId: string) => {
    return products?.find((p) => p.id === productId)
  }

  const formatJson = (data: any) => {
    if (!data) return "No disponible"
    if (typeof data === "string") return data
    return JSON.stringify(data, null, 2)
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
          <Eye className="h-4 w-4 mr-2" />
          Ver detalles
        </DropdownMenuItem>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className={cn("p-2 rounded-full", statusInfo.bgColor)}>
              <StatusIcon className={cn("h-5 w-5", statusInfo.textColor)} />
            </div>
            Detalles del Pedido #{order.id.slice(-8)}
          </DialogTitle>
          <DialogDescription>Información completa del pedido y transacción</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="customer">Cliente</TabsTrigger>
            <TabsTrigger value="payment">Pago</TabsTrigger>
            <TabsTrigger value="products">Productos</TabsTrigger>
            <TabsTrigger value="shipping">Envío</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Información General
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">ID del Pedido</label>
                    <p className="font-mono text-sm">{order.id}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Estado</label>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge
                        variant="outline"
                        className={cn(statusInfo.borderColor, statusInfo.bgColor, statusInfo.textColor)}
                      >
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {statusInfo.label}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Monto Total</label>
                    <p className="text-lg font-semibold">${order.totalAmount.toFixed(2)}</p>
                    {order.currency && <p className="text-sm text-muted-foreground">{order.currency}</p>}
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Monto en Centavos</label>
                    <p className="font-mono">{order.amountInCents || "No disponible"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Fecha de Creación</label>
                    <p>{format(new Date(order.createdAt), "dd/MM/yyyy HH:mm:ss")}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Última Actualización</label>
                    <p>{format(new Date(order.updatedAt), "dd/MM/yyyy HH:mm:ss")}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Referencia</label>
                    <p className="font-mono">{order.reference || "No disponible"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Origen</label>
                    <p>{order.origin || "No disponible"}</p>
                  </div>
                </div>

                {order.statusMessage && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Mensaje de Estado</label>
                    <p className="mt-1 p-2 bg-muted/50 rounded-md text-sm">{order.statusMessage}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="customer" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Información del Cliente
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Email del Cliente</label>
                    <p className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      {order.customerEmail || "No disponible"}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">ID del Usuario</label>
                    <p className="font-mono text-sm">{order.userId}</p>
                  </div>
                </div>

                {order.customerData && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Datos del Cliente</label>
                    <pre className="mt-1 p-3 bg-muted/50 rounded-md text-xs overflow-x-auto">
                      {formatJson(order.customerData)}
                    </pre>
                  </div>
                )}

                {order.billingData && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Datos de Facturación</label>
                    <pre className="mt-1 p-3 bg-muted/50 rounded-md text-xs overflow-x-auto">
                      {formatJson(order.billingData)}
                    </pre>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payment" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Información de Pago
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">ID de Transacción</label>
                    <p className="font-mono text-sm">{order.transactionId || "No disponible"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Tipo de Método de Pago</label>
                    <p>{order.paymentMethodType || "No disponible"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">ID del Link de Pago</label>
                    <p className="font-mono text-sm">{order.paymentLinkId || "No disponible"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">ID de Fuente de Pago</label>
                    <p className="font-mono text-sm">{order.paymentSourceId || "No disponible"}</p>
                  </div>
                  {order.transactionCreatedAt && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Transacción Creada</label>
                      <p>{format(new Date(order.transactionCreatedAt), "dd/MM/yyyy HH:mm:ss")}</p>
                    </div>
                  )}
                  {order.transactionFinalizedAt && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Transacción Finalizada</label>
                      <p>{format(new Date(order.transactionFinalizedAt), "dd/MM/yyyy HH:mm:ss")}</p>
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground">Link de Pago</label>
                  <div className="mt-1">
                    <Button variant="outline" size="sm" asChild>
                      <a href={order.paymentLink} target="_blank" rel="noopener noreferrer">
                        <CreditCard className="h-4 w-4 mr-2" />
                        Abrir Link de Pago
                      </a>
                    </Button>
                  </div>
                </div>

                {order.redirectUrl && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">URL de Redirección</label>
                    <p className="text-sm text-blue-600 break-all">{order.redirectUrl}</p>
                  </div>
                )}

                {order.paymentMethod && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Método de Pago</label>
                    <pre className="mt-1 p-3 bg-muted/50 rounded-md text-xs overflow-x-auto">
                      {formatJson(order.paymentMethod)}
                    </pre>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="products" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Productos del Pedido
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {Array.from(new Set(order.productIds)).map((productId) => {
                    const product = getProductInfo(productId)
                    const quantity = order.productQuantities?.[productId] || 1

                    return (
                      <div key={productId} className="border rounded-lg p-3">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h4 className="font-medium">{product?.name || `Producto #${productId.slice(-8)}`}</h4>
                            <p className="text-sm text-muted-foreground">ID: {productId}</p>
                            {product?.description && (
                              <p className="text-sm text-muted-foreground mt-1">{product.description}</p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">${product?.price?.toFixed(2) || "N/A"}</p>
                            <Badge variant="secondary">Cantidad: {quantity}</Badge>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {order.productQuantities && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Cantidades por Producto</label>
                    <pre className="mt-1 p-3 bg-muted/50 rounded-md text-xs overflow-x-auto">
                      {formatJson(order.productQuantities)}
                    </pre>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="shipping" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="h-5 w-5" />
                  Información de Envío
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {order.shippingAddress ? (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Dirección de Envío</label>
                    <pre className="mt-1 p-3 bg-muted/50 rounded-md text-xs overflow-x-auto">
                      {formatJson(order.shippingAddress)}
                    </pre>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <MapPin className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Sin información de envío</h3>
                    <p className="text-muted-foreground">No se ha registrado información de envío para este pedido</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}

export default function AgentOrdersPage() {
  const pathname = usePathname()
  const segments = pathname.split("/")
  const rawAgentId = segments[segments.length - 1];

  // Decode and clean the agentId
  const agentId = decodeURIComponent(rawAgentId || '').replace(/%[0-9A-Fa-f]{2}/g, '');

  const { orders, loading, error, updateStatus } = useAllOrders(agentId)
  const { productsData: products } = useAgentProducts(agentId)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")

  const filteredOrders = (orders as OrderWithQuantities[]).filter((order) => {
    const matchesSearch =
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.reference?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || order.status === statusFilter
    const hasPaymentLink = order.paymentLink && order.paymentLink.trim() !== ""
    return matchesSearch && matchesStatus && hasPaymentLink
  })

  const getOrdersByStatus = (status: OrderStatus) => {
    return filteredOrders.filter((order) => order.status === status)
  }

  const getTotalProducts = (order: OrderWithQuantities) => {
    if (!order.productQuantities) {
      return new Set(order.productIds).size
    }
    return Object.values(order.productQuantities).reduce((sum, qty) => sum + qty, 0)
  }

  const getProductInfo = (productId: string) => {
    return products?.find((p) => p.id === productId)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center space-x-2">
          <RefreshCw className="h-6 w-6 animate-spin text-primary" />
          <span className="text-lg">Cargando pedidos...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="p-6 border-red-200 bg-red-50 dark:bg-red-950/30">
          <div className="flex items-center space-x-2 text-red-600">
            <AlertCircle className="h-6 w-6" />
            <span className="text-lg font-medium">Error: {error}</span>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Pedidos del Agente
          </h1>
          <p className="text-muted-foreground mt-1">Gestiona y supervisa todos los pedidos de este agente</p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {Object.entries(statusConfig).map(([status, config]) => {
          const count = getOrdersByStatus(status as OrderStatus).length
          const Icon = config.icon
          return (
            <Card key={status} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{config.label}</p>
                    <p className="text-2xl font-bold">{count}</p>
                  </div>
                  <div className={cn("p-2 rounded-full", config.bgColor)}>
                    <Icon className={cn("h-5 w-5", config.textColor)} />
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por ID, email o referencia..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filtrar por estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                {Object.entries(statusConfig).map(([status, config]) => (
                  <SelectItem key={status} value={status}>
                    {config.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Orders List */}
      <div className="space-y-4">
        {filteredOrders.length === 0 ? (
          <Card className="p-12">
            <div className="text-center">
              <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No se encontraron pedidos</h3>
              <p className="text-muted-foreground">
                {searchTerm || statusFilter !== "all"
                  ? "Intenta ajustar los filtros de búsqueda"
                  : "Este agente aún no tiene pedidos registrados"}
              </p>
            </div>
          </Card>
        ) : (
          filteredOrders.map((order) => {
            const statusInfo = statusConfig[order.status as keyof typeof statusConfig]
            const StatusIcon = statusInfo.icon

            return (
              <Card key={order.id} className="overflow-hidden hover:shadow-md transition-all">
                <div className={cn("h-1", statusInfo.color)}></div>
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Order Info */}
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={cn("p-2 rounded-full", statusInfo.bgColor)}>
                            <StatusIcon className={cn("h-4 w-4", statusInfo.textColor)} />
                          </div>
                          <div>
                            <h3 className="font-semibold text-lg">#{order.id.slice(-8)}</h3>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <span>ID: {order.id}</span>
                              {order.reference && (
                                <>
                                  <span>•</span>
                                  <span>Ref: {order.reference}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        <Badge
                          variant="outline"
                          className={cn(statusInfo.borderColor, statusInfo.bgColor, statusInfo.textColor)}
                        >
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {statusInfo.label}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-emerald-600" />
                          <div>
                            <p className="text-sm text-muted-foreground">Total</p>
                            <p className="font-semibold">${order.totalAmount.toFixed(2)}</p>
                            {order.currency && <p className="text-xs text-muted-foreground">{order.currency}</p>}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-blue-600" />
                          <div>
                            <p className="text-sm text-muted-foreground">Creado</p>
                            <p className="font-medium">{format(new Date(order.createdAt), "dd/MM/yyyy")}</p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(order.createdAt), "HH:mm")}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4 text-purple-600" />
                          <div>
                            <p className="text-sm text-muted-foreground">Productos</p>
                            <p className="font-semibold">{getTotalProducts(order)} items</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-orange-600" />
                          <div>
                            <p className="text-sm text-muted-foreground">Cliente</p>
                            <p className="font-medium text-sm">{order.customerEmail || "No disponible"}</p>
                          </div>
                        </div>
                      </div>

                      {/* Transaction Info */}
                      {order.transactionId && (
                        <div className="flex items-center gap-2 text-sm">
                          <Hash className="h-3 w-3 text-muted-foreground" />
                          <span className="text-muted-foreground">Transacción:</span>
                          <span className="font-mono">{order.transactionId}</span>
                          {order.paymentMethodType && (
                            <>
                              <span className="text-muted-foreground">•</span>
                              <span>{order.paymentMethodType}</span>
                            </>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-3 lg:w-64">
                      <Select
                        value={order.status}
                        onValueChange={(value) => updateStatus(order.id, value as OrderStatus)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(statusConfig).map(([status, config]) => {
                            const Icon = config.icon
                            return (
                              <SelectItem key={status} value={status}>
                                <div className="flex items-center gap-2">
                                  <Icon className="h-4 w-4" />
                                  {config.label}
                                </div>
                              </SelectItem>
                            )
                          })}
                        </SelectContent>
                      </Select>

                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="flex-1" asChild>
                          <a href={order.paymentLink} target="_blank" rel="noopener noreferrer">
                            <CreditCard className="h-4 w-4 mr-1" />
                            Pago
                          </a>
                        </Button>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <OrderDetailsModal order={order} products={products || []} />
                            <DropdownMenuItem>
                              <Download className="h-4 w-4 mr-2" />
                              Descargar factura
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-600">
                              <XCircle className="h-4 w-4 mr-2" />
                              Cancelar pedido
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}
