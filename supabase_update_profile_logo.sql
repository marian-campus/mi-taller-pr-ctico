-- SQL Migration: Add logo_url to profiles and instructions for Storage

-- 1. Add logo_url column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS logo_url TEXT;

-- PASO 1: Ve a 'Storage' en tu panel de Supabase.
-- PASO 2: Crea un NUEVO BUCKET llamado exatamente: logos
-- PASO 3: Activa la casilla de 'Public bucket' para que el logo sea visible.
-- PASO 4: (Opcional) Si prefieres hacerlo por SQL, ejecuta lo siguiente:

/*
-- Intentar crear el bucket vía SQL (requiere permisos de admin)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('logos', 'logos', true)
ON CONFLICT (id) DO NOTHING;

-- Políticas de RLS para el bucket 'logos'
CREATE POLICY "Logos are public" ON storage.objects FOR SELECT USING (bucket_id = 'logos');
CREATE POLICY "Users can upload logos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'logos' AND auth.role() = 'authenticated');
CREATE POLICY "Users can update their own logos" ON storage.objects FOR UPDATE USING (bucket_id = 'logos' AND auth.uid() = owner);
CREATE POLICY "Users can delete their own logos" ON storage.objects FOR DELETE USING (bucket_id = 'logos' AND auth.uid() = owner);
*/

-- 2. Add logo_url column to profiles table (esto ya deberías tenerlo)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS logo_url TEXT;
