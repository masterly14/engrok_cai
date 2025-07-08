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
import { formatDate } from "@/lib/utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CreateUpdateLead, deleteLead } from "@/actions/crm";
import { toast } from "sonner";

interface LeadDetailModalProps {
  lead: Lead;
  tags: Tag[];
  stages: Stage[];
  open: boolean;
  onClose: () => void;
  onUpdate: (lead: Lead) => void;
}

export function LeadDetailModal({
  lead,
  tags,
  stages,
  open,
  onClose,
  onUpdate,
}: LeadDetailModalProps) {
  const [editMode, setEditMode] = useState(false);
  const [editedLead, setEditedLead] = useState<Lead>({
    ...lead,
    status: lead.status ?? undefined,
  });
  const [tagInput, setTagInput] = useState("");

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setEditedLead({ ...editedLead, [name]: value });
  };

  const handleSelectChange = (value: string) => {
    setEditedLead({ ...editedLead, status: value || undefined });
  };

  const handleTagAdd = () => {
    if (tagInput && !editedLead.tags.includes(tagInput)) {
      setEditedLead({ ...editedLead, tags: [...editedLead.tags, tagInput] });
      setTagInput("");
    }
  };

  const handleTagRemove = (tag: string) => {
    setEditedLead({
      ...editedLead,
      tags: editedLead.tags.filter((t) => t !== tag),
    });
  };

  const handleTagSelect = (tagName: string) => {
    if (!editedLead.tags.includes(tagName)) {
      setEditedLead({ ...editedLead, tags: [...editedLead.tags, tagName] });
    }
  };

  const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value =
      e.target.value === "" ? undefined : Number.parseFloat(e.target.value);
    setEditedLead({ ...editedLead, value });
  };

  const queryClient = useQueryClient();
  const updateLeadMutation = useMutation({
    mutationFn: async (Lead: Lead) => {
      try {
        const response = await CreateUpdateLead(Lead, Lead.id);
        return response;
      } catch (error) {
        console.error("Error updating lead:", error);
        throw error;
      }
    },
    onSuccess: () => {
      toast("Lead updated satisfactorily");
      queryClient.invalidateQueries({ queryKey: ["leads"] });
    },
  });

  const handleSave = () => {
    onUpdate(editedLead);
    updateLeadMutation.mutateAsync(editedLead);
    setEditMode(false);
  };

  const handleCancel = () => {
    setEditedLead({ ...lead });
    setEditMode(false);
  };

  const deleteLeadMutation = useMutation({
    mutationFn: async (lead: Lead) => {
      try {
        const response = await deleteLead(lead.id);
        return response;
      } catch (error) {
        console.error("Error deleting lead:", error);
        throw error;
      }
    },
    onSuccess: () => {
      toast("Lead deleted satisfactorily");
      queryClient.invalidateQueries({ queryKey: ["leads"] });
    },
  });
  const handleDeleteLead = () => {
    deleteLeadMutation.mutateAsync(lead);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {editMode ? "Edit Lead" : lead.name}
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {editMode ? (
            // Edit Mode
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    name="name"
                    value={editedLead.name}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company">Company</Label>
                  <Input
                    id="company"
                    name="company"
                    value={editedLead.company}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={editedLead.email}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    name="phone"
                    value={editedLead.phone}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={editedLead.status ?? undefined}
                    onValueChange={handleSelectChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
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
                  <Label htmlFor="value">Value ($)</Label>
                  <Input
                    id="value"
                    name="value"
                    type="number"
                    value={editedLead.value || ""}
                    onChange={handleValueChange}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Tags</Label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {editedLead.tags.map((tagName) => {
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
                <div className="flex gap-2">
                  <Select onValueChange={handleTagSelect}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a tag" />
                    </SelectTrigger>
                    <SelectContent>
                      {tags
                        .filter((tag) => !editedLead.tags.includes(tag.name))
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
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  name="notes"
                  rows={4}
                  value={editedLead.notes}
                  onChange={handleInputChange}
                />
              </div>
            </>
          ) : (
            // View Mode
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">
                    Company
                  </h3>
                  <p>{lead.company}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">
                    Status
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    {(() => {
                      const stageData = stages.find(
                        (s) => s.id === lead.status,
                      );
                      return stageData ? (
                        <>
                          <div
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: stageData.color }}
                          />
                          <p>{stageData.name}</p>
                        </>
                      ) : (
                        <p>Unknown</p>
                      );
                    })()}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">
                    Email
                  </h3>
                  <p>{lead.email}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">
                    Phone
                  </h3>
                  <p>{lead.phone}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">
                    Last Contact
                  </h3>
                  <p>{formatDate(lead.lastContact)}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">
                    Value
                  </h3>
                  <p>
                    {lead.value
                      ? `$${lead.value.toLocaleString()}`
                      : "Not specified"}
                  </p>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-muted-foreground">
                  Tags
                </h3>
                <div className="flex flex-wrap gap-1 mt-1">
                  {lead.tags.map((tagName) => {
                    const tagData = tags.find((t) => t.name === tagName);
                    return tagData ? (
                      <Badge
                        key={tagName}
                        variant="outline"
                        className="text-xs"
                        style={{
                          borderColor: tagData.color,
                          backgroundColor: `${tagData.color}20`, // 20% opacity
                          color: tagData.color,
                        }}
                      >
                        {tagName}
                      </Badge>
                    ) : null;
                  })}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-muted-foreground">
                  Notes
                </h3>
                <p className="whitespace-pre-line">
                  {lead.notes || "No notes"}
                </p>
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          {editMode ? (
            <>
              <Button variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button onClick={handleSave}>Save Changes</Button>
            </>
          ) : (
            <>
              <Button variant={"destructive"} onClick={handleDeleteLead}>
                Delete
              </Button>
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
              <Button onClick={() => setEditMode(true)}>Edit</Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
