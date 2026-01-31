import { useState } from "react";
import { Plus, Pencil, Trash2, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export interface Whiteboard {
  id: string;
  name: string;
  data: string;
  createdAt: Date;
  updatedAt: Date;
}

interface WhiteboardListProps {
  whiteboards: Whiteboard[];
  onSelect: (whiteboard: Whiteboard) => void;
  onCreate: (name: string) => void;
  onRename: (id: string, name: string) => void;
  onDelete: (id: string) => void;
}

export default function WhiteboardList({
  whiteboards,
  onSelect,
  onCreate,
  onRename,
  onDelete,
}: WhiteboardListProps) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isRenameOpen, setIsRenameOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const handleCreate = () => {
    if (newName.trim()) {
      onCreate(newName.trim());
      setNewName("");
      setIsCreateOpen(false);
    }
  };

  const handleRename = () => {
    if (newName.trim() && selectedId) {
      onRename(selectedId, newName.trim());
      setNewName("");
      setSelectedId(null);
      setIsRenameOpen(false);
    }
  };

  const openRename = (whiteboard: Whiteboard) => {
    setSelectedId(whiteboard.id);
    setNewName(whiteboard.name);
    setIsRenameOpen(true);
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Whiteboards</h1>
          <p className="text-muted-foreground">Create and manage your visual workspaces</p>
        </div>
        <Button variant="hero" onClick={() => setIsCreateOpen(true)}>
          <Plus className="w-4 h-4" />
          New Whiteboard
        </Button>
      </div>

      {whiteboards.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-secondary mx-auto mb-4 flex items-center justify-center">
            <Pencil className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No whiteboards yet</h3>
          <p className="text-muted-foreground mb-4">Create your first whiteboard to start sketching ideas</p>
          <Button variant="hero" onClick={() => setIsCreateOpen(true)}>
            <Plus className="w-4 h-4" />
            Create Whiteboard
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {whiteboards.map((whiteboard) => (
            <Card
              key={whiteboard.id}
              className={cn(
                "group p-4 cursor-pointer hover:border-primary/50 hover:shadow-soft transition-all"
              )}
              onClick={() => onSelect(whiteboard)}
            >
              <div className="aspect-video bg-muted rounded-lg mb-3 flex items-center justify-center overflow-hidden">
                <Pencil className="w-8 h-8 text-muted-foreground/50" />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium truncate">{whiteboard.name}</h3>
                  <p className="text-xs text-muted-foreground">
                    Updated {whiteboard.updatedAt.toLocaleDateString()}
                  </p>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={(e) => {
                      e.stopPropagation();
                      openRename(whiteboard);
                    }}>
                      <Pencil className="w-4 h-4 mr-2" />
                      Rename
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(whiteboard.id);
                      }}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Whiteboard</DialogTitle>
          </DialogHeader>
          <Input
            placeholder="Whiteboard name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button variant="hero" onClick={handleCreate} disabled={!newName.trim()}>
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rename Dialog */}
      <Dialog open={isRenameOpen} onOpenChange={setIsRenameOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Whiteboard</DialogTitle>
          </DialogHeader>
          <Input
            placeholder="Whiteboard name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleRename()}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRenameOpen(false)}>
              Cancel
            </Button>
            <Button variant="hero" onClick={handleRename} disabled={!newName.trim()}>
              Rename
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
