import { useState, useEffect, useCallback } from "react";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";
import { FileGrid, FileItem } from "./FileGrid";
import { FileList } from "./FileList";
import { UploadDialog } from "./UploadDialog";
import { toast } from "sonner";
import { files as filesApi } from "../../services/api";

interface DrivePageProps {
  userEmail: string;
  onLogout: () => void;
}

function formatSize(bytes: number): string {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `Hace ${mins} minutos`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `Hace ${hours} horas`;
  const days = Math.floor(hours / 24);
  return `Hace ${days} días`;
}

function apiFileToItem(f: any): FileItem {
  return {
    id: String(f.id),
    name: f.file_name,
    type: f.is_folder ? 'folder' : 'file',
    fileType: f.mime_type || undefined,
    size: f.file_size ? formatSize(f.file_size) : undefined,
    modified: formatDate(f.updated_at),
    starred: !!f.is_starred,
    s3Key: f.s3_key,
    antivirusStatus: f.antivirus_status,
  };
}

export function DrivePage({ userEmail, onLogout }: DrivePageProps) {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [currentView, setCurrentView] = useState("my-drive");
  const [searchQuery, setSearchQuery] = useState("");
  const [files, setFiles] = useState<FileItem[]>([]);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentFolderId, setCurrentFolderId] = useState<string | undefined>(undefined);
  const [folderHistory, setFolderHistory] = useState<{id: string; name: string}[]>([]);

  const loadFiles = useCallback(async () => {
    try {
      setLoading(true);
      const search = searchQuery || undefined;
      const starred = currentView === 'starred' ? true : undefined;
      let data;
      if (currentView === 'trash') {
        data = await filesApi.listTrash();
      } else {
        data = await filesApi.list(currentFolderId, search, starred);
      }
      setFiles(data.files.map(apiFileToItem));
    } catch (err: any) {
      toast.error(err.message || 'Error al cargar archivos');
    } finally {
      setLoading(false);
    }
  }, [currentView, searchQuery, currentFolderId]);

  useEffect(() => { loadFiles(); }, [loadFiles]);

  const handleItemClick = async (item: FileItem) => {
    if (item.type === 'folder') {
      setFolderHistory(prev => [...prev, { id: item.id, name: item.name }]);
      setCurrentFolderId(item.id);
      return;
    } else {
      try {
        const data = await filesApi.view(item.id);
        window.open(data.url, '_blank');
      } catch (err: any) {
        toast.error(err.message || 'Error al abrir archivo');
      }
    }
  };

  const handleToggleStar = async (id: string) => {
    const file = files.find(f => f.id === id);
    if (!file) return;
    try {
      await filesApi.star(id, !file.starred);
      setFiles(prev => prev.map(f => f.id === id ? { ...f, starred: !f.starred } : f));
      toast.success(file.starred ? `${file.name} eliminado de destacados` : `${file.name} añadido a destacados`);
    } catch (err: any) {
      toast.error(err.message || 'Error al destacar');
    }
  };

  const handleDelete = async (id: string) => {
    const file = files.find(f => f.id === id);
    if (!file) return;
    try {
      await filesApi.delete(id);
      setFiles(prev => prev.filter(f => f.id !== id));
      toast.success(`${file.name} eliminado correctamente`);
    } catch (err: any) {
      toast.error(err.message || 'Error al eliminar');
    }
  };

  const handleDownload = async (id: string) => {
    try {
      await filesApi.download(id);
    } catch (err: any) {
      toast.error(err.message || 'Error al descargar');
    }
  };

  const handleRename = async (id: string, newName: string) => {
    try {
      await filesApi.rename(id, newName);
      setFiles(prev => prev.map(f => f.id === id ? { ...f, name: newName } : f));
      toast.success('Nombre actualizado');
    } catch (err: any) {
      toast.error(err.message || 'Error al renombrar');
    }
  };

  const handleDeletePermanent = async (id: string) => {
    const file = files.find(f => f.id === id);
    if (!file) return;
    try {
      await filesApi.deletePermanent(id);
      setFiles(prev => prev.filter(f => f.id !== id));
      toast.success(`${file.name} eliminado permanentemente`);
    } catch (err: any) {
      toast.error(err.message || 'Error al eliminar');
    }
  };

  const handleRestore = async (id: string) => {
    const file = files.find(f => f.id === id);
    if (!file) return;
    try {
      await filesApi.restore(id);
      setFiles(prev => prev.filter(f => f.id !== id));
      toast.success(`${file.name} restaurado`);
    } catch (err: any) {
      toast.error(err.message || 'Error al restaurar');
    }
  };

  const handleUpload = async (uploadedFiles: File[]) => {
    let success = 0;
    let infected = 0;
    for (const file of uploadedFiles) {
      try {
        toast.info(`Analizando con ConTrol-AM: ${file.name}...`);
        const result = await filesApi.upload(file, currentFolderId);
        if (result.file.antivirusStatus === 'infected') {
          infected++;
          toast.error(`Malware detectado en: ${file.name}`);
        } else {
          success++;
        }
      } catch (err: any) {
        toast.error(`Error con ${file.name}: ${err.message}`);
      }
    }
    if (success > 0) {
      toast.success(`${success} archivo(s) subido(s) correctamente`);
      loadFiles();
    }
    if (infected > 0) {
      toast.error(`${infected} archivo(s) infectado(s) bloqueado(s) por ConTrol-AM`);
    }
  };

  const filteredFiles = files.filter(file => {
    if (currentView === 'starred') return file.starred;
    if (currentView === 'shared') return false;
    if (currentView === 'recent') return true;
    return true;
  });

  return (
    <div className="h-screen flex flex-col bg-gray-950">
      <Header
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        userEmail={userEmail}
        onLogout={onLogout}
      />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          currentView={currentView}
          onViewChange={setCurrentView}
          onUpload={() => setUploadDialogOpen(true)}
          onFolderCreated={loadFiles}
        />
        <main className="flex-1 overflow-auto bg-gray-950">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                {folderHistory.length > 0 && (
                  <button
                    onClick={() => {
                      const newHistory = folderHistory.slice(0, -1);
                      setFolderHistory(newHistory);
                      setCurrentFolderId(newHistory.length > 0 ? newHistory[newHistory.length-1].id : undefined);
                    }}
                    className="text-purple-400 hover:text-purple-300 text-sm flex items-center gap-1"
                  >
                    ← Atrás
                  </button>
                )}
                <h2 className="text-2xl font-semibold text-gray-100">
                {currentView === "my-drive" && (
                  folderHistory.length > 0
                    ? folderHistory[folderHistory.length - 1].name
                    : "Mi Unidad"
                )}
                {currentView === "shared" && "Compartidos conmigo"}
                {currentView === "recent" && "Recientes"}
                {currentView === "starred" && "Destacados"}
                {currentView === "trash" && "Papelera"}
              </h2>
              </div>
              <button
                onClick={() => setUploadDialogOpen(true)}
                className="text-sm text-purple-400 hover:underline font-medium"
              >
                Subir archivos
              </button>
            </div>
            {loading ? (
              <div className="text-center py-12 text-purple-400">
                <p>Cargando archivos...</p>
              </div>
            ) : filteredFiles.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <p>No se encontraron archivos</p>
              </div>
            ) : viewMode === "grid" ? (
              <FileGrid
                items={filteredFiles}
                onItemClick={handleItemClick}
                onToggleStar={handleToggleStar}
                onDelete={handleDelete}
                onDownload={handleDownload}
                onRename={handleRename}
                onMoved={loadFiles}
                isTrash={currentView === 'trash'}
                onDeletePermanent={handleDeletePermanent}
                onRestore={handleRestore}
              />
            ) : (
              <FileList
                items={filteredFiles}
                onItemClick={handleItemClick}
                onToggleStar={handleToggleStar}
                onDelete={handleDelete}
                onRename={handleRename}
                onDownload={handleDownload}
              />
            )}
          </div>
        </main>
      </div>
      <UploadDialog
        open={uploadDialogOpen}
        onOpenChange={setUploadDialogOpen}
        onUpload={handleUpload}
      />
    </div>
  );
}
