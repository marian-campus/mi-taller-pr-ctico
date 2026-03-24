# Documento Maestro: Estado Actual de la App "Mi Taller Contable" / "Mi Negocio"

## 1. Resumen General del Proyecto
La aplicación es una plataforma web orientada al rubro de la gastronomía que permite a los emprendedores gestionar sus productos, recetas, insumos, gastos fijos/variables, y simular ganancias. Su objetivo es proporcionar herramientas financieras prácticas (como calculadora de precio justo y simulador de ventas) junto con una gestión básica de inventario/recetario.

## 2. Tecnologías (Stack Tecnológico)
- **Frontend Framework**: React 18, inicializado con Vite y escrito en TypeScript.
- **Estilos y UI**: 
  - Tailwind CSS para estilos de utilidad.
  - Librería de componentes basados en shadcn/ui (Radix UI, Lucide React).
  - Next Themes para soporte de modo claro/oscuro.
- **Gestión de Estado y Datos**:
  - Context API nativo (`AppContext.tsx`) para el estado global (productos, insumos, gastos, usuario).
  - React Query (`@tanstack/react-query`) disponible para fetching.
  - Enfoque "Local-First / Hybrid": Se carga instantáneamente la UI con datos de `localStorage` y en background sincroniza y guarda en la nube.
- **Backend / BaaS**: Supabase (`@supabase/supabase-js`) para autenticación y base de datos (PostgreSQL con validación RLS).
- **Formularios y Validación**: `react-hook-form` administrado por `zod` (`@hookform/resolvers`).
- **Enrutamiento**: React Router DOM (`BrowserRouter`).
- **Otros**: `jspdf` para exportación de reportes a PDF, `recharts` para gráficos (si aplica), AI Assistant interno (posible integración con un webhook local/n8n según variables de entorno / historial).

## 3. Arquitectura Principal

### Flujo de Datos y Autenticación
El cerebro de la aplicación es `src/context/AppContext.tsx`, el cual maneja toda la lógica del negocio:
1. **Initial Data Fetch**: Intenta cargar datos del `localStorage` de manera sincrónica para mostrar la UI rápido sin bloquear al usuario.
2. **Sincronización Silenciosa (Silent Background Sync)**: En paralelo revisa la sesión en Supabase y hace un fetch a los endpoints asíncronos (`dataService.ts`) usando timeouts agresivos (15s) para traer los últimos datos.
3. **Self-Healing Profile**: Si detecta que hay usuario logueado en base de datos pero la tabla perfil está vacía, crea uno automáticamente por defecto bajo el rubro de "gastronomia".

### Rutas (Páginas)
Las pantallas principales están definidas en `src/App.tsx` y se encuentran en la carpeta `src/pages/`:
- **Públicas**: `Landing.tsx` (Inicio), `Register.tsx`, `RecoverPassword.tsx`.
- **Panel de Control**: `Index.tsx` (Dashboard principal con métricas).
- **Recetario**: `Recetario.tsx` (lista de productos) y `CrearProducto.tsx` (Formulario para crear/editar productos, gestionar ingredientes y empaques).
- **Gastos**: `Bolsillo.tsx` (Lista de gastos/mano de obra) y `NuevoGasto.tsx`.
- **Herramientas de Cálculo**: 
  - `PrecioJusto.tsx`: Sugeridor de precios basado en costos y márgenes de ganancia.
  - `SimuladorMix.tsx`: Simulador de ventas para calcular ganancias proyectadas según volumen.
- **Configuración**: `Perfil.tsx` (Manejo de variables del negocio mensual: horas trabajadas, costo por hora, divisa).

## 4. Estado Reciente y Correcciones (Contexto Histórico)
Basado en actividades / revisiones recientes de código:
1. **Problemas con Supabase Profiles**: Se agregó una lógica de `timeout` al fetch de Supabase y un manejo de errores (PGRST116) para que, si el fetch de los datos falla, la aplicación no entre en un render-loop infinito al no poder traer el perfil (solucionado implementando la estrategia "hybrid mode" y recarga asíncrona robusta en AppContext).
2. **Vercel Routing**: Se agregó manejo para evitar los errores `404` luego de ser redirigido por Supabase usando `window.location.hash`, así permite al React Router procesar el estado en una single-page app al recargar en producción.
3. **Responsive UI**: Se han adaptado menús (`Sidebar` / Ocultar botón cerrar sesión), adaptando el desarrollo para pantallas pequeñas (mobile first).
4. **Calculadoras**: Correcciones en la edición inline de cantidades dentro del formulario de productos, garantizando que sume correctamente el costo de ingredientes más envases.

## 5. Próximos Pasos (De cara a la escalabilidad)
- Documentar en detalle la base de datos de Supabase si se añaden más tablas relacionales.
- Mantener en observación la estrategia de sincronización (`isSyncing`) en `AppContext.tsx` para evitar carrera de datos al alternar entre múltiples dispositivos.
- El asistente de IA (`AIAssistant.tsx`) parece conectarse a un n8n para flujos automatizados; esto requerirá monitoreo de los Webhooks para asegurar latencias estables.

> **Nota**: Este documento base sirve como snapshot del estado actual en Marzo de 2026 y es ideal para alimentar de contexto a Claude o como punto de partida para nuevos features.
