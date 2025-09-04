-- Verificar y crear solo las políticas que faltan para alarmas

-- Eliminar políticas problemáticas específicas
DROP POLICY IF EXISTS "Operadores crear alarmas" ON public.alarmas;
DROP POLICY IF EXISTS "Actualización alarmas cascada" ON public.alarmas;
DROP POLICY IF EXISTS "Visualización alarmas cascada" ON public.alarmas;

-- Crear política para CREAR alarmas si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'alarmas' 
        AND policyname = 'Users can create alarmas'
    ) THEN
        CREATE POLICY "Users can create alarmas" 
        ON public.alarmas 
        FOR INSERT 
        TO authenticated
        WITH CHECK (true);
    END IF;
END $$;

-- Crear política para ACTUALIZAR alarmas si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'alarmas' 
        AND policyname = 'Users can update alarmas'
    ) THEN
        CREATE POLICY "Users can update alarmas" 
        ON public.alarmas 
        FOR UPDATE 
        TO authenticated
        USING (true)
        WITH CHECK (true);
    END IF;
END $$;

-- Crear política para ELIMINAR alarmas si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'alarmas' 
        AND policyname = 'Admins can delete alarmas'
    ) THEN
        CREATE POLICY "Admins can delete alarmas" 
        ON public.alarmas 
        FOR DELETE 
        TO authenticated
        USING (
          EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid() 
            AND role = 'administrador'::user_role
          )
        );
    END IF;
END $$;