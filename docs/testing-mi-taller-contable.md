# SMOKE TEST - Mi Taller Contable

**Fecha:** __________  
**Testeador:** __________  
**Ambiente:** ☐ Local ☐ Staging ☐ Production (Vercel)

---

## A) AUTENTICACIÓN Y SESIÓN

### Registro de Usuario
- [ ] Puedo crear una cuenta nueva con email y contraseña
- [ ] El formulario valida nombre, apellido, email y contraseña
- [ ] La confirmación de contraseña funciona correctamente
- [ ] Recibo confirmación visual del registro exitoso
- [ ] Soy redirigido al Dashboard después del registro

### Inicio de Sesión
- [ ] Puedo iniciar sesión con credenciales existentes
- [ ] Las credenciales incorrectas muestran error apropiado
- [ ] El botón "¿Olvidaste tu contraseña?" funciona
- [ ] Soy redirigido al Dashboard después del login exitoso

### Recuperación de Contraseña
- [ ] Puedo solicitar recuperación de contraseña
- [ ] Recibo el email de Supabase para resetear
- [ ] El link de recuperación me lleva a cambiar contraseña
- [ ] Puedo establecer nueva contraseña

### Persistencia de Sesión
- [ ] La sesión persiste al recargar la página
- [ ] Los usuarios sin sesión son redirigidos al login
- [ ] Puedo cerrar sesión correctamente
- [ ] Después de cerrar sesión, soy redirigido al login
- [ ] El botón de cerrar sesión está visible en el Sidebar (desktop)

### Self-Healing Profile (Funcionalidad crítica)
- [ ] Si inicio sesión por primera vez, se crea automáticamente mi perfil
- [ ] El perfil por defecto tiene rubro "gastronomía"
- [ ] No veo errores PGRST116 en consola
- [ ] El AppContext maneja correctamente el timeout de 15s

---

## B) DASHBOARD PRINCIPAL (Index.tsx)

### Vista General
- [ ] Puedo ver el Dashboard después de login
- [ ] Se muestran métricas principales (productos, gastos, ganancias proyectadas)
- [ ] Los gráficos (si aplica) cargan correctamente usando Recharts
- [ ] El resumen del mes actual es visible
- [ ] El modo claro/oscuro funciona (Next Themes)

### Datos en el Dashboard
- [ ] Las métricas reflejan datos reales de Supabase
- [ ] Si no hay productos, se muestra mensaje apropiado
- [ ] Si no hay gastos, se muestra mensaje apropiado
- [ ] Los números se actualizan al agregar nuevos datos

---

## C) MÓDULO: RECETARIO / PRODUCTOS

### Recetario.tsx (Lista de Productos)
- [ ] Puedo ver la lista de todos mis productos
- [ ] Los productos muestran: nombre, costo, precio, margen
- [ ] Puedo filtrar/buscar productos (si aplica)
- [ ] El botón "Crear Producto" me lleva al formulario
- [ ] Puedo editar un producto existente
- [ ] Puedo eliminar un producto
- [ ] Al eliminar, aparece confirmación

### CrearProducto.tsx (Crear/Editar Producto)
- [ ] Puedo acceder al formulario de crear producto
- [ ] Los campos requeridos muestran validación (react-hook-form + zod)
- [ ] Puedo agregar nombre del producto
- [ ] Puedo agregar categoría
- [ ] Puedo agregar tiempo de elaboración (horas y minutos)
- [ ] **Sección Ingredientes:**
  - [ ] Puedo buscar y seleccionar insumos existentes
  - [ ] Puedo especificar cantidad usada por ingrediente
  - [ ] El costo de cada ingrediente se calcula automáticamente
  - [ ] Puedo agregar múltiples ingredientes
  - [ ] Puedo eliminar ingredientes de la receta
- [ ] **Sección Packaging/Empaque:**
  - [ ] Puedo agregar insumos de empaque
  - [ ] El costo se calcula correctamente
  - [ ] Puedo especificar cantidades
- [ ] **Sección Costos Indirectos:**
  - [ ] Puedo incluir gastos fijos prorrateados
  - [ ] Puedo incluir servicios (luz, gas, etc.)
  - [ ] El costo total se calcula sumando todo
- [ ] **Costo de Mano de Obra:**
  - [ ] Se calcula automáticamente según horas × tarifa por hora
  - [ ] Refleja el valor configurado en Perfil
- [ ] **Costo Total:**
  - [ ] Suma ingredientes + empaque + indirectos + mano de obra
  - [ ] Se muestra claramente
- [ ] **Precio de Venta:**
  - [ ] Puedo establecer precio de venta
  - [ ] El margen de ganancia se calcula automáticamente
  - [ ] El % de margen es correcto: (precio - costo) / precio × 100
