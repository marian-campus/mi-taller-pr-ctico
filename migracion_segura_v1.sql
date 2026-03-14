-- SCRIPT DE MIGRACIÓN: Restaurar campos de la Versión 1 sin borrar datos
-- Ejecuta este script si ya tenés datos en Supabase y solo querés agregar lo que falta.

-- 1. Asegurar campos en la tabla de Productos
DO $$ 
BEGIN 
    -- Agregar campos de mano de obra/servicios si no existen
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='services_hours') THEN
        ALTER TABLE products ADD COLUMN services_hours NUMERIC DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='services_minutes') THEN
        ALTER TABLE products ADD COLUMN services_minutes NUMERIC DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='services_cost') THEN
        ALTER TABLE products ADD COLUMN services_cost NUMERIC DEFAULT 0;
    END IF;

    -- Agregar producción estimada
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='estimated_units_per_month') THEN
        ALTER TABLE products ADD COLUMN estimated_units_per_month NUMERIC DEFAULT 1;
    END IF;
END $$;

-- 2. Asegurar campos en la tabla de Gastos
DO $$ 
BEGIN 
    -- Agregar medio de pago
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='expenses' AND column_name='payment_method') THEN
        ALTER TABLE expenses ADD COLUMN payment_method TEXT;
    END IF;
    
    -- Agregar recurrencia
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='expenses' AND column_name='recurring') THEN
        ALTER TABLE expenses ADD COLUMN recurring BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- NOTA: Este script NO usa DROP TABLE, por lo que tus insumos, productos y gastos actuales
-- permanecerán intactos. Solo se agregan las "columnas vacías" que faltaban de la primera versión.
