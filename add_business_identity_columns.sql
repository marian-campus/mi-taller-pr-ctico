-- Añadir campos de descripción e identidad de negocio a la tabla de perfiles
-- Ejecutar en el Editor SQL de Supabase

DO $$
BEGIN
    -- Añadir columna business_description si no existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'business_description') THEN
        ALTER TABLE profiles ADD COLUMN business_description TEXT;
    END IF;

    -- Añadir columna main_products si no existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'main_products') THEN
        ALTER TABLE profiles ADD COLUMN main_products TEXT;
    END IF;
END $$;

-- Comentario para verificar
COMMENT ON COLUMN profiles.business_description IS 'Breve descripción del emprendimiento';
COMMENT ON COLUMN profiles.main_products IS 'Lista de productos principales de venta';
