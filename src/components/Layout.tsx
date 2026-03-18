import { ReactNode, useState } from 'react';
import BottomNav from './BottomNav';
import { Menu, X, Home, BookOpen, Wallet, DollarSign, User, BarChart3, Calculator, LogOut } from 'lucide-react';
import { Button } from './ui/button';
import { Link, useNavigate } from 'react-router-dom';
import AIAssistant from './AIAssistant';
import { useApp } from '@/context/AppContext';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface LayoutProps {
  children: ReactNode;
  title?: string;
}

export default function Layout({ children, title }: LayoutProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { signOut } = useApp();
  const navigate = useNavigate();

  const handleLogout = async () => {
    setIsMenuOpen(false);
    await signOut();
    navigate('/?logout=true');
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-40 bg-card/95 backdrop-blur border-b border-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="h-9 w-9"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <span className="font-bold text-lg text-primary tracking-tight">Mi Taller Contable</span>
        </div>
        <div className="flex items-center gap-2">
          {title && (
            <h1 className="text-sm font-medium text-muted-foreground mr-2 hidden sm:block">
              {title}
            </h1>
          )}
          <AIAssistant />
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="fixed inset-y-0 left-0 w-64 bg-card shadow-xl border-r border-border animate-in slide-in-from-left duration-300 flex flex-col">
            <div className="flex items-center justify-between p-6 mb-2 shrink-0 border-b border-border/50">
              <span className="font-bold text-lg">Menú</span>
              <Button variant="ghost" size="icon" onClick={() => setIsMenuOpen(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            <nav className="flex flex-col gap-2 p-6 overflow-y-auto flex-1 pb-24">
              <Link to="/dashboard" onClick={() => setIsMenuOpen(false)} className="px-4 py-3 rounded-xl hover:bg-muted font-medium flex items-center gap-3">
                <Home className="h-5 w-5" /> Inicio
              </Link>
              <Link to="/bolsillo" onClick={() => setIsMenuOpen(false)} className="px-4 py-3 rounded-xl hover:bg-muted font-medium flex items-center gap-3">
                <Wallet className="h-5 w-5" /> Mi Negocio (Gastos)
              </Link>
              <Link to="/recetario" onClick={() => setIsMenuOpen(false)} className="px-4 py-3 rounded-xl hover:bg-muted font-medium flex items-center gap-3">
                <BookOpen className="h-5 w-5" /> Mis Costos (Recetario)
              </Link>
              <Link to="/precio-justo" onClick={() => setIsMenuOpen(false)} className="px-4 py-3 rounded-xl hover:bg-muted font-medium flex items-center gap-3">
                <DollarSign className="h-5 w-5" /> El Precio Justo
              </Link>
              <Link to="/simulador" onClick={() => setIsMenuOpen(false)} className="px-4 py-3 rounded-xl hover:bg-muted font-medium flex items-center gap-3 text-cta font-bold">
                <BarChart3 className="h-5 w-5" /> Simulador Mix de Ventas
              </Link>
              <div className="h-px bg-border my-2" />
              <Link to="/perfil" onClick={() => setIsMenuOpen(false)} className="px-4 py-3 rounded-xl hover:bg-muted font-medium flex items-center gap-3">
                <User className="h-5 w-5" /> Mi Perfil
              </Link>
            </nav>
            
            <div className="mt-auto p-6 pt-4 sticky bottom-0 bg-card border-t border-border animate-in fade-in duration-500">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <button className="w-full px-4 py-3 rounded-xl hover:bg-destructive/10 hover:text-destructive font-medium flex items-center gap-3 transition-colors text-muted-foreground group">
                    <LogOut className="h-5 w-5 transform group-hover:-translate-x-1 transition-transform" /> Cerrar Sesión
                  </button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>¿Estás seguro de que quieres salir?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Se cerrará tu sesión actual y deberás volver a ingresar para acceder a tus datos.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleLogout} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                      Cerrar Sesión
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </div>
      )}

      <main className="px-4 py-4 max-w-2xl mx-auto">{children}</main>
      <BottomNav />
    </div>
  );
}
