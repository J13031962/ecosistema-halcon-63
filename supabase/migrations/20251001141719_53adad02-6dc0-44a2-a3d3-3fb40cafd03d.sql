-- Eliminar las políticas RLS conflictivas que están bloqueando la carga de supervisores

-- Eliminar política restrictiva de SELECT en profiles
DROP POLICY IF EXISTS "Despachadores pueden ver perfiles de supervisores" ON public.profiles;

-- Eliminar política restrictiva de SELECT en user_roles
DROP POLICY IF EXISTS "Despachadores pueden ver roles de supervisores" ON public.user_roles;

-- Eliminar política restrictiva de UPDATE en profiles
DROP POLICY IF EXISTS "Despachadores pueden actualizar perfiles de supervisores" ON public.profiles;

-- Las políticas de INSERT se mantienen para permitir a despachadores crear supervisores:
-- ✓ "Despachadores pueden crear perfiles de supervisores" (profiles, INSERT)
-- ✓ "Despachadores pueden asignar rol de supervisor" (user_roles, INSERT)

-- Las políticas generales existentes proporcionarán acceso de lectura:
-- ✓ "teleguardia_read_only_policy" (user_roles, SELECT)
-- ✓ "Perfiles_acceso_completo" (profiles, SELECT)