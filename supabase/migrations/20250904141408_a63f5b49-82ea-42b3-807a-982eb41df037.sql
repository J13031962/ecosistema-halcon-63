-- Ver todas las políticas actuales de user_roles
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'user_roles';

-- Forzar eliminación de TODAS las políticas
DO $$
DECLARE
    pol_name text;
BEGIN
    FOR pol_name IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'user_roles' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.user_roles', pol_name);
    END LOOP;
END $$;

-- Deshabilitar RLS completamente
ALTER TABLE public.user_roles DISABLE ROW LEVEL SECURITY;

-- Volver a habilitar con políticas completamente nuevas
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- SOLO una política: admin@empresa.com puede hacer TODO
CREATE POLICY "admin_only_policy" ON public.user_roles
FOR ALL USING (
  (auth.jwt() ->> 'email') = 'admin@empresa.com'
);

-- SOLO una política adicional: permitir lectura a todos
CREATE POLICY "read_only_policy" ON public.user_roles
FOR SELECT USING (true);