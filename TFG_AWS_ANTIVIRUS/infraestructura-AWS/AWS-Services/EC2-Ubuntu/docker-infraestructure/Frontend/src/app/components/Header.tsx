import { useState } from "react";
import { Search, Grid3x3, List, Settings, HelpCircle, LogOut, User, Shield } from "lucide-react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { SettingsDialog } from "./SettingsDialog";

interface HeaderProps {
  viewMode: "grid" | "list";
  onViewModeChange: (mode: "grid" | "list") => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  userEmail?: string;
  onLogout?: () => void;
}

export function Header({ viewMode, onViewModeChange, searchQuery, onSearchChange, userEmail, onLogout }: HeaderProps) {
  const userInitial = userEmail ? userEmail.charAt(0).toUpperCase() : "U";
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState<"profile" | "security">("profile");

  const openSettings = (tab: "profile" | "security") => {
    setSettingsTab(tab);
    setSettingsOpen(true);
  };

  return (
    <>
      <header className="h-16 border-b bg-purple-700 px-4 flex items-center justify-between">
        <div className="flex items-center gap-4 flex-1">
          <div className="flex items-center gap-2">
            <CloudLogo className="h-10 w-10 text-white" />
            <h1 className="text-xl text-white font-medium">ConTrol Cloud</h1>
          </div>
          <div className="flex-1 max-w-2xl relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-purple-300" />
            <Input
              placeholder="Buscar en ConTrol Cloud"
              className="pl-10 bg-purple-600 border-purple-500 text-white placeholder:text-purple-300 focus:bg-purple-500"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="text-white hover:bg-purple-600"
            onClick={() => onViewModeChange(viewMode === "grid" ? "list" : "grid")}>
            {viewMode === "grid" ? <List className="h-5 w-5" /> : <Grid3x3 className="h-5 w-5" />}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger className="outline-none">
              <div className="h-10 w-10 rounded-full bg-purple-500 hover:bg-purple-400 flex items-center justify-center cursor-pointer text-white font-semibold text-sm transition-colors">
                {userInitial}
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-64" align="end">
              <DropdownMenuLabel>
                <div className="flex items-center gap-3 py-1">
                  <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-semibold text-lg">
                    {userInitial}
                  </div>
                  <div className="flex flex-col">
                    <p className="text-sm font-semibold leading-none">{userEmail?.split('@')[0]}</p>
                    {userEmail && <p className="text-xs text-muted-foreground mt-1">{userEmail}</p>}
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer" onClick={() => openSettings("profile")}>
                <User className="mr-2 h-4 w-4 text-purple-600" />
                <span>Mi perfil</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer" onClick={() => openSettings("profile")}>
                <Settings className="mr-2 h-4 w-4 text-purple-600" />
                <span>Configuración</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer">
                <HelpCircle className="mr-2 h-4 w-4 text-purple-600" />
                <span>Ayuda</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {onLogout && (
                <DropdownMenuItem onClick={onLogout}
                  className="cursor-pointer text-red-500 focus:text-red-500 focus:bg-red-950">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Cerrar sesión</span>
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <SettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        userEmail={userEmail}
      />
    </>
  );
}

function CloudLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4C9.11 4 6.6 5.64 5.35 8.04C2.34 8.36 0 10.91 0 14C0 17.31 2.69 20 6 20H19C21.76 20 24 17.76 24 15C24 12.36 21.95 10.22 19.35 10.04Z" fill="currentColor" />
    </svg>
  );
}
