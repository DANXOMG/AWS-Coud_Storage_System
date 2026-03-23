import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { toast } from "sonner";
import { auth } from "../../services/api";

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userEmail?: string;
}

export function SettingsDialog({ open, onOpenChange, userEmail }: SettingsDialogProps) {
  const [tab, setTab] = useState<"profile" | "security">("profile");
  const [fullName, setFullName] = useState(auth.getUser()?.fullName || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSaveProfile = async () => {
    if (!fullName.trim()) {
      toast.error("El nombre no puede estar vacío");
      return;
    }
    setSaving(true);
    try {
      await auth.updateProfile(fullName.trim());
      toast.success("Perfil actualizado correctamente");
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast.error("Las contraseñas no coinciden");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("La contraseña debe tener al menos 6 caracteres");
      return;
    }
    setSaving(true);
    try {
      await auth.changePassword(currentPassword, newPassword);
      toast.success("Contraseña actualizada. Por favor inicia sesión de nuevo.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      onOpenChange(false);
      setTimeout(() => window.location.reload(), 1500);
    } catch (err: any) {
      toast.error(err.message || "Error al cambiar contraseña");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-gray-900 border-gray-700 text-gray-100 sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-gray-100">Configuración</DialogTitle>
        </DialogHeader>

        <div className="flex gap-1 border-b border-gray-700 mb-4">
          <button
            onClick={() => setTab("profile")}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              tab === "profile"
                ? "text-purple-400 border-b-2 border-purple-400"
                : "text-gray-500 hover:text-gray-300"
            }`}
          >
            Perfil
          </button>
          <button
            onClick={() => setTab("security")}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              tab === "security"
                ? "text-purple-400 border-b-2 border-purple-400"
                : "text-gray-500 hover:text-gray-300"
            }`}
          >
            Seguridad
          </button>
        </div>

        {tab === "profile" && (
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 bg-gray-800 rounded-lg border border-gray-700">
              <div className="h-16 w-16 rounded-full bg-purple-600 flex items-center justify-center text-white text-2xl font-semibold">
                {userEmail?.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-gray-100 font-medium">{fullName || userEmail?.split('@')[0]}</p>
                <p className="text-gray-500 text-sm">{userEmail}</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-gray-400">Nombre completo</Label>
              <Input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="bg-gray-800 border-gray-600 text-gray-100"
                placeholder="Tu nombre"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-gray-400">Correo electrónico</Label>
              <Input
                value={userEmail || ""}
                disabled
                className="bg-gray-800 border-gray-700 text-gray-500 cursor-not-allowed"
              />
              <p className="text-xs text-gray-600">El correo no se puede modificar</p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}
                className="border-gray-600 text-gray-300 hover:bg-gray-800">
                Cancelar
              </Button>
              <Button onClick={handleSaveProfile} disabled={saving}
                className="bg-purple-600 hover:bg-purple-700 text-white">
                {saving ? "Guardando..." : "Guardar cambios"}
              </Button>
            </div>
          </div>
        )}

        {tab === "security" && (
          <div className="space-y-4">
            <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
              <p className="text-sm text-gray-400">Última sesión iniciada con</p>
              <p className="text-gray-100 font-medium mt-1">{userEmail}</p>
            </div>

            <div className="space-y-2">
              <Label className="text-gray-400">Contraseña actual</Label>
              <Input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="bg-gray-800 border-gray-600 text-gray-100"
                placeholder="••••••••"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-gray-400">Nueva contraseña</Label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="bg-gray-800 border-gray-600 text-gray-100"
                placeholder="Mínimo 6 caracteres"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-gray-400">Confirmar nueva contraseña</Label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="bg-gray-800 border-gray-600 text-gray-100"
                placeholder="Repite la contraseña"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}
                className="border-gray-600 text-gray-300 hover:bg-gray-800">
                Cancelar
              </Button>
              <Button onClick={handleChangePassword} disabled={saving || !currentPassword || !newPassword}
                className="bg-purple-600 hover:bg-purple-700 text-white">
                {saving ? "Guardando..." : "Cambiar contraseña"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
