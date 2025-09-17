-- Drop existing policies to recreate them without conflicts
DROP POLICY IF EXISTS "Administradores pueden gestionar empresas_contratadas" ON public.empresas_contratadas;
DROP POLICY IF EXISTS "Administradores y directores pueden gestionar patrullas_coraza" ON public.patrullas_coraza;

-- Create new expanded policies for empresas_contratadas
CREATE POLICY "Operadores pueden gestionar empresas_contratadas"
ON public.empresas_contratadas
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.role = ANY (ARRAY['administrador'::user_role, 'director'::user_role, 'despachador_patrullas'::user_role, 'operador_alarmas'::user_role])
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.role = ANY (ARRAY['administrador'::user_role, 'director'::user_role, 'despachador_patrullas'::user_role, 'operador_alarmas'::user_role])
  )
);

-- Create new expanded policies for patrullas_coraza
CREATE POLICY "Operadores pueden gestionar patrullas_coraza"
ON public.patrullas_coraza
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.role = ANY (ARRAY['administrador'::user_role, 'director'::user_role, 'despachador_patrullas'::user_role, 'operador_alarmas'::user_role])
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.role = ANY (ARRAY['administrador'::user_role, 'director'::user_role, 'despachador_patrullas'::user_role, 'operador_alarmas'::user_role])
  )
);