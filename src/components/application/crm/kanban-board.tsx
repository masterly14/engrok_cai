"use client"

import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd"
import type { Lead, Stage, Tag } from "@/lib/data"
import { LeadCard } from "./lead-card"
import { useMemo, useEffect } from "react"

interface KanbanBoardProps {
  leads: Lead[]
  stages: Stage[]
  tags: Tag[]
  onLeadClick: (lead: Lead) => void
  onDragEnd: (result: any) => void
}


export function KanbanBoard({ leads, stages, tags, onLeadClick, onDragEnd }: KanbanBoardProps) {
  const gridColsClass = useMemo(() => {
    if (stages.length <= 3) return "md:grid-cols-3"
    if (stages.length === 4) return "md:grid-cols-4"
    if (stages.length === 5) return "md:grid-cols-5"
    if (stages.length === 6) return "md:grid-cols-6"
    return "md:grid-cols-6"
  }, [stages.length])

  // Determinar el tamaño de texto y padding basado en el número de columnas
  const columnSizeClass = useMemo(() => {
    if (stages.length <= 3) return "text-base p-3"
    if (stages.length === 4) return "text-sm p-2"
    return "text-xs p-1.5" // Para 5 o más columnas
  }, [stages.length])

  // Organizamos las etapas en filas
  const stageRows = useMemo(() => {
    const result = []
    const maxColsPerRow = 6
    
    for (let i = 0; i < stages.length; i += maxColsPerRow) {
      result.push(stages.slice(i, i + maxColsPerRow))
    }
    
    return result
  }, [stages])

  // Implementamos el auto-scroll durante el arrastre
  useEffect(() => {
    let scrollInterval: any = null;
    
    // Función para determinar la dirección y velocidad del scroll
    const handleScroll = (clientY: number) => {
      const scrollSpeed = 15; // Velocidad de desplazamiento
      const scrollThreshold = 150; // Umbral de activación del scroll en píxeles desde los bordes
      
      const viewportHeight = window.innerHeight;
      
      // Scroll hacia arriba si el cursor está cerca del borde superior
      if (clientY < scrollThreshold) {
        const scrollAmount = Math.max((scrollThreshold - clientY) / scrollThreshold, 0.1) * scrollSpeed;
        window.scrollBy(0, -scrollAmount);
      } 
      // Scroll hacia abajo si el cursor está cerca del borde inferior
      else if (clientY > viewportHeight - scrollThreshold) {
        const scrollAmount = Math.max((clientY - (viewportHeight - scrollThreshold)) / scrollThreshold, 0.1) * scrollSpeed;
        window.scrollBy(0, scrollAmount);
      }
    };
    
    // Escuchar el evento de arrastre para implementar el auto-scroll
    const handleDragOver = (e: DragEvent) => {
      if (scrollInterval) return; // Evitar crear múltiples intervalos
      
      scrollInterval = setInterval(() => {
        if (e.clientY) {
          handleScroll(e.clientY);
        }
      }, 16); // ~60fps para un scroll fluido
    };
    
    // Detener el auto-scroll cuando el arrastre termina
    const handleDragEnd = () => {
      if (scrollInterval) {
        clearInterval(scrollInterval);
        scrollInterval = null;
      }
    };
    
    // Agregar eventos
    document.addEventListener('dragover', handleDragOver);
    document.addEventListener('dragend', handleDragEnd);
    document.addEventListener('drop', handleDragEnd);
    
    // Limpiar eventos
    return () => {
      document.removeEventListener('dragover', handleDragOver);
      document.removeEventListener('dragend', handleDragEnd);
      document.removeEventListener('drop', handleDragEnd);
      if (scrollInterval) {
        clearInterval(scrollInterval);
      }
    };
  }, []);

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="flex flex-col gap-6">
        {stageRows.map((rowStages, rowIndex) => (
          <div 
            key={`row-${rowIndex}`} 
            className={`grid grid-cols-1 ${gridColsClass} gap-2 h-full auto-cols-fr`}
          >
            {rowStages.map((stage) => (
              <div key={stage.id} className="flex flex-col h-full">
                <div
                  className={`rounded-t-lg border-b font-medium ${columnSizeClass}`}
                  style={{
                    backgroundColor: `${stage.color}10`, // 10% opacity
                    borderBottom: `2px solid ${stage.color}`,
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: stage.color }} />
                      <h3 className="truncate">{stage.name}</h3>
                    </div>
                    <div className="bg-muted text-muted-foreground text-xs px-1.5 py-0.5 rounded-full">
                      {leads.filter((lead) => lead.status === stage.id).length}
                    </div>
                  </div>
                </div>
                <Droppable droppableId={stage.id}>
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`flex-1 overflow-y-auto rounded-b-lg ${stages.length > 4 ? "p-1" : "p-2"} min-h-[250px] border border-t-0`}
                    >
                      {leads
                        .filter((lead) => lead.status === stage.id)
                        .map((lead, index) => (
                          <Draggable key={lead.id} draggableId={lead.id} index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={`mb-${stages.length > 4 ? "1" : "2"}`}
                                style={{
                                  ...provided.draggableProps.style,
                                  // Asegurarse de que el elemento arrastrado esté por encima de todo
                                  zIndex: snapshot.isDragging ? 9999 : 'auto'
                                }}
                              >
                                <LeadCard 
                                  lead={lead} 
                                  tags={tags} 
                                  onClick={() => onLeadClick(lead)} 
                                  compact={stages.length > 4}
                                />
                              </div>
                            )}
                          </Draggable>
                        ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            ))}
          </div>
        ))}
      </div>
    </DragDropContext>
  )
}