import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Folder, FolderPlus, MoreHorizontal, Pencil, Trash2, FileText } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface DocumentFolder {
  id: number;
  userId: string;
  name: string;
  parentId: number | null;
  depth: number;
  color: string | null;
  createdAt: string;
  updatedAt: string;
}

interface FolderPanelProps {
  selectedFolderId: number | null;
  onFolderSelect: (folderId: number | null) => void;
}

const FOLDER_COLORS = [
  { value: "#3B82F6", label: "Blue" },
  { value: "#22C55E", label: "Green" },
  { value: "#EAB308", label: "Yellow" },
  { value: "#F97316", label: "Orange" },
  { value: "#EF4444", label: "Red" },
  { value: "#A855F7", label: "Purple" },
  { value: "#EC4899", label: "Pink" },
  { value: "#6B7280", label: "Gray" },
];


export default function FolderPanel({ selectedFolderId, onFolderSelect }: FolderPanelProps) {
  const { toast } = useToast();
  const [newFolderOpen, setNewFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [newFolderColor, setNewFolderColor] = useState("#3B82F6");
  const [editingFolder, setEditingFolder] = useState<DocumentFolder | null>(null);
  const [editName, setEditName] = useState("");

  const { data: folders = [], isLoading } = useQuery<DocumentFolder[]>({
    queryKey: ['/api/regtech/folders'],
  });

  const createFolderMutation = useMutation({
    mutationFn: async (data: { name: string; parentId: number | null; color: string }) => {
      return await apiRequest('/api/regtech/folders', 'POST', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/regtech/folders'] });
      setNewFolderOpen(false);
      setNewFolderName("");
      toast({ title: "Folder created" });
    },
    onError: (error: any) => {
      toast({ title: "Failed to create folder", description: error.message, variant: "destructive" });
    }
  });

  const updateFolderMutation = useMutation({
    mutationFn: async ({ id, name }: { id: number; name: string }) => {
      return await apiRequest(`/api/regtech/folders/${id}`, 'PATCH', { name });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/regtech/folders'] });
      setEditingFolder(null);
      toast({ title: "Folder renamed" });
    },
    onError: (error: any) => {
      toast({ title: "Failed to rename folder", description: error.message, variant: "destructive" });
    }
  });

  const deleteFolderMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest(`/api/regtech/folders/${id}`, 'DELETE');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/regtech/folders'] });
      if (selectedFolderId && selectedFolderId === editingFolder?.id) {
        onFolderSelect(null);
      }
      toast({ title: "Folder deleted" });
    },
    onError: (error: any) => {
      toast({ title: "Failed to delete folder", description: error.message, variant: "destructive" });
    }
  });

  const handleCreateFolder = () => {
    if (!newFolderName.trim()) return;
    createFolderMutation.mutate({
      name: newFolderName.trim(),
      parentId: selectedFolderId,
      color: newFolderColor,
    });
  };

  const handleRename = (folder: DocumentFolder) => {
    setEditingFolder(folder);
    setEditName(folder.name);
  };

  const handleDelete = (folder: DocumentFolder) => {
    if (confirm(`Are you sure you want to delete "${folder.name}"? Documents will be removed from this folder but not deleted.`)) {
      deleteFolderMutation.mutate(folder.id);
    }
  };

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between mb-2">
        <span className="font-medium text-sm text-slate-700">Folders</span>
        <Dialog open={newFolderOpen} onOpenChange={setNewFolderOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="sm" className="h-7 gap-1">
              <FolderPlus className="h-4 w-4" />
              <span className="text-xs">New Folder</span>
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Folder</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Folder Name</label>
                <Input
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="Enter folder name"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Color</label>
                <div className="flex gap-2">
                  {FOLDER_COLORS.map(c => (
                    <button
                      key={c.value}
                      className={cn(
                        "w-6 h-6 rounded-full",
                        newFolderColor === c.value && "ring-2 ring-offset-2 ring-blue-500"
                      )}
                      style={{ backgroundColor: c.value }}
                      onClick={() => setNewFolderColor(c.value)}
                    />
                  ))}
                </div>
              </div>
              {selectedFolderId && (
                <p className="text-sm text-slate-500">
                  Creating inside selected folder
                </p>
              )}
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button onClick={handleCreateFolder} disabled={createFolderMutation.isPending || !newFolderName.trim()}>
                Create
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
            selectedFolderId === null 
              ? "bg-slate-900 text-white" 
              : "bg-slate-100 text-slate-700 hover:bg-slate-200"
          )}
          onClick={() => onFolderSelect(null)}
        >
          <FileText className="h-4 w-4" />
          <span>All Documents</span>
        </button>

        {isLoading ? (
          <div className="text-sm text-slate-500">Loading...</div>
        ) : folders.length === 0 ? (
          <div className="text-sm text-slate-500">No folders yet</div>
        ) : (
          folders.map(folder => (
            <div key={folder.id} className="relative group">
              <button
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                  selectedFolderId === folder.id 
                    ? "bg-slate-900 text-white" 
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                )}
                onClick={() => onFolderSelect(folder.id)}
              >
                <Folder className="h-4 w-4" style={{ color: selectedFolderId === folder.id ? 'white' : (folder.color || "#3B82F6") }} />
                <span>{folder.name}</span>
              </button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="absolute -top-1 -right-1 h-5 w-5 opacity-0 group-hover:opacity-100 bg-white shadow-sm rounded-full"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreHorizontal className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleRename(folder)}>
                    <Pencil className="h-4 w-4 mr-2" />
                    Rename
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleDelete(folder)} className="text-red-600">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))
        )}
      </div>

      <Dialog open={editingFolder !== null} onOpenChange={(open) => !open && setEditingFolder(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Folder</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              placeholder="Enter folder name"
            />
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button 
              onClick={() => editingFolder && updateFolderMutation.mutate({ id: editingFolder.id, name: editName })}
              disabled={updateFolderMutation.isPending || !editName.trim()}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function AddToFolderButton({ docId, docName }: { docId: number; docName: string }) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);

  const { data: folders = [] } = useQuery<DocumentFolder[]>({
    queryKey: ['/api/regtech/folders'],
  });

  const { data: docFolders = [] } = useQuery<DocumentFolder[]>({
    queryKey: ['/api/regtech/documents', docId, 'folders'],
    queryFn: async () => {
      const res = await fetch(`/api/regtech/documents/${docId}/folders`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch');
      return res.json();
    },
  });

  const addToFolderMutation = useMutation({
    mutationFn: async (folderId: number) => {
      return await apiRequest(`/api/regtech/folders/${folderId}/documents`, 'POST', { docId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/regtech/documents', docId, 'folders'] });
      toast({ title: "Added to folder" });
    },
    onError: (error: any) => {
      toast({ title: "Failed to add to folder", description: error.message, variant: "destructive" });
    }
  });

  const removeFromFolderMutation = useMutation({
    mutationFn: async (folderId: number) => {
      return await apiRequest(`/api/regtech/folders/${folderId}/documents/${docId}`, 'DELETE');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/regtech/documents', docId, 'folders'] });
      toast({ title: "Removed from folder" });
    },
    onError: (error: any) => {
      toast({ title: "Failed to remove from folder", description: error.message, variant: "destructive" });
    }
  });

  const docFolderIds = new Set(docFolders.map(f => f.id));

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" title="Organize in folders">
          <Folder className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Organize in Folders</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-slate-600 mb-4">
          Select folders for: <strong>{docName}</strong>
        </p>
        <ScrollArea className="max-h-[300px]">
          {folders.length === 0 ? (
            <p className="text-sm text-slate-500 p-4 text-center">No folders created yet.</p>
          ) : (
            <div className="space-y-2">
              {folders.map(folder => {
                const isInFolder = docFolderIds.has(folder.id);
                return (
                  <div
                    key={folder.id}
                    className={cn(
                      "flex items-center gap-3 p-2 rounded-md cursor-pointer",
                      isInFolder ? "bg-blue-50 border border-blue-200" : "hover:bg-slate-50 border border-transparent"
                    )}
                    style={{ paddingLeft: `${12 + (folder.depth * 16)}px` }}
                    onClick={() => {
                      if (isInFolder) {
                        removeFromFolderMutation.mutate(folder.id);
                      } else {
                        addToFolderMutation.mutate(folder.id);
                      }
                    }}
                  >
                    <Folder className="h-4 w-4" style={{ color: folder.color || "#3B82F6" }} />
                    <span className="text-sm flex-1">{folder.name}</span>
                    {isInFolder && (
                      <span className="text-xs text-blue-600">In folder</span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Done</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
