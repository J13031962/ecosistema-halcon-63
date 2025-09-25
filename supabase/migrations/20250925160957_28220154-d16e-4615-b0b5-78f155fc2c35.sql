-- Fix RLS policies for supervisor GPS tracking
-- Drop existing supervisor-specific policies
DROP POLICY IF EXISTS "Supervisores pueden insertar sus ubicaciones" ON public.supervisor_ubicaciones_tiempo_real;
DROP POLICY IF EXISTS "Supervisores pueden ver sus propias ubicaciones" ON public.supervisor_ubicaciones_tiempo_real;

-- Create new INSERT policy for supervisors that handles both auth systems
CREATE POLICY "Supervisores pueden insertar sus ubicaciones" 
ON public.supervisor_ubicaciones_tiempo_real 
FOR INSERT 
WITH CHECK (
  is_authenticated_user() AND (
    -- Direct match with auth.uid()
    supervisor_id = auth.uid()
    OR
    -- Match via profiles table (supervisor_id = profiles.id)
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = supervisor_ubicaciones_tiempo_real.supervisor_id
      AND (p.user_id = auth.uid() OR p.email = (auth.jwt() ->> 'email'))
    )
  )
);

-- Create new SELECT policy for supervisors to view their own locations
CREATE POLICY "Supervisores pueden ver sus propias ubicaciones" 
ON public.supervisor_ubicaciones_tiempo_real 
FOR SELECT 
USING (
  -- Direct match with auth.uid()
  supervisor_id = auth.uid()
  OR
  -- Match via profiles table (supervisor_id = profiles.id)
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = supervisor_ubicaciones_tiempo_real.supervisor_id
    AND (p.user_id = auth.uid() OR p.email = (auth.jwt() ->> 'email'))
  )
);