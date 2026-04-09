# Guía de Despliegue con Vercel Functions (Sin Terminal)

Hemos cambiado la estrategia para que no tengas que usar la terminal. Ahora el PDF se generará usando una **Vercel Function**, que se despliega automáticamente cuando subes tu código a GitHub.

## 1. Configurar Supabase (SQL)
Si aún no lo hiciste, ejecuta el script de base de datos:
1. Entra a tu panel de **Supabase**.
2. Ve a **SQL Editor** -> **New query**.
3. Pega el contenido de [setup_pdf_storage.sql](file:///c:/Mariany/mi-taller-pr-ctico/setup_pdf_storage.sql).
4. Haz clic en **Run**.

---

## 2. Configurar Variables en Vercel (CRÍTICO)
Para que el servidor pueda guardar los PDFs en Supabase, necesita una "llave maestra". **Sigue estos pasos con cuidado**:

1. Ve a tu panel de **Supabase** -> **Project Settings** (el engranaje) -> **API**.
2. Busca la sección **Service Role JWT** y copia el código que dice `service_role key`. (Es secreto, no lo compartas).
3. Ahora ve a tu panel de **Vercel** -> Selecciona tu proyecto -> **Settings** -> **Environment Variables**.
4. Agrega una nueva variable:
   - **Key**: `SUPABASE_SERVICE_ROLE_KEY`
   - **Value**: (Pega la llave que copiaste).
5. Asegúrate de que también tengas configurada la variable `VITE_SUPABASE_URL` o `SUPABASE_URL` con la dirección de tu proyecto.
6. Haz clic en **Save**.

---

## 3. Desplegar los cambios
1. **Sube tus cambios a GitHub** (o como hagas normalmente el despliegue a Vercel).
2. Vercel detectará la nueva carpeta `/api` y creará la función automáticamente.
3. No necesitas ejecutar ningún comando de terminal especial como `npx` o `login`.

---

## 4. Verificar
Una vez que Vercel termine de desplegar (puedes verlo en la pestaña "Deployments" de Vercel):
1. Abre tu aplicación.
2. Haz clic en **Descargar Reporte PDF**.
3. Deberías ver el mensaje "Generando reporte en el servidor..." y la descarga debería iniciar automáticamente en unos segundos.
