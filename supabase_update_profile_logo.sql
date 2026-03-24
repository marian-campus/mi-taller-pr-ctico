-- SQL Migration: Add logo_url to profiles and instructions for Storage

-- 1. Add logo_url column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS logo_url TEXT;

-- 2. Storage Bucket Instructions (Run these in your Supabase Dashboard under 'Storage')
-- 
-- PASO 1: Crea un bucket llamado 'logos'.
-- PASO 2: Asegúrate de que el bucket sea 'Public'.
-- PASO 3: Agrega las siguientes políticas de RLS para el bucket 'logos':
--    - SELECT: Permitir lectura pública (si quieres que otros vean el logo, aunque sea una app interna).
--    - INSERT/UPDATE/DELETE: Permitir solo a usuarios autenticados gestionar sus propios archivos.
--
-- Si prefieres hacerlo por SQL (requiere permisos de admin en el dashboard):
/*
INSERT INTO storage.buckets (id, name, public) 
VALUES ('logos', 'logos', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Logos are public" ON storage.objects FOR SELECT USING (bucket_id = 'logos');
CREATE POLICY "Users can upload logos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'logos' AND auth.role() = 'authenticated');
CREATE POLICY "Users can update their own logos" ON storage.objects FOR UPDATE USING (bucket_id = 'logos' AND auth.uid() = owner);
CREATE POLICY "Users can delete their own logos" ON storage.objects FOR DELETE USING (bucket_id = 'logos' AND auth.uid() = owner);
*/
