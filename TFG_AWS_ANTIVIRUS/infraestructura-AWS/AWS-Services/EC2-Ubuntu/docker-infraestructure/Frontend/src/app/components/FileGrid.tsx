import { useState } from "react";
import {
  FileText, Image, Music, Video, File, Folder, MoreVertical, Star,
  Download, Trash2, FolderInput, Pencil,
} from "lucide-react";
import { Button } from "./ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger, DropdownMenuSub, DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "./ui/dropdown-menu";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { files as filesApi } from "../../services/api";
import { toast } from "sonner";

export interface FileItem {
  id: string;
  name: string;
  type: "folder" | "file";
  fileType?: string;
  size?: string;
  modified: string;
  starred: boolean;
  s3Key?: string;
  antivirusStatus?: string;
  isDeleted?: boolean;
}

interface FileGridProps {
  items: FileItem[];
  onItemClick: (item: FileItem) => void;
  onToggleStar: (id: string) => void;
  onDelete: (id: string) => void;
  onDownload: (id: string) => void;
  onRename: (id: string, newName: string) => void;
  onMoved: () => void;
  isTrash?: boolean;
  onDeletePermanent?: (id: string) => void;
  onRestore?: (id: string) => void;
}

function getFileIcon(fileType?: string) {
  if (!fileType) return <File className="h-8 w-8 text-gray-400" />;
  if (fileType.startsWith("image/")) return <Image className="h-8 w-8 text-green-400" />;
  if (fileType.startsWith("video/")) return <Video className="h-8 w-8 text-purple-400" />;
  if (fileType.startsWith("audio/")) return <Music className="h-8 w-8 text-pink-400" />;
  if (fileType.includes("pdf")) return <FileText className="h-8 w-8 text-red-400" />;
  if (fileType.includes("document") || fileType.includes("text"))
    return <FileText className="h-8 w-8 text-blue-400" />;
  return <File className="h-8 w-8 text-gray-400" />;
}

