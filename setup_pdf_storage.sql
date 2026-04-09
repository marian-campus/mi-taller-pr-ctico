-- 1. Crear el bucket si no existe
INSERT INTO storage.buckets (id, name, public)
VALUES ('reports', 'reports', false)
ON CONFLICT (id) DO NOTHING;

-- 2. Habilitar RLS (vía políticas de storage)
-- Permitir a los usuarios autenticados ver sus propios reportes (opcional si usamos signed URLs, pero recomendado)
CREATE POLICY "Users can view their own reports"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'reports' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Nota: La Edge Function usará la Service Role Key para subir y borrar archivos,
-- por lo que no necesitamos políticas de INSERT o DELETE públicas/autenticadas para que funcione.
