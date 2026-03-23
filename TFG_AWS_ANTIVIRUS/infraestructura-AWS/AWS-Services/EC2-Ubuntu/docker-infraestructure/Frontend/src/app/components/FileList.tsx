import {
  FileText, Image, Music, Video, File, Folder, MoreVertical, Star, Download, Trash2, Pencil,
} from "lucide-react";
import { Button } from "./ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "./ui/table";
import { FileItem } from "./FileGrid";

interface FileListProps {
  items: FileItem[];
  onItemClick: (item: FileItem) => void;
  onToggleStar: (id: string) => void;
  onDelete: (id: string) => void;
  onRename: (id: string, newName: string) => void;
  onDownload?: (id: string) => void;
}

function getFileIcon(fileType?: string) {
  if (!fileType) return <File className="h-5 w-5 text-gray-400" />;
  if (fileType.startsWith("image/")) return <Image className="h-5 w-5 text-green-400" />;
  if (fileType.startsWith("video/")) return <Video className="h-5 w-5 text-purple-400" />;
  if (fileType.startsWith("audio/")) return <Music className="h-5 w-5 text-pink-400" />;
  if (fileType.includes("pdf")) return <FileText className="h-5 w-5 text-red-400" />;
  if (fileType.includes("document") || fileType.includes("text"))
    return <FileText className="h-5 w-5 text-blue-400" />;
  return <File className="h-5 w-5 text-gray-400" />;
}

export function FileList({ items, onItemClick, onToggleStar, onDelete, onRename, onDownload }: FileListProps) {
  return (
    <div className="p-2">
      <Table>
        <TableHeader>
          <TableRow className="border-gray-700 hover:bg-transparent">
            <TableHead className="w-10 text-gray-500"></TableHead>
            <TableHead className="text-gray-500">Nombre</TableHead>
            <TableHead className="text-gray-500">Propietario</TableHead>
            <TableHead className="text-gray-500">Modificado</TableHead>
            <TableHead className="text-gray-500">Tamaño</TableHead>
            <TableHead className="w-20 text-gray-500"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow
              key={item.id}
              className="cursor-pointer border-gray-700 hover:bg-gray-800 hover:border hover:border-purple-600 rounded-lg transition-colors"
              onClick={() => onItemClick(item)}
            >
              <TableCell>
                {item.type === "folder" ? (
                  <Folder className="h-5 w-5 text-purple-400" />
                ) : (
                  getFileIcon(item.fileType)
                )}
              </TableCell>
              <TableCell className="font-medium text-gray-100">{item.name}</TableCell>
              <TableCell className="text-gray-500">Yo</TableCell>
              <TableCell className="text-gray-500">{item.modified}</TableCell>
              <TableCell className="text-gray-500">{item.size || "—"}</TableCell>
              <TableCell>
                <div className="flex gap-1 justify-end">
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-yellow-400 hover:bg-gray-700"
                    onClick={(e) => { e.stopPropagation(); onToggleStar(item.id); }}>
                    <Star className={`h-4 w-4 ${item.starred ? "fill-yellow-400 text-yellow-400" : ""}`} />
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger className="outline-none" onClick={(e) => e.stopPropagation()}>
                      <div className="h-8 w-8 flex items-center justify-center rounded hover:bg-gray-700 text-gray-400 hover:text-gray-100 transition-colors">
                        <MoreVertical className="h-4 w-4" />
                      </div>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-gray-800 border-gray-700">
                      <DropdownMenuItem className="text-gray-300 focus:bg-gray-700 cursor-pointer"
                        onClick={(e) => { e.stopPropagation(); onRename(item.id, item.name); }}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Cambiar nombre
                      </DropdownMenuItem>
                      {item.type === 'file' && onDownload && (
                        <DropdownMenuItem className="text-gray-300 focus:bg-gray-700 cursor-pointer"
                          onClick={(e) => { e.stopPropagation(); onDownload(item.id); }}>
                          <Download className="mr-2 h-4 w-4" />
                          Descargar
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem className="text-red-400 focus:bg-gray-700 focus:text-red-400 cursor-pointer"
                        onClick={(e) => { e.stopPropagation(); onDelete(item.id); }}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Mover a papelera
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
