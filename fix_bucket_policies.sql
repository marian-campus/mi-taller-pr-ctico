-- SQL a ejecutar en Supabase para habilitar las POLÍTICAS del bucket 'logos'
-- Copia y pega todo este código en tu SQL Editor y cárgalo.

-- 1. Permitir que cualquiera vea los logos (lectura pública)
CREATE POLICY "Logos are public" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'logos');

-- 2. Permitir que usuarios registrados suban sus logos
CREATE POLICY "Users can upload logos" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'logos' AND auth.role() = 'authenticated');

-- 3. Permitir que los usuarios actualicen sus propios archivos
CREATE POLICY "Users can update their own logos" 
ON storage.objects FOR UPDATE 
USING (bucket_id = 'logos' AND auth.uid() = owner);

-- 4. Permitir que los usuarios borren sus archivos
CREATE POLICY "Users can delete their own logos" 
ON storage.objects FOR DELETE 
USING (bucket_id = 'logos' AND auth.uid() = owner);
