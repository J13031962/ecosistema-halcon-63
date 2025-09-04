-- Verificar las restricciones de clave foránea en la tabla alarmas
SELECT 
    conname AS constraint_name,
    conrelid::regclass AS table_name,
    confrelid::regclass AS referenced_table,
    a.attname AS column_name,
    af.attname AS foreign_column_name
FROM 
    pg_constraint c
JOIN 
    pg_attribute a ON a.attnum = ANY(c.conkey) AND a.attrelid = c.conrelid
JOIN 
    pg_attribute af ON af.attnum = ANY(c.confkey) AND af.attrelid = c.confrelid
WHERE 
    c.conrelid = 'public.alarmas'::regclass 
    AND c.contype = 'f';

-- Eliminar la restricción de clave foránea problemática si existe
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'alarmas_operador_id_fkey' 
        AND conrelid = 'public.alarmas'::regclass
    ) THEN
        ALTER TABLE public.alarmas DROP CONSTRAINT alarmas_operador_id_fkey;
    END IF;
END $$;

-- Asegurar que operador_id sea nullable
ALTER TABLE public.alarmas ALTER COLUMN operador_id DROP NOT NULL;