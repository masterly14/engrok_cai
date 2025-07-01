'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { LoadingSpinner } from '@/components/loading-spinner'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const searchSchema = z.object({
  // title: z.string().optional(), // Removing job title search
  // company: z.string().optional(), // Removing company name search
  location: z.string().optional(),
  industry: z.string().optional(),
  // seniority: z.string().optional(), // Removing seniority search
  employeeSize: z.string().optional(),
})

type SearchFormData = z.infer<typeof searchSchema>

type CompanyLocation = {
  country: string
  region: string
  locality: string
}

type CompanyResult = {
  id: string
  name: string
  industry: string
  size: string
  website: string
  location: CompanyLocation
}

export default function ProspectFinderPage() {
  const [companies, setCompanies] = useState<CompanyResult[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<SearchFormData>({
    resolver: zodResolver(searchSchema),
  })

  const onSubmit = async (data: SearchFormData) => {
    if (Object.values(data).every(v => !v)) {
      toast.error('Por favor ingresa al menos un criterio de búsqueda.')
      return
    }
    setIsLoading(true)
    setCompanies([])
    try {
      const response = await fetch('/api/prospects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw new Error('Failed to fetch prospects')
      }

      const result = await response.json()
      setCompanies(result)
      if (result.length === 0) {
        toast.info('No se encontraron empresas que coincidan.')
      } else {
        toast.success(`¡Se encontraron ${result.length} empresas!`)
      }
    } catch (error) {
      console.error(error)
      toast.error('Ocurrió un error al buscar empresas.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-8 p-4 md:p-8">
      <Card>
        <CardHeader>
          <CardTitle>Buscador de Prospectos</CardTitle>
          <CardDescription>
            Encuentra nuevos prospectos utilizando los datos de People Data Labs.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {/* Removing Title input */}
            {/* <div className="grid gap-2">
              <Label htmlFor="title">Título del puesto</Label>
              <Input
                id="title"
                placeholder="p. ej., Ingeniero de Software"
                {...register('title')}
              />
            </div> */}
            {/* Removing Company input */}
            {/* <div className="grid gap-2">
              <Label htmlFor="company">Empresa</Label>
              <Input id="company" placeholder="p. ej., Acme Inc." {...register('company')} />
            </div> */}
            <div className="grid gap-2">
              <Label>País</Label>
              <Select onValueChange={(v)=>setValue('location',v)} defaultValue="">
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecciona" />
                </SelectTrigger>
                <SelectContent>
                  {[
                    { code: 'US', name: 'united states' },
                    { code: 'CA', name: 'canada' },
                    { code: 'MX', name: 'mexico' },
                    { code: 'ES', name: 'spain' },
                    { code: 'AR', name: 'argentina' },
                    { code: 'CO', name: 'colombia' },
                    { code: 'CL', name: 'chile' },
                    { code: 'PE', name: 'peru' }
                  ].map(c=>(
                    <SelectItem key={c.code} value={c.name}>{c.code}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Industria</Label>
              <Select onValueChange={(v)=>setValue('industry',v)} defaultValue="">
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecciona" />
                </SelectTrigger>
                <SelectContent>
                  {['software','manufacturing','healthcare','finance','retail','education'].map(i=>(
                    <SelectItem key={i} value={i}>{i}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="employeeSize">Tamaño de la empresa</Label>
              <Input id="employeeSize" placeholder="p. ej., 51-200" {...register('employeeSize')} />
            </div>
            <div className="flex items-end">
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? <LoadingSpinner /> : 'Buscar'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {isLoading && (
        <div className="flex justify-center">
          <LoadingSpinner />
        </div>
      )}

      {companies.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {companies.map((company) => (
            <Card key={company.id}>
              <CardHeader>
                <CardTitle>{company.name}</CardTitle>
                <CardDescription>{company.industry}</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-1">
                <p className="text-sm text-muted-foreground">Tamaño: {company.size}</p>
                <p className="text-sm text-muted-foreground">País: {company.location.country}</p>
                {company.website && (
                  <p className="text-sm text-muted-foreground">
                    Web: <a href={`https://${company.website}`} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                      {company.website}
                    </a>
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
} 