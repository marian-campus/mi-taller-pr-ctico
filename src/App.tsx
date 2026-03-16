import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppProvider } from "./context/AppContext";
import Landing from "./pages/Landing";
import Register from "./pages/Register";
import RecoverPassword from "./pages/RecoverPassword";
import Index from "./pages/Index";
import Recetario from "./pages/Recetario";
import CrearProducto from "./pages/CrearProducto";
import Bolsillo from "./pages/Bolsillo";
import NuevoGasto from "./pages/NuevoGasto";
import PrecioJusto from "./pages/PrecioJusto";
import Perfil from "./pages/Perfil";
import SimuladorMix from "./pages/SimuladorMix";
import NotFound from "./pages/NotFound";

import { ThemeProvider } from "./components/theme-provider";

const queryClient = new QueryClient();

const App = () => {
  useEffect(() => {
    // Cleanup Supabase tokens from URL hash
    if (window.location.hash && (window.location.hash.includes('access_token') || window.location.hash.includes('error_description'))) {
      console.log("🛠️ Auth hash detected, cleaning up URL...");
      // We don't clear immediately to let Supabase Client consume it, 
      // but we can at least remove it from history after a short delay
      setTimeout(() => {
        window.history.replaceState(null, '', window.location.pathname + window.location.search);
      }, 500);
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme" attribute="class">
          <AppProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/register" element={<Register />} />
                <Route path="/recover" element={<RecoverPassword />} />
                <Route path="/dashboard" element={<Index />} />
                <Route path="/recetario" element={<Recetario />} />
                <Route path="/recetario/nuevo" element={<CrearProducto />} />
                <Route path="/recetario/:id" element={<CrearProducto />} />
                <Route path="/bolsillo" element={<Bolsillo />} />
                <Route path="/bolsillo/nuevo" element={<NuevoGasto />} />
                <Route path="/bolsillo/:id" element={<NuevoGasto />} />
                <Route path="/precio-justo" element={<PrecioJusto />} />
                <Route path="/simulador" element={<SimuladorMix />} />
                <Route path="/perfil" element={<Perfil />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </AppProvider>
        </ThemeProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
