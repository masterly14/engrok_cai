"use client";

import { useEffect, useState } from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, GripVertical, Edit, Trash2 } from "lucide-react";
import type { Lead, Stage, Tag } from "@/lib/data";
import { HexColorPicker } from "react-colorful";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { createStage, createTag, deleteStage, deleteTag } from "@/actions/crm";
import { v4 as uuidv4 } from "uuid";

interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
  tags: Tag[];
  stages: Stage[];
  onTagsUpdate: (tags: Tag[]) => void;
  onStagesUpdate: (stages: Stage[]) => void;
  leads: Lead[];
}

export function SettingsModal({
  open,
  onClose,
  tags,
  stages,
  onTagsUpdate,
  onStagesUpdate,
  leads,
}: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState("tags");
  const [editedTags, setEditedTags] = useState(tags);
  const [editedStages, setEditedStages] = useState<Stage[]>(stages);
  const [newTagName, setNewTagName] = useState("");
  const [newTagColor, setNewTagColor] = useState("#6366f1");
  const [newStageName, setNewStageName] = useState("");
  const [newStageColor, setNewStageColor] = useState("#6366f1");
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [editingStage, setEditingStage] = useState<Stage | null>(null);
  const [permittedDelet, setPermittedDelet] = useState(true);
  const [itemToDelete, setItemToDelete] = useState<{
    type: "tag" | "stage";
    id: string;
  } | null>(null);

  console.log(
    "Tags props: ",
    tags,
    "EditedTags: ",
    editedTags,
    "Stages: ",
    stages,
  );
  console.log("Lead: ", leads);

  useEffect(() => {
    setEditedTags(tags);
    setEditedStages(stages);
  }, [tags, stages]);

  const createTagMutation = useMutation({
    mutationFn: async (tag: any) => {
      try {
        const response = await createTag(tag);
        return response;
      } catch (error) {
        console.error("Error creating tag:", error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
    },
  });

  const handleAddTag = () => {
    if (newTagName.trim() === "") return;

    if (editedTags.some((tag) => tag.name === newTagName.trim())) return;

    const newTag: Tag = {
      id: uuidv4(),
      name: newTagName.trim(),
      color: newTagColor,
    };

    createTagMutation.mutate(newTag);
    setEditedTags([newTag, ...editedTags]);
    setNewTagName("");
    setNewTagColor("#6366f1");
  };

  const createStageMutation = useMutation({
    mutationFn: async (Stage: any) => {
      try {
        const response = await createStage(Stage);
        return response;
      } catch (error) {
        console.error("Error creating Stage:", error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads"] });
    },
  });

  const queryClient = useQueryClient();
  const deleteTagMutation = useMutation({
    mutationFn: async (id: string) => {
      try {
        const response = await deleteTag(id);
        return response;
      } catch (error) {
        console.error("Error deleting tag:", error);
        throw error;
      }
    },
    onSuccess: () => {
      toast("Tag deleted satisfactorily");
      queryClient.invalidateQueries({ queryKey: ["leads"] });
    },
  });
  const deleteStageMutation = useMutation({
    mutationFn: async (id: string) => {
      try {
        const response = await deleteStage(id);
        return response;
      } catch (error) {
        console.error("Error deleting stage:", error);
        throw error;
      }
    },
    onSuccess: () => {
      toast.success("Stage deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["leads"] });
    },
  });

  const { mutateAsync: deleteStageAsync } = deleteStageMutation;

  const handleDeleteStage = async (stage: Stage) => {
    const exist = leads.some((lead) => lead.status === stage.id);
    console.log(exist);
    if (exist) {
      setTimeout(() => {
        setPermittedDelet(false);
      }, 1000);
      setPermittedDelet(true);
      return;
    }
    await deleteStageAsync(stage.id);
    const updatedStages = editedStages.filter((s) => s.id !== stage.id);
    setEditedStages(updatedStages);
  };

  const handleDeleteTag = (tag: Tag) => {
    deleteTagMutation.mutate(tag.id);
    setItemToDelete({ type: "tag", id: tag.id });
  };

  const handleAddStage = () => {
    if (newStageName.trim() === "") return;

    const newStage: Stage = {
      id: uuidv4(),
      name: newStageName.trim(),
      color: newStageColor,
    };
    createStageMutation.mutate(newStage);
    setEditedStages([newStage, ...editedStages]);
    setNewStageName("");
    setNewStageColor("#6366f1");
  };

  const handleSave = () => {
    onTagsUpdate(editedTags);
    onStagesUpdate(editedStages);
    onClose();
  };

  console.log("Edited tags: ", editedTags);
  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="text-xl">CRM Settings</DialogTitle>
          </DialogHeader>

          <Tabs
            defaultValue="tags"
            value={activeTab}
            onValueChange={setActiveTab}
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="tags">Tags</TabsTrigger>
              <TabsTrigger value="stages">Stages</TabsTrigger>
            </TabsList>

            <TabsContent value="tags" className="space-y-4 py-4">
              <div className="space-y-4">
                <div className="flex items-center justify-center gap-2">
                  <div className="flex-1 space-y-2">
                    <Label htmlFor="newTagName">New Tag Name</Label>
                    <Input
                      id="newTagName"
                      value={newTagName}
                      onChange={(e) => setNewTagName(e.target.value)}
                      placeholder="Enter tag name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Color</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-10 h-10"
                          style={{ backgroundColor: newTagColor }}
                        />
                      </PopoverTrigger>
                      <PopoverContent className="w-auto" align="start">
                        <HexColorPicker
                          color={newTagColor}
                          onChange={setNewTagColor}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <Button onClick={handleAddTag} size="icon">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                <div className="border rounded-md">
                  <div className="p-3 border-b bg-muted/50">
                    <h3 className="font-medium">Manage Tags</h3>
                  </div>
                  <div className="p-3 space-y-2 max-h-[300px] overflow-y-auto">
                    {editedTags.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        No tags created yet
                      </p>
                    ) : (
                      editedTags.map((tag) => (
                        <div
                          key={tag.name}
                          className="flex items-center justify-between p-2 border rounded-md"
                        >
                          <div className="flex items-center gap-2">
                            <div
                              className="w-4 h-4 rounded-full"
                              style={{ backgroundColor: tag.color }}
                            />
                            <span>{tag.name}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive"
                              onClick={() => handleDeleteTag(tag)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="stages" className="space-y-4 py-4">
              <div className="space-y-4">
                <div className="flex items-end gap-2">
                  <div className="flex-1 space-y-2">
                    <Label htmlFor="newStageName">New Stage Name</Label>
                    <Input
                      id="newStageName"
                      value={newStageName}
                      onChange={(e) => setNewStageName(e.target.value)}
                      placeholder="Enter stage name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Color</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-10 h-10 p-0"
                          style={{ backgroundColor: newStageColor }}
                        />
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <HexColorPicker
                          color={newStageColor}
                          onChange={setNewStageColor}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <Button onClick={handleAddStage} size="icon">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                <div className="border rounded-md">
                  <div className="p-3 border-b bg-muted/50">
                    <h3 className="font-medium">Manage Stages</h3>
                    <p className="text-sm text-muted-foreground">
                      Drag to reorder stages
                    </p>
                  </div>
                  {!permittedDelet && (
                    <div className="bg-destructive/40 p-5 rounded-md m-5 flex items-center h-20">
                      <p className="text-muted-foreground text-xm text-center">
                        The Stage you try to delete has associated leads.
                        Eliminate leads or change them to eliminate the Stage.
                      </p>
                    </div>
                  )}
                  <div className="p-3 space-y-2 max-h-[300px] overflow-y-auto">
                    {editedStages.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        No stages created yet
                      </p>
                    ) : (
                      editedStages.map((stage) => (
                        <div
                          key={stage.id}
                          className="flex items-center justify-between p-2 border rounded-md"
                        >
                          <div className="flex items-center gap-2">
                            <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
                            <div
                              className="w-4 h-4 rounded-full"
                              style={{ backgroundColor: stage.color }}
                            />
                            <span>{stage.name}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive"
                              onClick={() => handleDeleteStage(stage)}
                              disabled={editedStages.length <= 1}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Tag Dialog */}
      {editingTag && (
        <Dialog open={!!editingTag} onOpenChange={() => setEditingTag(null)}>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle>Edit Tag</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="editTagName">Tag Name</Label>
                <Input
                  id="editTagName"
                  value={editingTag.name}
                  onChange={(e) =>
                    setEditingTag({ ...editingTag, name: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Color</Label>
                <div className="flex items-center gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-10 h-10 p-0"
                        style={{ backgroundColor: editingTag.color }}
                      />
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <HexColorPicker
                        color={editingTag.color}
                        onChange={(color) =>
                          setEditingTag({ ...editingTag, color })
                        }
                      />
                    </PopoverContent>
                  </Popover>
                  <div
                    className="w-full h-10 rounded-md border"
                    style={{ backgroundColor: editingTag.color }}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingTag(null)}>
                Cancel
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Edit Stage Dialog */}
      {editingStage && (
        <Dialog
          open={!!editingStage}
          onOpenChange={() => setEditingStage(null)}
        >
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle>Edit Stage</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="editStageName">Stage Name</Label>
                <Input
                  id="editStageName"
                  value={editingStage.name}
                  onChange={(e) =>
                    setEditingStage({ ...editingStage, name: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Color</Label>
                <div className="flex items-center gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-10 h-10 p-0"
                        style={{ backgroundColor: editingStage.color }}
                      />
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <HexColorPicker
                        color={editingStage.color}
                        onChange={(color) =>
                          setEditingStage({ ...editingStage, color })
                        }
                      />
                    </PopoverContent>
                  </Popover>
                  <div
                    className="w-full h-10 rounded-md border"
                    style={{ backgroundColor: editingStage.color }}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingStage(null)}>
                Cancel
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
