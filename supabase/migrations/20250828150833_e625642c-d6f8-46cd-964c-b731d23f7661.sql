-- Corregir la estructura de la tabla profiles
-- Agregar las columnas faltantes si no existen
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS username TEXT,
ADD COLUMN IF NOT EXISTS numero_documento TEXT,
ADD COLUMN IF NOT EXISTS foto_url TEXT;

-- Crear índice único en user_id si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'profiles_user_id_unique'
    ) THEN
        ALTER TABLE public.profiles 
        ADD CONSTRAINT profiles_user_id_unique UNIQUE(user_id);
    END IF;
END $$;