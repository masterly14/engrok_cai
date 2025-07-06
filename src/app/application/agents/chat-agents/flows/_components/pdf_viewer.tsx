"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { X, Expand } from "lucide-react"
import type { ReactNode } from "react"

interface PdfViewerProps {
  fileUrl: string
  title: string
  children: ReactNode
}

export function PdfViewer({ fileUrl, title, children }: PdfViewerProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="p-0 w-screen h-screen max-w-none rounded-none flex flex-col">
        <DialogHeader className="p-4 pb-2 flex-row items-center justify-between border-b">
          <DialogTitle className="truncate">{title}</DialogTitle>
          <div className="flex items-center gap-2 flex-shrink-0">
            <a href={fileUrl} target="_blank" rel="noopener noreferrer">
              <Button variant="ghost" size="icon" aria-label="Abrir en nueva pestaña">
                <Expand className="h-4 w-4" />
              </Button>
            </a>
            <DialogClose asChild>
              <Button variant="ghost" size="icon" aria-label="Cerrar">
                <X className="h-4 w-4" />
              </Button>
            </DialogClose>
          </div>
        </DialogHeader>
        <div className="flex-1 bg-gray-200">
          <iframe
            src={fileUrl}
            title={title}
            className="w-full h-full"
            frameBorder="0"
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
