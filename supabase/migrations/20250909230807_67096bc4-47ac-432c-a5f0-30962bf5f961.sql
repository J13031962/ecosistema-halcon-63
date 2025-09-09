-- Fix RLS policies for turnos_operador to allow proper access
-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Admins gestionar turnos operador" ON turnos_operador;
DROP POLICY IF EXISTS "Operadores ver turnos propios" ON turnos_operador;

-- Create new policies that allow proper access
-- Allow administrators and authorized users to manage all shifts
CREATE POLICY "Administradores pueden gestionar todos los turnos operador" 
ON turnos_operador 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM user_roles ur 
    WHERE ur.user_id = auth.uid() 
    AND ur.role = 'administrador'::user_role
  )
);

-- Allow authenticated users to insert shifts (for shift generation)
CREATE POLICY "Usuarios autenticados pueden crear turnos operador" 
ON turnos_operador 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

-- Allow operators to view and update their own shifts
CREATE POLICY "Operadores pueden gestionar sus propios turnos" 
ON turnos_operador 
FOR ALL 
USING (
  operador_id = auth.uid() OR 
  EXISTS (
    SELECT 1 FROM user_roles ur 
    WHERE ur.user_id = auth.uid() 
    AND ur.role IN ('administrador'::user_role, 'director'::user_role)
  )
);

-- Allow all authenticated users to view shifts (for calendar display)
CREATE POLICY "Todos pueden ver turnos operador" 
ON turnos_operador 
FOR SELECT 
USING (auth.uid() IS NOT NULL);