- [ ] Puedo guardar el producto
- [ ] Los datos se guardan en Supabase correctamente
- [ ] Después de guardar, soy redirigido a la lista de productos
- [ ] El producto aparece en la lista inmediatamente (localStorage híbrido)

### Edición Inline (Corrección reciente)
- [ ] Al editar cantidades de ingredientes, el costo se recalcula
- [ ] No hay duplicación de ingredientes
- [ ] Los cambios se guardan correctamente

---

## D) MÓDULO: INSUMOS / SUPPLIES

### Gestión de Insumos
- [ ] Puedo ver la lista de mis insumos
- [ ] Puedo crear un nuevo insumo
- [ ] Puedo editar un insumo existente
- [ ] Puedo eliminar un insumo
- [ ] Los insumos muestran: nombre, categoría, precio por unidad
- [ ] Los insumos se pueden usar en productos (ingredientes/packaging)

### Formulario de Insumos
- [ ] Puedo especificar nombre del insumo
- [ ] Puedo seleccionar categoría (ingrediente, empaque, etc.)
- [ ] Puedo ingresar cantidad comprada
- [ ] Puedo seleccionar unidad (kg, litros, unidades, etc.)
- [ ] Puedo ingresar precio pagado
- [ ] El precio por unidad se calcula automáticamente
- [ ] Los datos se guardan correctamente

---

## E) MÓDULO: GASTOS (Bolsillo.tsx)

### Bolsillo.tsx (Lista de Gastos)
- [ ] Puedo ver todos mis gastos registrados
- [ ] Los gastos muestran: descripción, categoría, monto, fecha
- [ ] Puedo filtrar gastos por categoría
- [ ] Puedo filtrar gastos por mes
- [ ] Los gráficos de gastos (Recharts) funcionan correctamente
- [ ] Puedo ver total de gastos del mes
- [ ] Puedo agregar un nuevo gasto (botón visible)

### NuevoGasto.tsx (Crear/Editar Gasto)
- [ ] Puedo acceder al formulario de nuevo gasto
- [ ] Puedo ingresar descripción del gasto
- [ ] Puedo seleccionar categoría (publicidad, transporte, etc.)
- [ ] Puedo ingresar monto
- [ ] Puedo seleccionar fecha
- [ ] Puedo marcar si se incluye en gastos fijos
- [ ] El formulario valida campos requeridos
- [ ] Puedo guardar el gasto
- [ ] El gasto aparece en la lista inmediatamente
- [ ] Los datos se sincronizan con Supabase

### Gastos Recurrentes
- [ ] Puedo identificar gastos recurrentes (si aplica)
- [ ] Los gastos recurrentes se marcan visualmente

---

## F) MÓDULO: PRECIO JUSTO (PrecioJusto.tsx)

### Calculadora de Precio Justo
- [ ] Puedo acceder a la calculadora
- [ ] Puedo seleccionar un producto de la lista
- [ ] Se muestra el costo total del producto
- [ ] Puedo ajustar el margen de ganancia deseado
- [ ] El precio sugerido se calcula automáticamente
- [ ] Puedo ver comparación con el mercado (si aplica)
- [ ] Puedo aplicar el precio sugerido al producto
- [ ] El precio se actualiza en Supabase

### Simulación de Margen
- [ ] Puedo usar un slider para ajustar margen
- [ ] El precio de venta se actualiza en tiempo real
- [ ] Veo la ganancia neta calculada
- [ ] Veo la ganancia por hora (ganancia / tiempo de elaboración)

---

## G) MÓDULO: SIMULADOR DE VENTAS (SimuladorMix.tsx)

### Simulador de Ganancias
- [ ] Puedo acceder al simulador
- [ ] Puedo seleccionar múltiples productos
- [ ] Puedo especificar cantidad a vender de cada uno
- [ ] Se calcula la ganancia total proyectada
- [ ] Se muestran los costos totales
- [ ] Se muestra el ingreso bruto
- [ ] Se muestra la ganancia neta
- [ ] Puedo ajustar cantidades y ver cambios en tiempo real

### Proyección de Ventas
- [ ] Puedo establecer una meta de ganancia
- [ ] El simulador calcula cuánto debo vender
- [ ] Veo diferentes opciones de mix de productos
- [ ] Los cálculos son correctos

---

## H) MÓDULO: PERFIL / CONFIGURACIÓN (Perfil.tsx)

### Datos del Negocio
- [ ] Puedo ver y editar mi nombre
- [ ] Puedo ver y editar el nombre de mi negocio
- [ ] Puedo seleccionar categoría del negocio
- [ ] Puedo establecer mi tarifa por hora
- [ ] Puedo establecer salario mensual deseado
- [ ] Puedo establecer horas trabajadas al mes
- [ ] Puedo seleccionar mi moneda (símbolo)
- [ ] Los cambios se guardan en Supabase
- [ ] La tarifa por hora se usa en cálculo de costos de productos

