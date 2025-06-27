"use client"

import * as React from "react"
import { motion, useMotionValue, useTransform, animate } from "framer-motion"
import { Plus, Loader2, Coins, Sparkles, Crown, Zap } from "lucide-react"
import { SidebarGroup, SidebarGroupContent, SidebarGroupLabel } from "@/components/ui/sidebar"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface CreditDisplayProps {
  amount: number
  maxAmount?: number
  className?: string
}

interface CreditPack {
  credits: number
  price: number
  originalPrice?: number
  icon: React.ComponentType<{ className?: string }>
  label: string
  popular?: boolean
  bonus?: number
}

const CREDIT_PACKS: CreditPack[] = [
  {
    credits: 1000,
    price: 9.99,
    icon: Coins,
    label: "Básico",
  },
  {
    credits: 5000,
    price: 39.99,
    originalPrice: 49.95,
    icon: Sparkles,
    label: "Popular",
    popular: true,
    bonus: 500,
  },
  {
    credits: 10000,
    price: 69.99,
    originalPrice: 99.9,
    icon: Crown,
    label: "Pro",
    bonus: 1500,
  },
]

export function CreditDisplay({ amount, maxAmount = 1000, className }: CreditDisplayProps) {
  const count = useMotionValue(0)
  const rounded = useTransform(count, (latest) => Math.round(latest))
  const displayText = useTransform(rounded, (latest) => latest.toLocaleString())

  React.useEffect(() => {
    const animation = animate(count, amount, {
      duration: 2,
      ease: "easeOut",
    })

    return animation.stop
  }, [amount, count])

  const percentage = Math.min(100, Math.round((amount / maxAmount) * 100))
  const [loadingCredits, setLoadingCredits] = React.useState<number | null>(null)
  const [isDialogOpen, setIsDialogOpen] = React.useState(false)

  const handleBuyCredits = async (pack: CreditPack) => {
    try {
      setLoadingCredits(pack.credits)
      const res = await fetch("/api/credits/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ credits: pack.credits }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Error generando checkout")

      // Redirigimos al checkout de Lemon Squeezy
      window.location.href = data.url
    } catch (e) {
      console.error(e)
      toast((e as Error).message ?? "Error desconocido")
    } finally {
      setLoadingCredits(null)
    }
  }

  const getDiscountPercentage = (original: number, current: number) => {
    return Math.round(((original - current) / original) * 100)
  }

  return (
    <>
      <SidebarGroup className={cn("px-4 py-2", className)}>
        <div
          className="rounded-lg border bg-background border-[var(--border)] p-4 shadow-sm"
          style={{ color: "var(--card-foreground)" }}
        >
          <div className="mb-3 flex items-center justify-between">
            <SidebarGroupLabel className="m-0 p-0 text-sm font-medium" style={{ color: "var(--foreground)" }}>
              Tus créditos
            </SidebarGroupLabel>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 gap-1 text-xs hover:bg-[var(--secondary)] text-[var(--primary)] hover:text-[var(--primary-foreground)]"
                >
                  <Plus className="h-3 w-3" />
                  Agregar
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader className="text-center">
                  <DialogTitle className="flex items-center justify-center gap-2 text-xl">
                    Comprar créditos
                  </DialogTitle>
                  <DialogDescription className="text-center">
                    Elige el pack perfecto para tus necesidades y obtén créditos al instante
                  </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                  {CREDIT_PACKS.map((pack, index) => {
                    const Icon = pack.icon
                    const isLoading = loadingCredits === pack.credits
                    const totalCredits = pack.credits + (pack.bonus || 0)

                    return (
                      <motion.div
                        key={pack.credits}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className={cn(
                          "relative rounded-xl border-2 p-4 transition-all duration-200 hover:shadow-lg",
                          pack.popular
                            ? "border-blue-500 bg-blue-50/50 dark:bg-blue-950/20"
                            : "border-border hover:border-primary/50",
                        )}
                      >
                        {pack.popular && (
                          <Badge className="absolute -top-2 left-1/2 -translate-x-1/2 bg-blue-500 text-white">
                            Más popular
                          </Badge>
                        )}

                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div
                              className={cn(
                                "rounded-lg p-2",
                                pack.popular
                                  ? "bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400"
                                  : "bg-muted text-muted-foreground",
                              )}
                            >
                              <Icon className="h-5 w-5" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold text-foreground">{pack.label}</h3>
                                {pack.bonus && (
                                  <Badge variant="secondary" className="text-xs">
                                    +{pack.bonus} bonus
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground">{totalCredits.toLocaleString()} créditos</p>
                            </div>
                          </div>

                          <div className="text-right">
                            <div className="flex items-center gap-1">
                              {pack.originalPrice && (
                                <span className="text-sm text-muted-foreground line-through">
                                  ${pack.originalPrice}
                                </span>
                              )}
                              <span className="text-lg font-bold text-foreground">${pack.price}</span>
                            </div>
                            {pack.originalPrice && (
                              <Badge variant="destructive" className="text-xs">
                                -{getDiscountPercentage(pack.originalPrice, pack.price)}%
                              </Badge>
                            )}
                          </div>
                        </div>

                        <Button
                          onClick={() => handleBuyCredits(pack)}
                          disabled={loadingCredits !== null}
                          className={cn("mt-4 w-full", pack.popular && "bg-blue-600 hover:bg-blue-700")}
                        >
                          {isLoading ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Procesando...
                            </>
                          ) : (
                            <>
                              Comprar ahora
                              <Coins className="ml-2 h-4 w-4" />
                            </>
                          )}
                        </Button>
                      </motion.div>
                    )
                  })}
                </div>

                <div className="rounded-lg bg-muted/50 p-3 text-center">
                  <p className="text-xs text-muted-foreground">
                    💳 Pago seguro con Lemon Squeezy • Activación instantánea
                  </p>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <SidebarGroupContent className="p-0">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm text-[var(--muted-foreground)]">Disponibles</span>
              <motion.span className="text-lg font-semibold text-[var(--foreground)]">{displayText}</motion.span>
            </div>

            <Progress value={percentage} className="h-1.5 bg-[var(--muted)]" />

            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-[var(--muted-foreground)]">Inicial/mes</span>
                <p className="font-medium text-[var(--foreground)]">{maxAmount.toLocaleString()}</p>
              </div>
              <div>
                <span className="text-[var(--muted-foreground)]">Usados este mes</span>
                <p className="font-medium text-[var(--foreground)]">{(maxAmount - amount).toLocaleString()}</p>
              </div>
            </div>
          </SidebarGroupContent>
        </div>
      </SidebarGroup>
    </>
  )
}
