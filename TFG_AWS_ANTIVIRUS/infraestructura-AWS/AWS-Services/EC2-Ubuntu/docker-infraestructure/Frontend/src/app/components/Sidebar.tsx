import { Cloud, Folder, Star, Clock, Trash2, HardDrive, FolderPlus, Upload } from "lucide-react";
import { Button } from "./ui/button";
import { Progress } from "./ui/progress";
import { useState, useEffect } from "react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { files as filesApi } from "../../services/api";
import { toast } from "sonner";

interface SidebarProps {
  currentView: string;
  onViewChange: (view: string) => void;
  onUpload: () => void;
  onFolderCreated: () => void;
}

function formatStorage(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

export function Sidebar({ currentView, onViewChange, onUpload, onFolderCreated }: SidebarProps) {
  const [folderDialogOpen, setFolderDialogOpen] = useState(false);
  const [folderName, setFolderName] = useState("");
  const [creating, setCreating] = useState(false);
  const [storageUsed, setStorageUsed] = useState(0);
  const [storageQuota, setStorageQuota] = useState(16106127360);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const data = await filesApi.stats();
        setStorageUsed(data.storageUsed);
        setStorageQuota(data.storageQuota);
      } catch {}
    };
    loadStats();
    const interval = setInterval(loadStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const menuItems = [
    { id: "my-drive", label: "Mi Unidad", icon: HardDrive },
    { id: "recent", label: "Recientes", icon: Clock },
    { id: "starred", label: "Destacados", icon: Star },
    { id: "trash", label: "Papelera", icon: Trash2 },
  ];

  const handleCreateFolder = async () => {
    if (!folderName.trim()) return;
    setCreating(true);
    try {
      await filesApi.createFolder(folderName.trim());
      toast.success(`Carpeta "${folderName}" creada`);
      setFolderName("");
      setFolderDialogOpen(false);
      onFolderCreated();
    } catch (err: any) {
      toast.error(err.message || "Error al crear carpeta");
    } finally {
      setCreating(false);
    }
  };

  const percentageUsed = Math.min((storageUsed / storageQuota) * 100, 100);

  return (
    <div className="w-64 border-r border-gray-700 bg-gray-900 h-full flex flex-col">
      <div className="p-4">
        <DropdownMenu>
          <DropdownMenuTrigger className="w-full outline-none">
            <div className="w-full flex items-center justify-center gap-2 h-11 px-4 rounded-md bg-purple-600 hover:bg-purple-700 text-white font-medium cursor-pointer transition-colors">
              <span className="text-xl">+</span>
              Nuevo
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-48 bg-gray-800 border-gray-700">
            <DropdownMenuItem
              className="text-gray-300 hover:text-white focus:bg-gray-700 cursor-pointer"
              onClick={() => setFolderDialogOpen(true)}
            >
              <FolderPlus className="mr-2 h-4 w-4 text-purple-400" />
              Nueva carpeta
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-gray-300 hover:text-white focus:bg-gray-700 cursor-pointer"
              onClick={onUpload}
            >
              <Upload className="mr-2 h-4 w-4 text-purple-400" />
              Subir archivo
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <nav className="flex-1 px-2">
        {menuItems.map((item) => (
          <Button
            key={item.id}
            variant={currentView === item.id ? "secondary" : "ghost"}
            className={`w-full justify-start mb-1 ${
              currentView === item.id
                ? "bg-purple-900 text-purple-200 hover:bg-purple-800"
                : "text-gray-400 hover:bg-gray-800 hover:text-gray-100"
            }`}
            onClick={() => onViewChange(item.id)}
          >
            <item.icon className="mr-3 h-5 w-5" />
            {item.label}
          </Button>
        ))}
      </nav>

      <div className="p-4 border-t border-gray-700">
        <div className="space-y-3">
          <p className="text-sm text-gray-500">Almacenamiento</p>
          <p className="text-sm text-gray-300">
            {formatStorage(storageUsed)} de {formatStorage(storageQuota)}
          </p>
          <Progress value={percentageUsed} className="[&>div]:bg-purple-600 bg-gray-700" />
          <p className="text-xs text-gray-500 text-right">{percentageUsed.toFixed(1)}% usado</p>
        </div>
      </div>

      <Dialog open={folderDialogOpen} onOpenChange={setFolderDialogOpen}>
        <DialogContent className="bg-gray-900 border-gray-700 text-gray-100">
          <DialogHeader>
            <DialogTitle className="text-gray-100">Nueva carpeta</DialogTitle>
          </DialogHeader>
          <Input
            placeholder="Nombre de la carpeta"
            value={folderName}
            onChange={(e) => setFolderName(e.target.value)}
            className="bg-gray-800 border-gray-600 text-gray-100"
            onKeyDown={(e) => e.key === "Enter" && handleCreateFolder()}
            autoFocus
          />
          <div className="flex justify-end gap-2 mt-2">
            <Button variant="outline" onClick={() => setFolderDialogOpen(false)}
              className="border-gray-600 text-gray-300 hover:bg-gray-800">
              Cancelar
            </Button>
            <Button onClick={handleCreateFolder} disabled={creating || !folderName.trim()}
              className="bg-purple-600 hover:bg-purple-700 text-white">
              {creating ? "Creando..." : "Crear"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
