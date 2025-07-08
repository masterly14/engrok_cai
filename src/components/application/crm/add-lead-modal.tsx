"use client";

import type React from "react";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import type { Lead, Tag, Stage } from "@/lib/data";
import { v4 as uuidv4 } from "uuid";

interface AddLeadModalProps {
  open: boolean;
  tags: Tag[];
  stages: Stage[];
  onClose: () => void;
  onAdd: (lead: Lead) => void;
}

export function AddLeadModal({
  open,
  tags,
  stages,
  onClose,
  onAdd,
}: AddLeadModalProps) {
  const [newLead, setNewLead] = useState<Partial<Lead>>({
    name: "",
    company: "",
    email: "",
    phone: "",
    status: stages[0]?.id || "new",
    tags: [],
    notes: "",
    lastContact: new Date().toISOString(),
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setNewLead({ ...newLead, [name]: value });
  };

  const handleSelectChange = (value: string) => {
    setNewLead({ ...newLead, status: value });
  };

  const handleTagSelect = (tagName: string) => {
    if (!newLead.tags?.includes(tagName)) {
      setNewLead({ ...newLead, tags: [...(newLead.tags || []), tagName] });
    }
  };

  const handleTagRemove = (tag: string) => {
    setNewLead({ ...newLead, tags: newLead.tags?.filter((t) => t !== tag) });
  };

  const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value =
      e.target.value === "" ? undefined : Number.parseFloat(e.target.value);
    setNewLead({ ...newLead, value });
  };

  const handleSubmit = () => {
    // Validate required fields
    if (!newLead.name || !newLead.company || !newLead.email) {
      return; // Add proper validation feedback in a real app
    }

    const lead: Lead = {
      id: uuidv4(),
      name: newLead.name || "",
      company: newLead.company || "",
      email: newLead.email || "",
      phone: newLead.phone || "",
      status: newLead.status || stages[0]?.id || "new",
      tags: newLead.tags || [],
      notes: newLead.notes || "",
      lastContact: newLead.lastContact || new Date().toISOString(),
      value: newLead.value,
    };

    onAdd(lead);

    // Reset form
    setNewLead({
      name: "",
      company: "",
      email: "",
      phone: "",
      status: stages[0]?.id || "new",
      tags: [],
      notes: "",
      lastContact: new Date().toISOString(),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="text-xl">Agregar lead</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre *</Label>
              <Input
                id="name"
                name="name"
                value={newLead.name || ""}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company">Empresa *</Label>
              <Input
                id="company"
                name="company"
                value={newLead.company || ""}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={newLead.email || ""}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Teléfono</Label>
              <Input
                id="phone"
                name="phone"
                value={newLead.phone || ""}
                onChange={handleInputChange}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">Etapa</Label>
              <Select
                value={newLead.status || ""}
                onValueChange={handleSelectChange}
                defaultValue={stages[0]?.id || "new"}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar etapa" />
                </SelectTrigger>
                <SelectContent>
                  {stages.map((stage) => (
                    <SelectItem key={stage.id} value={stage.id}>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: stage.color }}
                        />
                        {stage.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="value">Valor ($)</Label>
              <Input
                id="value"
                name="value"
                type="number"
                value={newLead.value || ""}
                onChange={handleValueChange}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Etiquetas</Label>
            <div className="flex flex-wrap gap-2 mb-2">
              {newLead.tags?.map((tagName) => {
                const tagData = tags.find((t) => t.name === tagName);
                return (
                  <Badge
                    key={tagName}
                    variant="outline"
                    className="flex items-center gap-1"
                    style={{
                      borderColor: tagData?.color,
                      backgroundColor: `${tagData?.color}20`, // 20% opacity
                    }}
                  >
                    {tagName}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => handleTagRemove(tagName)}
                    />
                  </Badge>
                );
              })}
            </div>
            <Select onValueChange={handleTagSelect}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar una etiqueta" />
              </SelectTrigger>
              <SelectContent>
                {tags
                  .filter((tag) => !newLead.tags?.includes(tag.name))
                  .map((tag) => (
                    <SelectItem key={tag.name} value={tag.name}>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: tag.color }}
                        />
                        {tag.name}
                      </div>
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Notas</Label>
            <Textarea
              id="notes"
              name="notes"
              rows={4}
              value={newLead.notes || ""}
              onChange={handleInputChange}
              placeholder="Agregar cualquier información adicional sobre este lead..."
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit}>Agregar lead</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
