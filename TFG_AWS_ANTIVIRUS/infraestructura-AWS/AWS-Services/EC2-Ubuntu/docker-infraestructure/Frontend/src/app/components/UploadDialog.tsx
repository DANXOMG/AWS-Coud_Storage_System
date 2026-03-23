import { useState } from "react";
import { Upload, X, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "./ui/dialog";
import { Button } from "./ui/button";

interface UploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpload: (files: File[]) => Promise<void>;
}

type FileStatus = 'pending' | 'scanning' | 'uploading' | 'done' | 'error' | 'infected';

interface FileWithStatus {
  file: File;
  status: FileStatus;
}

export function UploadDialog({ open, onOpenChange, onUpload }: UploadDialogProps) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<FileWithStatus[]>([]);
  const [uploading, setUploading] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const files = Array.from(e.dataTransfer.files);
    setSelectedFiles(prev => [...prev, ...files.map(f => ({ file: f, status: 'pending' as FileStatus }))]);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setSelectedFiles(prev => [...prev, ...files.map(f => ({ file: f, status: 'pending' as FileStatus }))]);
    }
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;
    setUploading(true);
    setSelectedFiles(prev => prev.map(f => ({ ...f, status: 'scanning' })));
    await onUpload(selectedFiles.map(f => f.file));
    setUploading(false);
    setSelectedFiles([]);
    onOpenChange(false);
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const statusIcon = (status: FileStatus) => {
    if (status === 'scanning') return <Loader2 className="h-4 w-4 animate-spin text-purple-400" />;
    if (status === 'done') return <CheckCircle className="h-4 w-4 text-green-400" />;
    if (status === 'infected' || status === 'error') return <AlertCircle className="h-4 w-4 text-red-400" />;
    return null;
  };

  const statusLabel = (status: FileStatus) => {
    if (status === 'scanning') return <span className="text-xs text-purple-400">Analizando con ConTrol-AM...</span>;
    if (status === 'done') return <span className="text-xs text-green-400">Subido</span>;
    if (status === 'infected') return <span className="text-xs text-red-400">Malware detectado</span>;
    if (status === 'error') return <span className="text-xs text-red-400">Error</span>;
    return null;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-gray-900 border-gray-700 text-gray-100">
        <DialogHeader>
          <DialogTitle className="text-gray-100">Subir archivos</DialogTitle>
          <DialogDescription className="text-gray-400">
            Los archivos serán analizados por ConTrol-AM antes de subirse
          </DialogDescription>
        </DialogHeader>

        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragActive ? "border-purple-500 bg-purple-900 bg-opacity-20" : "border-gray-600"
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <Upload className="h-12 w-12 mx-auto text-gray-500 mb-4" />
          <p className="text-sm text-gray-400 mb-2">
            Arrastra archivos aquí o haz clic para seleccionar
          </p>
          <input type="file" multiple onChange={handleChange} className="hidden" id="file-upload" />
          <label htmlFor="file-upload">
            <Button variant="outline" className="mt-2 border-gray-600 text-gray-300 hover:bg-gray-800" asChild>
              <span>Seleccionar archivos</span>
            </Button>
          </label>
        </div>

        {selectedFiles.length > 0 && (
          <div className="mt-4 space-y-2">
            <p className="text-sm font-medium text-gray-300">Archivos seleccionados:</p>
            {selectedFiles.map((item, index) => (
              <div key={index} className="flex items-center justify-between bg-gray-800 p-2 rounded border border-gray-700">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  {statusIcon(item.status)}
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm text-gray-100 truncate">{item.file.name}</span>
                    {statusLabel(item.status)}
                  </div>
                </div>
                {!uploading && (
                  <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0 text-gray-400 hover:text-gray-100 hover:bg-gray-700"
                    onClick={() => removeFile(index)}>
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={uploading}
            className="border-gray-600 text-gray-300 hover:bg-gray-800">
            Cancelar
          </Button>
          <Button onClick={handleUpload} disabled={selectedFiles.length === 0 || uploading}
            className="bg-purple-600 hover:bg-purple-700 text-white">
            {uploading ? (
              <><Loader2 className="h-4 w-4 animate-spin mr-2" />Analizando...</>
            ) : (
              `Subir ${selectedFiles.length > 0 ? `(${selectedFiles.length})` : ''}`
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
