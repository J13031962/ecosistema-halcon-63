-- Crear función de seguridad para verificar si el usuario es despachador
CREATE OR REPLACE FUNCTION public.is_dispatcher(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = 'despachador_patrullas'::user_role
  );
$$;

-- Política para que despachadores puedan insertar en user_roles (solo supervisores)
CREATE POLICY "Despachadores pueden asignar rol de supervisor"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (
  public.is_dispatcher(auth.uid()) AND role = 'supervisor_motorizado'::user_role
);

-- Política para que despachadores puedan ver supervisores
CREATE POLICY "Despachadores pueden ver roles de supervisores"
ON public.user_roles
FOR SELECT
TO authenticated
USING (
  public.is_dispatcher(auth.uid()) AND role = 'supervisor_motorizado'::user_role
);

-- Política para que despachadores puedan insertar perfiles de supervisores
CREATE POLICY "Despachadores pueden crear perfiles de supervisores"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (
  public.is_dispatcher(auth.uid())
);

-- Política para que despachadores puedan ver perfiles de supervisores
CREATE POLICY "Despachadores pueden ver perfiles de supervisores"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  public.is_dispatcher(auth.uid()) OR 
  id IN (
    SELECT user_id FROM public.user_roles 
    WHERE role = 'supervisor_motorizado'::user_role
  )
);

-- Política para que despachadores puedan actualizar perfiles de supervisores
CREATE POLICY "Despachadores pueden actualizar perfiles de supervisores"
ON public.profiles
FOR UPDATE
TO authenticated
USING (
  public.is_dispatcher(auth.uid()) AND
  id IN (
    SELECT user_id FROM public.user_roles 
    WHERE role = 'supervisor_motorizado'::user_role
  )
)
WITH CHECK (
  public.is_dispatcher(auth.uid()) AND
  id IN (
    SELECT user_id FROM public.user_roles 
    WHERE role = 'supervisor_motorizado'::user_role
  )
);