-- Primero corregir la estructura de la tabla profiles
-- La tabla profiles debe usar user_id como referencia a auth.users, no id

-- Eliminar la foreign key incorrecta si existe
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- Asegurarnos de que user_id sea la primary key o unique
ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_user_id_unique UNIQUE(user_id) ON CONFLICT DO NOTHING;

-- Agregar las columnas faltantes
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS username TEXT,
ADD COLUMN IF NOT EXISTS numero_documento TEXT,
ADD COLUMN IF NOT EXISTS foto_url TEXT;

-- Actualizar los perfiles existentes para asegurar que tengan user_id correcto
UPDATE public.profiles 
SET user_id = id 
WHERE user_id IS NULL;