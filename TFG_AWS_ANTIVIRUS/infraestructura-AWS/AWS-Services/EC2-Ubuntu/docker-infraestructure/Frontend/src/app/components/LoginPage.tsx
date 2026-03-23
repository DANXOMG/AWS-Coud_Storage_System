import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Label } from "./ui/label";

interface LoginPageProps {
  onLogin: (email: string, password: string) => void;
  onRegister: (email: string, password: string, fullName: string) => void;
}

export function LoginPage({ onLogin, onRegister }: LoginPageProps) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === "login") {
      onLogin(email, password);
    } else {
      onRegister(email, password, fullName);
    }
  };

  return (
    <div className="min-h-screen flex">
      <div className="flex-1 flex items-center justify-center p-8 bg-gray-900">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <CloudLogo className="h-12 w-12 text-purple-600" />
              <h1 className="text-3xl font-normal text-gray-100">ConTrol Cloud</h1>
            </div>
            <h2 className="text-2xl mt-6 mb-2">
              {mode === "login" ? "Iniciar sesión" : "Crear cuenta"}
            </h2>
            <p className="text-gray-400">
              {mode === "login"
                ? "Continúa con tu cuenta de ConTrol Cloud"
                : "Crea tu cuenta en ConTrol Cloud"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {mode === "register" && (
              <div className="space-y-2">
                <Label htmlFor="fullName">Nombre completo</Label>
                <Input id="fullName" type="text" placeholder="Tu nombre"
                  value={fullName} onChange={(e) => setFullName(e.target.value)}
                  required className="h-12" />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Correo electrónico</Label>
              <Input id="email" type="email" placeholder="correo@ejemplo.com"
                value={email} onChange={(e) => setEmail(e.target.value)}
                required className="h-12" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <div className="relative">
                <Input id="password" type={showPassword ? "text" : "password"}
                  placeholder="Ingresa tu contraseña" value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required className="h-12 pr-10" />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-100">
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>
            <Button type="submit" className="w-full h-12 text-base bg-purple-600 hover:bg-purple-700 text-white">
              {mode === "login" ? "Iniciar sesión" : "Crear cuenta"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            {mode === "login" ? (
              <p className="text-sm text-gray-400">
                ¿No tienes una cuenta?{" "}
                <button onClick={() => setMode("register")} className="text-purple-400 hover:underline font-medium">
                  Crear cuenta
                </button>
              </p>
            ) : (
              <p className="text-sm text-gray-400">
                ¿Ya tienes una cuenta?{" "}
                <button onClick={() => setMode("login")} className="text-purple-400 hover:underline font-medium">
                  Iniciar sesión
                </button>
              </p>
            )}
          </div>

          <div className="mt-8 pt-8 border-t border-gray-700">
            <div className="flex items-center justify-center gap-4 text-xs text-gray-500">
              <button className="hover:text-gray-100">Ayuda</button>
              <span>•</span>
              <button className="hover:text-gray-100">Privacidad</button>
              <span>•</span>
              <button className="hover:text-gray-100">Condiciones</button>
            </div>
          </div>
        </div>
      </div>

      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-purple-600 to-purple-900 items-center justify-center p-12">
        <div className="text-white max-w-md flex flex-col items-center text-center">
          <ShieldLogo className="w-48 h-48 mx-auto mb-8" />
          <h2 className="text-4xl font-light mb-4">Almacenamiento seguro</h2>
          <p className="text-purple-200 text-lg mb-10">
            Tu tiempo es importante, guárdalo con nosotros   <i>Integración con ConTrol-AntiMalware</i>
          </p>
          <div className="mt-8 grid grid-cols-3 gap-6 w-full mb-12">
            <div className="text-center">
              <div className="text-3xl font-light mb-1">15 GB</div>
              <div className="text-sm text-purple-300">Almacenamiento</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-light mb-1">100%</div>
              <div className="text-sm text-purple-300">Seguro</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-light mb-1">24/7</div>
              <div className="text-sm text-purple-300">Protegido</div>
            </div>
          </div>

          <div className="w-full border-t border-purple-400 border-opacity-30 pt-6">
            <p className="text-xs text-purple-300 uppercase tracking-widest mb-3">Desarrollado por</p>
            <div className="flex items-center justify-center gap-6">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-purple-400 bg-opacity-30 flex items-center justify-center text-sm font-semibold">F</div>
                <span className="text-purple-100 text-sm">Francisco Cárdenas</span>
              </div>
              <div className="w-px h-6 bg-purple-400 bg-opacity-30"></div>
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-purple-400 bg-opacity-30 flex items-center justify-center text-sm font-semibold">D</div>
                <span className="text-purple-100 text-sm">Daniel González</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CloudLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4C9.11 4 6.6 5.64 5.35 8.04C2.34 8.36 0 10.91 0 14C0 17.31 2.69 20 6 20H19C21.76 20 24 17.76 24 15C24 12.36 21.95 10.22 19.35 10.04Z" fill="currentColor" />
    </svg>
  );
}

function ShieldLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path d="M100 20L30 50V110C30 150 65 185 100 195C135 185 170 150 170 110V50L100 20Z" fill="white" fillOpacity="0.15" stroke="white" strokeWidth="2"/>
      <path d="M100 40L50 65V110C50 140 75 167 100 177C125 167 150 140 150 110V65L100 40Z" fill="white" fillOpacity="0.1"/>
      <path d="M75 100L90 115L125 80" stroke="white" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}
