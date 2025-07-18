"use client"
import { useState } from "react"
import { X, ChevronDown, HelpCircle, Play } from "lucide-react"
import ReactPlayer from "react-player"

interface VideoWidgetProps {
  videoUrl: string
  text: string
  initiallyOpen?: boolean
}

export default function VideoWidget({ videoUrl, text, initiallyOpen = true }: VideoWidgetProps) {
  const [open, setOpen] = useState(initiallyOpen)

  return (
    <div className={`fixed z-50 top-6 right-6 transition-all duration-300 ease-in-out ${open ? "w-80" : "w-14"}`}>
      <div className="bg-white shadow-2xl rounded-2xl overflow-hidden border border-gray-100 backdrop-blur-sm">
        {/* Header */}
        <div
          className={`flex items-center justify-between bg-gradient-to-r from-blue-500 to-purple-600 text-white ${
            open ? "px-4 py-3" : "p-3"
          }`}
        >
          {open ? (
            <>
              <div className="flex items-center gap-2">
                <HelpCircle className="w-4 h-4" />
                <span className="font-semibold text-sm">Ayuda Rápida</span>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => setOpen(false)}
                  className="hover:bg-white/20 p-1.5 rounded-lg transition-colors"
                  aria-label="Minimizar"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setOpen(false)}
                  className="hover:bg-white/20 p-1.5 rounded-lg transition-colors"
                  aria-label="Cerrar"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </>
          ) : (
            <button
              onClick={() => setOpen(true)}
              className="w-full h-full flex items-center justify-center hover:bg-white/20 rounded-lg transition-all duration-200 group"
              aria-label="Abrir ayuda"
            >
              <div className="relative">
                <HelpCircle className="w-5 h-5 group-hover:scale-110 transition-transform" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full flex items-center justify-center">
                  <Play className="w-1.5 h-1.5 fill-white" />
                </div>
              </div>
            </button>
          )}
        </div>

        {/* Content */}
        <div
          className={`transition-all duration-300 ease-in-out ${
            open ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
          } overflow-hidden`}
        >
          <div className="p-4 space-y-3">
            <div className="aspect-video rounded-xl overflow-hidden bg-gray-100 shadow-inner">
              <ReactPlayer
                src={videoUrl}
                width="100%"
                height="100%"
                controls
                light={false}
                config={{
                  youtube: {
                    rel: 0,
                  },
                }}
              />
            </div>
            <div className="space-y-2">
              <p className="text-sm text-gray-600 leading-relaxed">{text}</p>
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span>Video tutorial disponible</span>
              </div>
            </div>
          </div>
        </div>

        {/* Floating indicator when closed */}
        {!open && (
          <div className="absolute -top-2 -right-2 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center animate-bounce">
            <span className="text-white text-xs font-bold">!</span>
          </div>
        )}
      </div>

      {/* Tooltip when closed */}
      {!open && (
        <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 bg-gray-900 text-white px-3 py-2 rounded-lg text-sm whitespace-nowrap opacity-0 hover:opacity-100 transition-opacity pointer-events-none">
          Haz clic para ver la ayuda
          <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900"></div>
        </div>
      )}
    </div>
  )
}
