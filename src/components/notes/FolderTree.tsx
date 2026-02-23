import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NoteFolder, useNoteFolders } from "@/hooks/useNoteFolders";
import { Note } from "@/hooks/useNotes";
import {
  Folder,
  FolderOpen,
  ChevronRight,
  ChevronDown,
  Plus,
  Star,
  FileText,
  MoreVertical,
  Trash2,
  Edit2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface FolderTreeProps {
  notes: Note[];
  selectedNoteId: string | null;
  onSelectNote: (note: Note) => void;
  onSelectFolder: (folderId: string | null) => void;
  currentFolderId: string | null;
  favoriteNotes: string[];
  onToggleFavorite: (noteId: string) => void;
}

export function FolderTree({
  notes,
  selectedNoteId,
  onSelectNote,
  onSelectFolder,
  currentFolderId,
  favoriteNotes,
  onToggleFavorite,
}: FolderTreeProps) {
  const { folders, createFolder, deleteFolder, updateFolder } = useNoteFolders();
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [creatingFolder, setCreatingFolder] = useState<string | null>(null);
  const [newFolderName, setNewFolderName] = useState("");
  const [editingFolder, setEditingFolder] = useState<string | null>(null);
  const [editFolderName, setEditFolderName] = useState("");

  const toggleExpand = (folderId: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next;
    });
  };

  const handleCreateFolder = async (parentId: string | null) => {
    if (!newFolderName.trim()) return;
    await createFolder(newFolderName, parentId);
    setNewFolderName("");
    setCreatingFolder(null);
  };

  const handleUpdateFolder = async (folderId: string) => {
    if (!editFolderName.trim()) return;
    await updateFolder(folderId, { name: editFolderName });
    setEditingFolder(null);
    setEditFolderName("");
  };

  const getChildFolders = (parentId: string | null) => 
    folders.filter((f) => f.parent_id === parentId);

  const getNotesInFolder = (folderId: string | null) => {
    // For now, notes with null folder_path are in root
    // In a full implementation, we'd use folder_path or parent_folder_id
    if (folderId === null) {
      return notes.filter((n) => !n.subject); // Using subject as folder for now
    }
    const folder = folders.find((f) => f.id === folderId);
    return notes.filter((n) => n.subject === folder?.name);
  };

  const renderFolder = (folder: NoteFolder, depth: number = 0) => {
    const isExpanded = expandedFolders.has(folder.id);
    const childFolders = getChildFolders(folder.id);
    const folderNotes = getNotesInFolder(folder.id);
    const isSelected = currentFolderId === folder.id;

    return (
      <div key={folder.id}>
        <div
          className={cn(
            "flex items-center gap-1 py-1.5 px-2 rounded-md cursor-pointer group hover:bg-muted",
            isSelected && "bg-primary/10"
          )}
          style={{ paddingLeft: `${depth * 16 + 8}px` }}
        >
          <button
            className="p-0.5 hover:bg-muted-foreground/20 rounded"
            onClick={() => toggleExpand(folder.id)}
          >
            {isExpanded ? (
              <ChevronDown className="h-3.5 w-3.5" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5" />
            )}
          </button>
          
          {isExpanded ? (
            <FolderOpen className="h-4 w-4 text-primary" />
          ) : (
            <Folder className="h-4 w-4 text-muted-foreground" />
          )}
          
          {editingFolder === folder.id ? (
            <Input
              value={editFolderName}
              onChange={(e) => setEditFolderName(e.target.value)}
              onBlur={() => handleUpdateFolder(folder.id)}
              onKeyDown={(e) => e.key === "Enter" && handleUpdateFolder(folder.id)}
              className="h-6 text-xs flex-1"
              autoFocus
            />
          ) : (
            <span
              className="flex-1 text-sm truncate"
              onClick={() => onSelectFolder(folder.id)}
            >
              {folder.name}
            </span>
          )}
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 opacity-0 group-hover:opacity-100"
              >
                <MoreVertical className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => {
                  setEditingFolder(folder.id);
                  setEditFolderName(folder.name);
                }}
              >
                <Edit2 className="h-4 w-4 mr-2" />
                Rename
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setCreatingFolder(folder.id)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Subfolder
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => deleteFolder(folder.id)}
                className="text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {isExpanded && (
          <>
            {creatingFolder === folder.id && (
              <div
                className="flex items-center gap-2 py-1 px-2"
                style={{ paddingLeft: `${(depth + 1) * 16 + 8}px` }}
              >
                <Folder className="h-4 w-4 text-muted-foreground" />
                <Input
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  onBlur={() => handleCreateFolder(folder.id)}
                  onKeyDown={(e) => e.key === "Enter" && handleCreateFolder(folder.id)}
                  placeholder="Folder name..."
                  className="h-6 text-xs flex-1"
                  autoFocus
                />
              </div>
            )}
            
            {childFolders.map((child) => renderFolder(child, depth + 1))}
            
            {folderNotes.map((note) => (
              <div
                key={note.id}
                className={cn(
                  "flex items-center gap-2 py-1.5 px-2 rounded-md cursor-pointer hover:bg-muted group",
                  selectedNoteId === note.id && "bg-primary/10"
                )}
                style={{ paddingLeft: `${(depth + 1) * 16 + 8}px` }}
                onClick={() => onSelectNote(note)}
              >
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="flex-1 text-sm truncate">{note.title}</span>
                <button
                  className={cn(
                    "opacity-0 group-hover:opacity-100",
                    favoriteNotes.includes(note.id) && "opacity-100"
                  )}
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleFavorite(note.id);
                  }}
                >
                  <Star
                    className={cn(
                      "h-4 w-4",
                      favoriteNotes.includes(note.id)
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-muted-foreground"
                    )}
                  />
                </button>
              </div>
            ))}
          </>
        )}
      </div>
    );
  };

  const rootFolders = getChildFolders(null);
  const rootNotes = getNotesInFolder(null);

  return (
    <div className="space-y-1">
      {/* Favorites Section */}
      {favoriteNotes.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center gap-2 px-2 py-1 text-xs font-semibold text-muted-foreground uppercase">
            <Star className="h-3.5 w-3.5" />
            Favorites
          </div>
          {notes
            .filter((n) => favoriteNotes.includes(n.id))
            .map((note) => (
              <div
                key={note.id}
                className={cn(
                  "flex items-center gap-2 py-1.5 px-2 rounded-md cursor-pointer hover:bg-muted",
                  selectedNoteId === note.id && "bg-primary/10"
                )}
                onClick={() => onSelectNote(note)}
              >
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="flex-1 text-sm truncate">{note.title}</span>
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              </div>
            ))}
        </div>
      )}

      {/* Folder Tree */}
      <div className="flex items-center justify-between px-2 py-1">
        <span className="text-xs font-semibold text-muted-foreground uppercase">
          Folders
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={() => setCreatingFolder("root")}
        >
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>

      {creatingFolder === "root" && (
        <div className="flex items-center gap-2 py-1 px-2">
          <Folder className="h-4 w-4 text-muted-foreground" />
          <Input
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            onBlur={() => handleCreateFolder(null)}
            onKeyDown={(e) => e.key === "Enter" && handleCreateFolder(null)}
            placeholder="Folder name..."
            className="h-6 text-xs flex-1"
            autoFocus
          />
        </div>
      )}

      {rootFolders.map((folder) => renderFolder(folder))}

      {/* Root Notes (not in any folder) */}
      {rootNotes.length > 0 && (
        <div className="mt-2">
          <div className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase">
            Uncategorized
          </div>
          {rootNotes.map((note) => (
            <div
              key={note.id}
              className={cn(
                "flex items-center gap-2 py-1.5 px-2 rounded-md cursor-pointer hover:bg-muted group",
                selectedNoteId === note.id && "bg-primary/10"
              )}
              onClick={() => onSelectNote(note)}
            >
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="flex-1 text-sm truncate">{note.title}</span>
              <button
                className={cn(
                  "opacity-0 group-hover:opacity-100",
                  favoriteNotes.includes(note.id) && "opacity-100"
                )}
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleFavorite(note.id);
                }}
              >
                <Star
                  className={cn(
                    "h-4 w-4",
                    favoriteNotes.includes(note.id)
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-muted-foreground"
                  )}
                />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
