"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { getAvailablePhoneNumbers, purchasePhoneNumber } from "@/actions/twilio"
import {
  Loader2,
  Phone,
  MapPin,
  CreditCard,
  Search,
  Globe,
  CheckCircle2,
  AlertCircle,
  Zap,
  DollarSign,
  RefreshCw,
} from "lucide-react"
import { toast } from "sonner"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"

type AvailableNumber = {
  phoneNumber: string
  friendlyName: string
  locality: string | null
  region: string | null
}

export const PhoneNumberClient = () => {
  const [country, setCountry] = useState<"US" | "CO">("US")
  const [numbers, setNumbers] = useState<AvailableNumber[]>([])
  const [isLoading, startTransition] = useTransition()
  const [isPurchasing, setIsPurchasing] = useState<string | null>(null)
  const [searchAttempted, setSearchAttempted] = useState(false)
  const [searchFilter, setSearchFilter] = useState("")
  const [error, setError] = useState<string | null>(null)

  const handleFetchNumbers = () => {
    setError(null)
    setSearchAttempted(true)

    startTransition(async () => {
      try {
        const result = await getAvailablePhoneNumbers(country)
        setNumbers(result)

        if (result.length === 0) {
          toast.info("No se encontraron números disponibles", {
            description: "Prueba con otro país o vuelve más tarde",
          })
        } else {
          toast.success(`${result.length} números encontrados`, {
            description: "Selecciona el que mejor se adapte a ti",
          })
        }
      } catch (error: any) {
        setError("No se pudo obtener los números disponibles. Por favor, inténtalo de nuevo.")
        toast.error("Búsqueda fallida", {
          description: "No se pudieron obtener los números. Por favor, inténtalo de nuevo.",
        })
      }
    })
  }

  const handlePurchase = (phoneNumber: string) => {
    setIsPurchasing(phoneNumber)

    startTransition(async () => {
      try {
        const result = await purchasePhoneNumber(phoneNumber)

        if (result.success) {
          toast.success("¡Número alquilado exitosamente!", {
            description: "Tu nuevo número está listo para usarse",
            icon: <CheckCircle2 className="h-4 w-4" />,
          })
          // Refresh the list to remove purchased number
          handleFetchNumbers()
        } else {
          toast.error("El alquiler falló", {
            description: "No se pudo completar el alquiler. Por favor, inténtalo de nuevo.",
          })
        }
      } catch (error) {
        toast.error("El alquiler falló", {
          description: "Ocurrió un error inesperado. Por favor, inténtalo de nuevo.",
        })
      } finally {
        setIsPurchasing(null)
      }
    })
  }

  const countryOptions = [
    {
      code: "US" as const,
      name: "United States",
      flag: "🇺🇸",
      prefix: "+1",
      description: "Números gratuitos y locales disponibles",
    },
    {
      code: "CO" as const,
      name: "Colombia",
      flag: "🇨🇴",
      prefix: "+57",
      description: "Números locales de Colombia",
    },
  ]

  const filteredNumbers = numbers.filter(
    (number) =>
      !searchFilter ||
      number.friendlyName.toLowerCase().includes(searchFilter.toLowerCase()) ||
      number.locality?.toLowerCase().includes(searchFilter.toLowerCase()) ||
      number.region?.toLowerCase().includes(searchFilter.toLowerCase()),
  )

  const selectedCountry = countryOptions.find((option) => option.code === country)

  return (
    <div className="flex-1 overflow-auto">
      <div className="max-w-6xl mx-auto p-6 space-y-8">
        {/* Header Section */}
        <div className="text-center space-y-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg">
            <Phone className="w-8 h-8 text-white" />
          </div>

          <div className="space-y-2">
            <h1 className="text-4xl font-bold tracking-tight">Números Telefónicos</h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Encuentra y compra números telefónicos virtuales para tu negocio. Disponibles en múltiples países con activación instantánea.
            </p>
          </div>
        </div>

        {/* Country Selection */}
        <Card>
          <CardHeader className="pb-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                <Globe className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <CardTitle>Selecciona el país</CardTitle>
                <CardDescription>Elige el país donde necesitas tu número telefónico</CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              {countryOptions.map((option) => (
                <div
                  key={option.code}
                  className={`relative p-4 border-2 rounded-lg cursor-pointer transition-all hover:shadow-md ${
                    country === option.code
                      ? "border-primary bg-primary/5 shadow-sm"
                      : "border-border hover:border-primary/50"
                  }`}
                  onClick={() => setCountry(option.code)}
                >
                  <div className="flex items-center gap-4">
                    <span className="text-3xl">{option.flag}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{option.name}</h3>
                        <Badge variant="outline" className="text-xs">
                          {option.prefix}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{option.description}</p>
                    </div>
                    {country === option.code && <CheckCircle2 className="w-5 h-5 text-primary" />}
                  </div>
                </div>
              ))}
            </div>

            <Separator />

            <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Zap className="w-4 h-4" />
                <span>Activación instantánea</span>
              </div>
            </div>

            <div className="flex justify-center">
              <Button onClick={handleFetchNumbers} disabled={isLoading && !isPurchasing} size="lg" className="px-8">
                {isLoading && !isPurchasing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Buscando...
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4 mr-2" />
                    Buscar números disponibles
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Error State */}
        {error && (
          <Alert className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
            <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
            <AlertDescription className="text-red-700 dark:text-red-300">{error}</AlertDescription>
          </Alert>
        )}

        {/* Results Section */}
        {numbers.length > 0 && (
          <div className="space-y-6">
            {/* Results Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <h2 className="text-2xl font-bold">Números disponibles</h2>
                <p className="text-muted-foreground">
                  {filteredNumbers.length} de {numbers.length} números mostrados
                  {selectedCountry && (
                    <span className="ml-2">
                      • {selectedCountry.flag} {selectedCountry.name}
                    </span>
                  )}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Filtrar por ubicación..."
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    className="pl-10 w-64"
                  />
                </div>

                <Button variant="outline" size="sm" onClick={handleFetchNumbers} disabled={isLoading}>
                  <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
                </Button>
              </div>
            </div>

            {/* Numbers Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredNumbers.map((number) => (
                <Card
                  key={number.phoneNumber}
                  className="group hover:shadow-lg transition-all duration-200 hover:-translate-y-1"
                >
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2 flex-1">
                        <CardTitle className="text-lg font-mono text-primary">{number.friendlyName}</CardTitle>

                        {(number.locality || number.region) && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <MapPin className="w-4 h-4" />
                            <span>{[number.locality, number.region].filter(Boolean).join(", ")}</span>
                          </div>
                        )}
                      </div>

                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <Phone className="w-4 h-4 text-primary" />
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Cuota de instalación</span>
                        <span className="font-semibold">Gratis</span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Activación</span>
                        <Badge variant="secondary" className="text-xs">
                          <Zap className="w-3 h-3 mr-1" />
                          Instantánea
                        </Badge>
                      </div>
                    </div>
                  </CardContent>

                  <CardFooter>
                    <Button
                      onClick={() => handlePurchase(number.phoneNumber)}
                      disabled={isLoading}
                      className="w-full"
                      size="lg"
                    >
                      {isPurchasing === number.phoneNumber ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Alquilando...
                        </>
                      ) : (
                        <>
                          <CreditCard className="w-4 h-4 mr-2" />
                          Alquilar número
                        </>
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>

            {/* No filtered results */}
            {filteredNumbers.length === 0 && searchFilter && (
              <div className="text-center py-12">
                <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-semibold mb-2">Ningún número coincide con tu filtro</h3>
                <p className="text-muted-foreground mb-4">
                  Intenta ajustar tu búsqueda o borra el filtro para ver todos los números disponibles.
                </p>
                <Button variant="outline" onClick={() => setSearchFilter("")}>Borrar filtro</Button>
              </div>
            )}
          </div>
        )}

        {/* Empty State - No Search Attempted */}
        {!searchAttempted && numbers.length === 0 && (
          <Card className="border-dashed border-2">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-6">
                <Search className="w-8 h-8 text-muted-foreground" />
              </div>

              <div className="space-y-2 mb-6">
                <h3 className="text-xl font-semibold">¿Listo para encontrar tu número?</h3>
                <p className="text-muted-foreground max-w-md">
                  Selecciona un país arriba y haz clic en "Buscar números disponibles" para ver los números en tu ubicación preferida.
                </p>
              </div>

              <div className="flex items-center gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <span>Activación instantánea</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <span>Sin cargos de activación</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <span>Cancelar en cualquier momento</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Empty State - Search Attempted but No Results */}
        {searchAttempted && numbers.length === 0 && !isLoading && !error && (
          <Card className="border-dashed border-2">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 rounded-full bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center mb-6">
                <AlertCircle className="w-8 h-8 text-orange-600 dark:text-orange-400" />
              </div>

              <div className="space-y-2 mb-6">
                <h3 className="text-xl font-semibold">No hay números disponibles</h3>
                <p className="text-muted-foreground max-w-md">
                  Actualmente no hay números disponibles en {selectedCountry?.name}. Intenta seleccionar otro país o vuelve más tarde.
                </p>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={handleFetchNumbers}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Probar de nuevo
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setCountry(country === "US" ? "CO" : "US")
                    setSearchAttempted(false)
                  }}
                >
                  <Globe className="w-4 h-4 mr-2" />
                  Probar con otro país
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
