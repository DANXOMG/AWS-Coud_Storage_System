import { useState, useEffect, useRef } from "react";
import { LoginPage } from "./components/LoginPage";
import { DrivePage } from "./components/DrivePage";
import { toast } from "sonner";
import { Toaster } from "./components/ui/sonner";
import { auth } from "../services/api";

const TOKEN_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 días igual que el JWT
const WARN_BEFORE_MS = 5 * 60 * 1000; // avisar 5 minutos antes

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const expiryTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const warnTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimers = () => {
    if (expiryTimer.current) clearTimeout(expiryTimer.current);
    if (warnTimer.current) clearTimeout(warnTimer.current);
  };

  const scheduleExpiry = () => {
    clearTimers();
    warnTimer.current = setTimeout(() => {
      toast.warning("Tu sesión expirará en 5 minutos", { duration: 10000 });
    }, TOKEN_EXPIRY_MS - WARN_BEFORE_MS);

    expiryTimer.current = setTimeout(() => {
      toast.error("Tu sesión ha expirado. Por favor inicia sesión de nuevo.");
      handleLogout();
    }, TOKEN_EXPIRY_MS);
  };

  useEffect(() => {
    const verify = async () => {
      try {
        if (auth.isAuthenticated()) {
          const data = await auth.verify();
          setIsAuthenticated(true);
          setUserEmail(data.user.email);
          scheduleExpiry();
        }
      } catch {
        auth.logout();
      } finally {
        setLoading(false);
      }
    };
    verify();
    return () => clearTimers();
  }, []);

  const handleLogin = async (email: string, password: string) => {
    try {
      const data = await auth.login(email, password);
      setIsAuthenticated(true);
      setUserEmail(data.user.email);
      scheduleExpiry();
      toast.success(`¡Bienvenido! Sesión iniciada como ${email}`);
    } catch (err: any) {
      toast.error(err.message || 'Error al iniciar sesión');
    }
  };

  const handleRegister = async (email: string, password: string, fullName: string) => {
    try {
      const data = await auth.register(email, password, fullName);
      setIsAuthenticated(true);
      setUserEmail(data.user.email);
      scheduleExpiry();
      toast.success(`¡Cuenta creada! Bienvenido ${fullName}`);
    } catch (err: any) {
      toast.error(err.message || 'Error al crear cuenta');
    }
  };

  const handleLogout = async () => {
    clearTimers();
    await auth.logout();
    setIsAuthenticated(false);
    setUserEmail("");
    toast.info("Sesión cerrada correctamente");
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-purple-50">
      <p className="text-purple-500">Cargando...</p>
    </div>
  );

  return (
    <>
      {isAuthenticated ? (
        <DrivePage userEmail={userEmail} onLogout={handleLogout} />
      ) : (
        <LoginPage onLogin={handleLogin} onRegister={handleRegister} />
      )}
      <Toaster theme="dark" />
    </>
  );
}
