"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Save, Play, Menu, X, Cloud, CloudOff, RefreshCw } from "lucide-react"
import { getWorkflow } from "@/actions/workflow"

interface WorkflowToolbarProps {
  workflowName: string
  setWorkflowName: (name: string) => void
  onSave: () => Promise<boolean>
  isSaving: boolean
  workflowId: string
  sidebarOpen: boolean
  onToggleSidebar: () => void
}

export function WorkflowToolbar({
  workflowName,
  setWorkflowName,
  onSave,
  isSaving,
  workflowId,
  sidebarOpen,
  onToggleSidebar,
}: WorkflowToolbarProps) {
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false)
  const [vapiStatus, setVapiStatus] = useState<'synced' | 'not-synced' | 'loading'>('loading')

  // Verificar estado de sincronización con Vapi
  useEffect(() => {
    const checkVapiStatus = async () => {
      if (!workflowId) {
        setVapiStatus('not-synced')
        return
      }

      try {
        const response = await getWorkflow(workflowId)
        if (response.status === 200 && response.workflow) {
          setVapiStatus(response.workflow.vapiWorkflowId ? 'synced' : 'not-synced')
        } else {
          setVapiStatus('not-synced')
        }
      } catch (error) {
        console.error('Error checking Vapi status:', error)
        setVapiStatus('not-synced')
      }
    }

    checkVapiStatus()
  }, [workflowId])

  const handleSaveWorkflow = async () => {
    const success = await onSave()
    if (success) {
      setIsSaveDialogOpen(false)
      // Actualizar estado de Vapi después de guardar
      setTimeout(() => {
        const checkVapiStatus = async () => {
          try {
            const response = await getWorkflow(workflowId)
            if (response.status === 200 && response.workflow) {
              setVapiStatus(response.workflow.vapiWorkflowId ? 'synced' : 'not-synced')
            }
          } catch (error) {
            console.error('Error checking Vapi status:', error)
          }
        }
        checkVapiStatus()
      }, 1000)
    }
  }

  const getVapiStatusIcon = () => {
    switch (vapiStatus) {
      case 'synced':
        return <Cloud className="h-4 w-4 text-green-500" />
      case 'not-synced':
        return <CloudOff className="h-4 w-4 text-gray-400" />
      case 'loading':
        return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />
    }
  }

  const getVapiStatusText = () => {
    switch (vapiStatus) {
      case 'synced':
        return 'Sincronizado con Vapi'
      case 'not-synced':
        return 'No sincronizado'
      case 'loading':
        return 'Verificando...'
    }
  }

  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-4 border-b border-gray-200 bg-white px-6">
        <Button variant="ghost" size="sm" onClick={onToggleSidebar} className="h-9 w-9 p-0">
          {sidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </Button>

        <div className="h-6 w-px bg-gray-200"></div>

        <div className="flex items-center gap-2 flex-1">
          <h1 className="text-lg font-semibold text-gray-900">{workflowName || "Workflow sin título"}</h1>
          
          {/* Indicador de estado de Vapi */}
          <Badge variant="outline" className="flex items-center gap-1 text-xs">
            {getVapiStatusIcon()}
            {getVapiStatusText()}
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-9 gap-2">
            <Play className="h-4 w-4" />
            Probar
          </Button>

          <Button
            onClick={() => setIsSaveDialogOpen(true)}
            size="sm"
            className="h-9 gap-2 bg-blue-600 hover:bg-blue-700"
          >
            <Save className="h-4 w-4" />
            Guardar
          </Button>
        </div>
      </header>

      {/* Save Dialog */}
      <Dialog open={isSaveDialogOpen} onOpenChange={setIsSaveDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{workflowId ? "Actualizar Workflow" : "Guardar Workflow"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium">
                Nombre del Workflow
              </Label>
              <Input
                id="name"
                value={workflowName}
                onChange={(e) => setWorkflowName(e.target.value)}
                placeholder="Ingresa el nombre del workflow"
                className="w-full"
              />
            </div>
            
            {/* Información sobre sincronización con Vapi */}
            <div className="text-xs text-gray-600 bg-gray-50 p-3 rounded-md">
              <div className="flex items-center gap-2 mb-1">
                <Cloud className="h-3 w-3" />
                <span className="font-medium">Sincronización con Vapi AI</span>
              </div>
              <p>Este workflow se sincronizará automáticamente con Vapi AI para su ejecución en llamadas de voz.</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSaveDialogOpen(false)} disabled={isSaving}>
              Cancelar
            </Button>
            <Button
              onClick={handleSaveWorkflow}
              disabled={isSaving || !workflowName.trim()}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isSaving ? "Guardando..." : "Guardar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
