-- SQL Migration: Add limit constraint to free users
-- Por favor ejecuta esto en el SQL Editor de Supabase para añadir seguridad a la BD

-- 1. Crear una función para revisar el límite
CREATE OR REPLACE FUNCTION check_product_limit()
RETURNS TRIGGER AS $$
DECLARE
  product_count INT;
BEGIN
  -- Contamos el número total de productos asociados a este user_id
  SELECT COUNT(*) INTO product_count FROM products WHERE user_id = NEW.user_id;

  -- Si el contador incluye 5 productos o más, rechazamos la inserción
  IF product_count >= 5 THEN
    -- El código P9999 o 42501 es opcional, lo lanzamos como Excepción General
    RAISE EXCEPTION 'Has alcanzado el límite de 5 productos de la versión Freemium.' USING ERRCODE = 'P9999';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Eliminar el trigger si ya existía para evitar conflictos
DROP TRIGGER IF EXISTS enforce_product_limit ON products;

-- 3. Crear el Trigger para ejecutar antes de un INSERT
CREATE TRIGGER enforce_product_limit
BEFORE INSERT ON products
FOR EACH ROW
EXECUTE FUNCTION check_product_limit();