### Gastos Fijos Mensuales
- [ ] Puedo ver mis gastos fijos mensuales configurados
- [ ] Puedo editar el total de gastos fijos
- [ ] Este valor se usa en simulaciones

### País y Región
- [ ] Puedo establecer mi ubicación (si aplica)
- [ ] Puedo establecer mi país

---

## I) NAVEGACIÓN Y ROUTING

### Menú Principal
- [ ] Todos los links del menú funcionan
- [ ] Dashboard redirige correctamente
- [ ] Recetario redirige correctamente
- [ ] Gastos (Bolsillo) redirige correctamente
- [ ] Precio Justo redirige correctamente
- [ ] Simulador redirige correctamente
- [ ] Perfil redirige correctamente

### Navegación del Navegador
- [ ] El botón "atrás" funciona correctamente
- [ ] El botón "adelante" funciona
- [ ] No hay páginas de error 404 en rutas principales
- [ ] Las rutas protegidas redirigen a login si no hay sesión

### Responsive Design
- [ ] La app funciona en desktop (1920px)
- [ ] La app funciona en tablet (768px)
- [ ] La app funciona en mobile (375px)
- [ ] El Sidebar se adapta a mobile
- [ ] Los formularios son usables en mobile
- [ ] Las tablas se adaptan o hacen scroll en mobile

---

## J) INTEGRACIÓN CON SUPABASE

### Autenticación
- [ ] Supabase Auth funciona correctamente
- [ ] Los usuarios se crean en `auth.users`
- [ ] El RLS (Row Level Security) protege los datos

### Base de Datos
- [ ] Los datos se guardan en las tablas correctas:
  - [ ] `profiles` - perfil del usuario
  - [ ] `products` - productos/recetas
  - [ ] `supplies` - insumos
  - [ ] `expenses` - gastos
  - [ ] `product_ingredients` - relación producto-insumo
- [ ] Solo veo MIS datos (RLS funcionando)
- [ ] No veo datos de otros usuarios

### Sincronización Híbrida
- [ ] Los datos cargan rápido desde localStorage
- [ ] Se sincroniza en background con Supabase (15s timeout)
- [ ] No veo loops infinitos de carga
- [ ] El flag `isSyncing` funciona correctamente
- [ ] Si hay conflicto, Supabase tiene prioridad

### Manejo de Errores
- [ ] Si Supabase falla, veo mensaje de error apropiado
- [ ] La app no se rompe si no hay conexión
- [ ] Los datos locales se mantienen hasta que haya conexión
- [ ] No veo errores PGRST116 sin manejo

---

## K) ASISTENTE DE IA (AIAssistant.tsx) - CONTA

### Integración con n8n
- [ ] El chat de Conta es accesible desde el Dashboard
- [ ] Puedo abrir el chat (ícono flotante o botón)
- [ ] Puedo escribir mensajes a Conta
- [ ] Conta responde correctamente
- [ ] El webhook de n8n está funcionando
- [ ] La URL del webhook es correcta en variables de entorno

### Funcionalidad del Chat
- [ ] Conta conoce mi nombre (lee profile de Supabase)
- [ ] Conta conoce mis productos (lee products de Supabase)
- [ ] Conta conoce mis gastos (lee expenses de Supabase)
- [ ] Conta puede analizar rentabilidad
- [ ] Conta puede recomendar ajustes de precio
- [ ] Conta mantiene el contexto de la conversación (memoria)
- [ ] El `sessionId` se envía correctamente (userId de Supabase)

### Respuestas de Conta
- [ ] Las respuestas son coherentes y relevantes
- [ ] Conta usa voseo argentino
- [ ] Conta es profesional pero amigable
- [ ] Conta muestra datos reales (no inventados)
- [ ] Conta usa emojis apropiados (📊💡⚠️)
- [ ] Conta da recomendaciones accionables
- [ ] Conta educa mientras ayuda

### Estados del Chat
- [ ] Veo indicador de "escribiendo..." mientras Conta piensa
- [ ] Los mensajes se muestran en orden cronológico
- [ ] Puedo hacer scroll en el historial
- [ ] El chat es responsive (mobile/desktop)

---

## L) EXPORTACIÓN Y REPORTES

### Exportación a PDF (jspdf)
- [ ] Puedo exportar reportes a PDF (si aplica)
- [ ] El PDF contiene datos correctos
- [ ] El formato del PDF es legible
- [ ] Puedo descargar el PDF generado

---

## M) CONSOLA Y ERRORES

### Developer Console (F12)
- [ ] No hay errores críticos en rojo en la consola
- [ ] No hay warnings importantes sin resolver
- [ ] Las requests HTTP responden con 200/201
- [ ] No veo errores 500 (server error)
- [ ] No veo errores 400 (bad request) sin manejar
- [ ] No veo errores 404 (not found) inesperados

