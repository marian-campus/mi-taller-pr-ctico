-- Verificar si las columnas no existen en la tabla Perfil (profiles) y agregarlas si es necesario
-- Ejecuta este script en el SQL Editor de Supabase.

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='business_name') THEN
        ALTER TABLE profiles ADD COLUMN business_name text;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='business_description') THEN
        ALTER TABLE profiles ADD COLUMN business_description text;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='main_products') THEN
        ALTER TABLE profiles ADD COLUMN main_products text;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='logo_url') THEN
        ALTER TABLE profiles ADD COLUMN logo_url text;
    END IF;
END $$;
