"use client"

import { useState } from "react"
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Trash2, AlertTriangle, Phone, Database, CreditCard, Loader2 } from "lucide-react"
import { useDeleteAgent } from "@/hooks/use-delete-agent"

type Props = {
  agentId: string
  vapiId: string
  onSuccess?: () => void
}

const DeleteAgent = ({ agentId, vapiId, onSuccess }: Props) => {
  const [isOpen, setIsOpen] = useState(false)
  const deleteAgentMutation = useDeleteAgent()

  const handleDelete = async () => {
    try {
      await deleteAgentMutation.mutateAsync({ agentId, vapiId })
      setIsOpen(false)
      onSuccess?.()
    } catch (error) {
      console.error(error)
    }
  }

  const preservedData = [
    {
      icon: Phone,
      text: "Número de teléfono asociado a este agente",
    },
    {
      icon: Database,
      text: "Bases de conocimiento asociadas a este agente",
    },
    {
      icon: CreditCard,
      text: "Los créditos consumidos por este agente",
    },
  ]

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="destructive"
          className="bg-red-600 hover:bg-red-700 text-white shadow-sm transition-all duration-200 hover:shadow-md"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Eliminar agente
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center space-y-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-50 ring-8 ring-red-50">
            <AlertTriangle className="h-8 w-8 text-red-600" />
          </div>
          <div className="space-y-2">
            <DialogTitle className="text-xl font-semibold text-gray-900">¿Eliminar agente?</DialogTitle>
            <DialogDescription className="text-sm text-gray-600 leading-relaxed">
              Esta acción es <span className="font-medium text-gray-900">irreversible</span>. El agente será eliminado
              permanentemente de tu cuenta.
            </DialogDescription>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-lg bg-amber-50 border border-amber-200 p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="text-sm font-medium text-amber-800 mb-2">Los siguientes datos se conservarán:</h4>
                <ul className="space-y-2">
                  {preservedData.map((item, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-amber-700">
                      <item.icon className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <span>{item.text}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => setIsOpen(false)}
            className="w-full sm:w-auto border-gray-300 hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={deleteAgentMutation.isPending}
            className="w-full sm:w-auto bg-red-600 hover:bg-red-700 disabled:opacity-50 transition-all duration-200"
          >
            {deleteAgentMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Eliminando...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4 mr-2" />
                Eliminar agente
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default DeleteAgent
