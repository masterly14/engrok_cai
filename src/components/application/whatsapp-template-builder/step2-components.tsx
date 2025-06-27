"use client"

import { Label } from "@/components/ui/label"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PlusCircle } from "lucide-react"
import type { TemplateComponent, TemplateFormData } from "./types"
import ComponentEditor from "./component-editor"
// Note: Drag and drop reordering is not implemented in this version for brevity.
// import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
// import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
// import { SortableItem } from './sortable-item'; // A wrapper for Draggable items

interface Step2ComponentsProps {
  formData: TemplateFormData
  onFormChange: (field: keyof TemplateFormData, value: any) => void
}

const AVAILABLE_COMPONENTS = ["HEADER", "FOOTER", "BUTTONS"] as const // BODY is always present

export default function Step2Components({ formData, onFormChange }: Step2ComponentsProps) {
  const [components, setComponents] = useState<TemplateComponent[]>(formData.components)
  const [componentToAdd, setComponentToAdd] = useState<(typeof AVAILABLE_COMPONENTS)[number] | "">("")

  useEffect(() => {
    setComponents(formData.components)
  }, [formData.components])

  const updateComponentsInForm = (updatedComponents: TemplateComponent[]) => {
    // Ensure BODY is always first if present, then HEADER, then FOOTER, then BUTTONS
    // This is a simplified sort, a more robust one would use predefined order.
    const sorted = [...updatedComponents].sort((a, b) => {
      const order = { HEADER: 1, BODY: 0, FOOTER: 2, BUTTONS: 3 }
      return (order[a.type as keyof typeof order] || 99) - (order[b.type as keyof typeof order] || 99)
    })
    setComponents(sorted)
    onFormChange("components", sorted)
  }

  const addComponent = () => {
    if (!componentToAdd) return
    if (components.find((c) => c.type === componentToAdd)) return // Prevent adding duplicates of HEADER, FOOTER, BUTTONS

    let newComponent: TemplateComponent
    switch (componentToAdd) {
      case "HEADER":
        newComponent = { type: "HEADER", format: "TEXT", text: "", example: { header_text: [""] } }
        break
      case "FOOTER":
        newComponent = { type: "FOOTER", text: "" }
        break
      case "BUTTONS":
        if (formData.category === "AUTHENTICATION") {
          newComponent = {
            type: "BUTTONS",
            buttons: [{ type: "OTP", text: "Copy Code", otp_type: "COPY_CODE" } as any],
          }
        } else {
          newComponent = { type: "BUTTONS", buttons: [] }
        }
        break
      default:
        return
    }
    updateComponentsInForm([...components, newComponent])
    setComponentToAdd("")
  }

  const updateComponent = (index: number, componentData: TemplateComponent) => {
    const updated = [...components]
    updated[index] = componentData
    updateComponentsInForm(updated)
  }

  const removeComponent = (index: number) => {
    const componentToRemove = components[index]
    if (componentToRemove.type === "BODY") return // Should not happen if button is disabled
    updateComponentsInForm(components.filter((_, i) => i !== index))
  }

  // Drag and Drop (DND) setup - commented out for brevity
  // const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));
  // function handleDragEnd(event: any) {
  //   const {active, over} = event;
  //   if (active.id !== over.id) {
  //     setComponents((items) => {
  //       const oldIndex = items.findIndex(item => item.type === active.id); // Assuming type is unique ID for DND
  //       const newIndex = items.findIndex(item => item.type === over.id);
  //       const newOrder = arrayMove(items, oldIndex, newIndex);
  //       onFormChange("components", newOrder);
  //       return newOrder;
  //     });
  //   }
  // }

  // Ensure BODY is always present and is the first component editor shown
  const bodyComponent = components.find((c) => c.type === "BODY")
  const otherComponents = components.filter((c) => c.type !== "BODY")

  return (
    <div className="space-y-6">
      {bodyComponent && (
        <ComponentEditor
          key="BODY"
          index={components.indexOf(bodyComponent)} // Find its actual index for updates
          component={bodyComponent}
          updateComponent={updateComponent}
          removeComponent={removeComponent} // Will be disabled for BODY
          isBody={true}
          category={formData.category}
        />
      )}

      {/* DND Context would wrap this part */}
      {/* <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}> */}
      {/* <SortableContext items={otherComponents.map(c => c.type)} strategy={verticalListSortingStrategy}> */}
      {otherComponents.map((comp, idx) => {
        const originalIndex = components.findIndex((c) => c.type === comp.type && c.text === comp.text) // Find original index based on more unique props if needed
        // const SortableWrapper = SortableItem as any; // Cast for now
        return (
          // <SortableWrapper key={comp.type} id={comp.type}>
          <div key={originalIndex}>
            {" "}
            {/* Use originalIndex for key if type isn't unique enough */}
            <ComponentEditor
              index={originalIndex}
              component={comp}
              updateComponent={updateComponent}
              removeComponent={removeComponent}
              category={formData.category}
            />
          </div>
          // </SortableWrapper>
        )
      })}
      {/* </SortableContext> */}
      {/* </DndContext> */}

      <div className="flex items-end gap-2 pt-4 border-t">
        <div className="flex-grow">
          <Label htmlFor="component-to-add">Añadir Componente (Opcional)</Label>
          <Select value={componentToAdd} onValueChange={(val) => setComponentToAdd(val as any)}>
            <SelectTrigger id="component-to-add">
              <SelectValue placeholder="Seleccionar componente..." />
            </SelectTrigger>
            <SelectContent>
              {AVAILABLE_COMPONENTS.map((type) => {
                const isAdded = components.some((c) => c.type === type)
                return (
                  <SelectItem key={type} value={type} disabled={isAdded}>
                    {type} {isAdded ? "(Añadido)" : ""}
                  </SelectItem>
                )
              })}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={addComponent} disabled={!componentToAdd || components.some((c) => c.type === componentToAdd)}>
          <PlusCircle className="mr-2 h-4 w-4" /> Añadir
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        El componente BODY es obligatorio. HEADER, FOOTER y BUTTONS son opcionales. Puedes reordenar los componentes
        arrastrándolos (funcionalidad pendiente).
      </p>
    </div>
  )
}
