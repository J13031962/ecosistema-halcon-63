-- Allow dispatchers to assign technicians to technical services
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'servicios_tecnicos_asignados' 
      AND policyname = 'Despachadores pueden asignar servicios'
  ) THEN
    CREATE POLICY "Despachadores pueden asignar servicios"
    ON public.servicios_tecnicos_asignados
    FOR UPDATE
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM public.user_roles ur
        WHERE ur.user_id = auth.uid()
          AND ur.role = 'despachador_patrullas'::user_role
      )
      OR EXISTS (
        SELECT 1 FROM public.user_roles ur
        WHERE ur.user_id = auth.uid()
          AND ur.role = ANY(ARRAY['administrador'::user_role, 'jefe_tecnicos'::user_role])
      )
    )
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM public.user_roles ur
        WHERE ur.user_id = auth.uid()
          AND ur.role = 'despachador_patrullas'::user_role
      )
      OR EXISTS (
        SELECT 1 FROM public.user_roles ur
        WHERE ur.user_id = auth.uid()
          AND ur.role = ANY(ARRAY['administrador'::user_role, 'jefe_tecnicos'::user_role])
      )
    );
  END IF;
END$$;