function MoveToMenu({ fileId, onMoved }: { fileId: string; onMoved: () => void }) {
  const [folders, setFolders] = useState<{ id: number; file_name: string }[]>([]);
  const [loaded, setLoaded] = useState(false);

  const loadFolders = async () => {
    if (loaded) return;
    try {
      const data = await filesApi.folders();
      setFolders(data.folders);
      setLoaded(true);
    } catch { toast.error("Error al cargar carpetas"); }
  };

  const handleMove = async (targetFolderId: string | null, folderName: string) => {
    try {
      await filesApi.move(fileId, targetFolderId);
      toast.success(`Movido a ${folderName}`);
      onMoved();
    } catch (err: any) {
      toast.error(err.message || "Error al mover");
    }
  };

  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger className="text-gray-300 focus:bg-gray-700 cursor-pointer" onPointerEnter={loadFolders}>
        <FolderInput className="mr-2 h-4 w-4 text-purple-400" />
        Mover a
      </DropdownMenuSubTrigger>
      <DropdownMenuSubContent className="bg-gray-800 border-gray-700">
        <DropdownMenuItem className="text-gray-300 focus:bg-gray-700 cursor-pointer"
          onClick={() => handleMove(null, "Mi Unidad (raíz)")}>
          <Folder className="mr-2 h-4 w-4 text-purple-400" />
          Mi Unidad (raíz)
        </DropdownMenuItem>
        {folders.length === 0 && loaded && (
          <DropdownMenuItem disabled className="text-gray-500">No hay carpetas</DropdownMenuItem>
        )}
        {folders.map(f => (
          <DropdownMenuItem key={f.id} className="text-gray-300 focus:bg-gray-700 cursor-pointer"
            onClick={() => handleMove(String(f.id), f.file_name)}>
            <Folder className="mr-2 h-4 w-4 text-purple-400" />
            {f.file_name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  );
}

export function FileGrid({
  items, onItemClick, onToggleStar, onDelete, onDownload,
  onRename, onMoved, isTrash, onDeletePermanent, onRestore
}: FileGridProps) {
  const [renameDialog, setRenameDialog] = useState<{ open: boolean; id: string; name: string }>({
    open: false, id: '', name: ''
  });
  const [newName, setNewName] = useState('');

  const openRename = (id: string, name: string) => {
    setRenameDialog({ open: true, id, name });
    setNewName(name);
  };

  const handleRename = () => {
    if (!newName.trim() || newName === renameDialog.name) {
      setRenameDialog({ open: false, id: '', name: '' });
      return;
    }
    onRename(renameDialog.id, newName.trim());
    setRenameDialog({ open: false, id: '', name: '' });
  };

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {items.map((item) => (
          <div
            key={item.id}
            className="group bg-gray-800 border border-gray-700 rounded-lg p-4 hover:border-purple-600 cursor-pointer relative transition-colors"
            onClick={() => onItemClick(item)}
          >
            <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {!isTrash && (
                <Button variant="ghost" size="icon"
                  className="h-8 w-8 text-gray-400 hover:text-yellow-400 hover:bg-gray-700"
                  onClick={(e) => { e.stopPropagation(); onToggleStar(item.id); }}>
                  <Star className={`h-4 w-4 ${item.starred ? "fill-yellow-400 text-yellow-400" : ""}`} />
                </Button>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger className="outline-none" onClick={(e) => e.stopPropagation()}>
                  <div className="h-8 w-8 flex items-center justify-center rounded hover:bg-gray-700 text-gray-400 hover:text-gray-100 transition-colors">
                    <MoreVertical className="h-4 w-4" />
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-gray-800 border-gray-700">
                  {isTrash ? (
                    <>
                      {onRestore && (
                        <DropdownMenuItem className="text-green-400 focus:bg-gray-700 cursor-pointer"
                          onClick={(e) => { e.stopPropagation(); onRestore(item.id); }}>
                          Restaurar
                        </DropdownMenuItem>
                      )}
                      {onDeletePermanent && (
                        <DropdownMenuItem className="text-red-400 focus:bg-gray-700 focus:text-red-400 cursor-pointer"
                          onClick={(e) => { e.stopPropagation(); onDeletePermanent(item.id); }}>
                          <Trash2 className="mr-2 h-4 w-4" />
                          Eliminar permanentemente
                        </DropdownMenuItem>
                      )}
                    </>
                  ) : (
                    <>
                      <DropdownMenuItem className="text-gray-300 focus:bg-gray-700 cursor-pointer"
                        onClick={(e) => { e.stopPropagation(); openRename(item.id, item.name); }}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Cambiar nombre
                      </DropdownMenuItem>
                      {item.type === 'file' && (
                        <>
                          <DropdownMenuItem className="text-gray-300 focus:bg-gray-700 cursor-pointer"
                            onClick={(e) => { e.stopPropagation(); onDownload(item.id); }}>
                            <Download className="mr-2 h-4 w-4" />
                            Descargar
                          </DropdownMenuItem>
                          <MoveToMenu fileId={item.id} onMoved={onMoved} />
                        </>
                      )}
                      <DropdownMenuItem className="text-red-400 focus:bg-gray-700 focus:text-red-400 cursor-pointer"
                        onClick={(e) => { e.stopPropagation(); onDelete(item.id); }}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Mover a papelera
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <div className="flex flex-col items-center text-center">
              {item.type === "folder" ? (
                <Folder className="h-12 w-12 text-purple-400 mb-2" />
              ) : (
                <div className="mb-2">{getFileIcon(item.fileType)}</div>
              )}
              <p className="text-sm text-gray-100 truncate w-full">{item.name}</p>
              {item.size && <p className="text-xs text-gray-500 mt-1">{item.size}</p>}
            </div>
          </div>
        ))}
      </div>

      <Dialog open={renameDialog.open} onOpenChange={(o) => !o && setRenameDialog({ open: false, id: '', name: '' })}>
        <DialogContent className="bg-gray-900 border-gray-700 text-gray-100">
          <DialogHeader>
            <DialogTitle className="text-gray-100">Cambiar nombre</DialogTitle>
          </DialogHeader>
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="bg-gray-800 border-gray-600 text-gray-100"
            onKeyDown={(e) => e.key === "Enter" && handleRename()}
            autoFocus
          />
          <div className="flex justify-end gap-2 mt-2">
            <Button variant="outline" onClick={() => setRenameDialog({ open: false, id: '', name: '' })}
              className="border-gray-600 text-gray-300 hover:bg-gray-800">
              Cancelar
            </Button>
            <Button onClick={handleRename} disabled={!newName.trim()}
              className="bg-purple-600 hover:bg-purple-700 text-white">
              Guardar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
