import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppProvider } from "./context/AppContext";
import Index from "./pages/Index";
import Recetario from "./pages/Recetario";
import CrearProducto from "./pages/CrearProducto";
import Bolsillo from "./pages/Bolsillo";
import NuevoGasto from "./pages/NuevoGasto";
import PrecioJusto from "./pages/PrecioJusto";
import Perfil from "./pages/Perfil";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AppProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/recetario" element={<Recetario />} />
            <Route path="/recetario/nuevo" element={<CrearProducto />} />
            <Route path="/recetario/:id" element={<CrearProducto />} />
            <Route path="/bolsillo" element={<Bolsillo />} />
            <Route path="/bolsillo/nuevo" element={<NuevoGasto />} />
            <Route path="/bolsillo/:id" element={<NuevoGasto />} />
            <Route path="/precio-justo" element={<PrecioJusto />} />
            <Route path="/perfil" element={<Perfil />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AppProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
