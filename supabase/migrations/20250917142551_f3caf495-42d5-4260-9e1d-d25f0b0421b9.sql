-- Expand RLS policies to allow operational roles to manage contracted companies and configuraciones

-- Empresas contratadas: INSERT/UPDATE/DELETE for administrador, director, despachador_patrullas, operador_alarmas
CREATE POLICY "Operativos pueden insertar empresas_contratadas"
ON public.empresas_contratadas
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.role = ANY (ARRAY['administrador'::user_role, 'director'::user_role, 'despachador_patrullas'::user_role, 'operador_alarmas'::user_role])
  )
);

CREATE POLICY "Operativos pueden actualizar empresas_contratadas"
ON public.empresas_contratadas
FOR UPDATE
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

CREATE POLICY "Operativos pueden eliminar empresas_contratadas"
ON public.empresas_contratadas
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.role = ANY (ARRAY['administrador'::user_role, 'director'::user_role, 'despachador_patrullas'::user_role, 'operador_alarmas'::user_role])
  )
);

-- Patrullas_coraza configuraciones: INSERT/UPDATE/DELETE for the same roles
CREATE POLICY "Operativos pueden insertar patrullas_coraza"
ON public.patrullas_coraza
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.role = ANY (ARRAY['administrador'::user_role, 'director'::user_role, 'despachador_patrullas'::user_role, 'operador_alarmas'::user_role])
  )
);

CREATE POLICY "Operativos pueden actualizar patrullas_coraza"
ON public.patrullas_coraza
FOR UPDATE
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

CREATE POLICY "Operativos pueden eliminar patrullas_coraza"
ON public.patrullas_coraza
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.role = ANY (ARRAY['administrador'::user_role, 'director'::user_role, 'despachador_patrullas'::user_role, 'operador_alarmas'::user_role])
  )
);
