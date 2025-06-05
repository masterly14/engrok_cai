"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { FileText, AlertCircle, CheckCircle } from "lucide-react"

interface CSVData {
  headers: string[]
  rows: Record<string, string>[]
}

interface CSVUploadProps {
  onDataProcessed?: (numbers: { number: string }[]) => void
}

export default function CSVUpload({ onDataProcessed }: CSVUploadProps) {
  const [csvData, setCsvData] = useState<CSVData | null>(null)
  const [error, setError] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)
  const [fileName, setFileName] = useState<string>("")

  const parseCSV = (text: string): CSVData => {
    const lines = text.trim().split("\n")
    if (lines.length < 2) {
      throw new Error("El archivo CSV debe contener al menos una fila de encabezados y una fila de datos")
    }

    // Parse headers
    const headers = lines[0].split(",").map((header) => header.trim().replace(/"/g, ""))

    // Validate that 'number' column exists
    if (!headers.some((header) => header.toLowerCase() === "number")) {
      throw new Error('El archivo CSV debe contener una columna llamada "number"')
    }

    // Parse rows
    const rows: Record<string, string>[] = []
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(",").map((value) => value.trim().replace(/"/g, ""))
      if (values.length !== headers.length) {
        throw new Error(`Error en la fila ${i + 1}: número de columnas no coincide con los encabezados`)
      }

      const row: Record<string, string> = {}
      headers.forEach((header, index) => {
        row[header] = values[index] || ""
      })
      rows.push(row)
    }

    return { headers, rows }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.name.toLowerCase().endsWith(".csv")) {
      setError("Por favor, selecciona un archivo CSV válido")
      return
    }

    setIsLoading(true)
    setError("")
    setFileName(file.name)

    try {
      const text = await file.text()
      const parsedData = parseCSV(text)
      setCsvData(parsedData)

      // Extract numbers and send them to parent component
      if (onDataProcessed) {
        const numberColumnIndex = parsedData.headers.findIndex((header) => header.toLowerCase() === "number")

        if (numberColumnIndex !== -1) {
          const numbersArray = parsedData.rows.map((row) => ({
            number: row[parsedData.headers[numberColumnIndex]],
          }))

          onDataProcessed(numbersArray)
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al procesar el archivo CSV")
      setCsvData(null)
    } finally {
      setIsLoading(false)
    }
  }

  const resetUpload = () => {
    setCsvData(null)
    setError("")
    setFileName("")
    // Reset file input
    const fileInput = document.getElementById("csv-file") as HTMLInputElement
    if (fileInput) fileInput.value = ""

    // Reset data in parent component
    if (onDataProcessed) {
      onDataProcessed([])
    }
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Upload de CSV
          </CardTitle>
          <CardDescription>
            Sube un archivo CSV que contenga una columna llamada "number". Los datos se mostrarán en una tabla a
            continuación. Opcionalmente una columna llamada "name" para identificar a los contactos.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="csv-file">Seleccionar archivo CSV</Label>
            <div className="flex items-center gap-4">
              <Input
                id="csv-file"
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                disabled={isLoading}
                className="flex-1"
              />
              {csvData && (
                <Button variant="outline" onClick={resetUpload} className="shrink-0">
                  Limpiar
                </Button>
              )}
            </div>
          </div>

          {isLoading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
              Procesando archivo...
            </div>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {csvData && !error && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Archivo "{fileName}" cargado exitosamente. Se encontraron {csvData.rows.length} filas con{" "}
                {csvData.headers.length} columnas.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {csvData && !error && (
        <Card>
          <CardHeader>
            <CardTitle>Datos del CSV</CardTitle>
            <CardDescription>Mostrando {csvData.rows.length} filas de datos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border overflow-auto max-h-96">
              <Table>
                <TableHeader>
                  <TableRow>
                    {csvData.headers.map((header, index) => (
                      <TableHead key={index} className="font-semibold">
                        {header}
                        {header.toLowerCase() === "number" && <span className="ml-1 text-xs text-green-600">✓</span>}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {csvData.rows.map((row, rowIndex) => (
                    <TableRow key={rowIndex}>
                      {csvData.headers.map((header, colIndex) => (
                        <TableCell key={colIndex} className="font-mono text-sm">
                          {row[header] || "-"}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