### Network Tab
- [ ] Las llamadas a Supabase funcionan
- [ ] Las llamadas al webhook de n8n funcionan
- [ ] No hay requests infinitas (loops)
- [ ] Los timeouts están configurados correctamente (15s)

### React Developer Tools
- [ ] El AppContext se actualiza correctamente
- [ ] No hay re-renders innecesarios
- [ ] El estado global es coherente

---

## N) VERCEL DEPLOYMENT (Production)

### Routing en Vercel
- [ ] Las rutas funcionan correctamente después del deploy
- [ ] No veo errores 404 al recargar una página
- [ ] El `window.location.hash` maneja correctamente los redirects de Supabase
- [ ] El routing de React Router funciona en producción

### Variables de Entorno
- [ ] Las env vars de Supabase están configuradas en Vercel
- [ ] La URL del webhook de n8n está configurada
- [ ] La app funciona igual que en local

---

## O) PERFORMANCE Y UX

### Velocidad de Carga
- [ ] La página inicial carga en menos de 3 segundos
- [ ] Los datos de localStorage cargan instantáneamente
- [ ] La sincronización en background no bloquea la UI
- [ ] No hay "flash" de contenido no estilizado (FOUC)

### Experiencia de Usuario
- [ ] Los botones tienen feedback visual (hover, active)
- [ ] Los formularios muestran validación en tiempo real
- [ ] Los mensajes de éxito/error son claros
- [ ] Las transiciones son suaves
- [ ] Los iconos (Lucide React) cargan correctamente
- [ ] El modo oscuro/claro funciona sin problemas

---

## P) EDGE CASES Y ROBUSTEZ

### Sin Datos
- [ ] La app funciona si no tengo productos
- [ ] La app funciona si no tengo gastos
- [ ] La app funciona si no tengo insumos
- [ ] Se muestran mensajes apropiados ("No hay productos aún")

### Datos Extremos
- [ ] Puedo manejar productos con 0 costo
- [ ] Puedo manejar productos con precio muy alto
- [ ] Puedo manejar muchos productos (100+)
- [ ] Puedo manejar muchos gastos (100+)

### Pérdida de Conexión
- [ ] La app funciona offline con datos de localStorage
- [ ] Veo mensaje si no hay conexión a Supabase
- [ ] Los datos se sincronizan cuando vuelve la conexión

### Múltiples Dispositivos
- [ ] Los datos se sincronizan entre dispositivos
- [ ] No hay conflictos al editar desde 2 dispositivos
- [ ] La estrategia `isSyncing` evita carreras de datos

---

## RESULTADO FINAL

### Puntuación
- **Total de checks realizados:** ______ / ______
- **Checks exitosos:** ______
- **Checks fallidos:** ______

### Decisión
- [ ] ✅ **PASA** - La app está lista para usar / deploy
- [ ] ⚠️ **PASA CON OBSERVACIONES** - Funciona pero hay bugs menores
- [ ] ❌ **FALLA** - Hay bugs críticos que deben arreglarse

---

## BUGS ENCONTRADOS

### Críticos (Bloquean funcionalidad principal)
1. _____________________________________________
2. _____________________________________________
3. _____________________________________________

### Importantes (Afectan UX pero no bloquean)
1. _____________________________________________
2. _____________________________________________
3. _____________________________________________

### Menores (Cosméticos o edge cases)
1. _____________________________________________
2. _____________________________________________
3. _____________________________________________

---

## NOTAS ADICIONALES

**Observaciones generales:**
_________________________________________________________________
_________________________________________________________________
_________________________________________________________________

**Recomendaciones:**
_________________________________________________________________
_________________________________________________________________
_________________________________________________________________

**Próximos pasos:**
_________________________________________________________________
_________________________________________________________________
_________________________________________________________________

---

**Firma del Testeador:** ___________________  
**Fecha de Completado:** ___________________

---

## ANEXO: CHECKLIST RÁPIDO PARA DEPLOY

Antes de hacer deploy a producción, verificar:

- [ ] Todas las variables de entorno están en Vercel
- [ ] El RLS de Supabase está activado
- [ ] El webhook de n8n está publicado y activo
- [ ] No hay console.logs sensibles en el código
- [ ] No hay API keys hardcodeadas
- [ ] El build de Vite funciona sin errores (`npm run build`)
- [ ] El preview de Vercel funciona correctamente
- [ ] Los redirects de autenticación funcionan en producción
- [ ] El modo producción de Supabase está configurado (no dev mode)

---

**Documento creado:** Marzo 2026  
**Versión:** 1.0  
**Proyecto:** Mi Taller Contable
