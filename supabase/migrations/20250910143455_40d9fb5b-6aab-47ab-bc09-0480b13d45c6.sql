-- Fix user roles based on their names and create new operator users

-- First, fix roles based on names
-- Update users with supervisor names to supervisor_motorizado role
UPDATE user_roles 
SET role = 'supervisor_motorizado'::user_role
WHERE user_id IN (
  SELECT p.user_id 
  FROM profiles p 
  WHERE LOWER(p.full_name) LIKE '%supervisor%' 
  AND p.email IN ('superviso1@telguardia.com', 'supervisor1@teleguardia.com', 'supervisor2@teleguardia.com')
);

-- Update users with technician names to tecnico role
UPDATE user_roles 
SET role = 'tecnico'::user_role
WHERE user_id IN (
  SELECT p.user_id 
  FROM profiles p 
  WHERE (LOWER(p.full_name) LIKE '%tecnico%' OR LOWER(p.full_name) LIKE '%técnico%')
  AND p.email IN ('tecnico@empresa.com', 'tecnico@teleguardia.com')
);

-- Update director to director role (using valid enum value)
UPDATE user_roles 
SET role = 'director'::user_role
WHERE user_id IN (
  SELECT p.user_id 
  FROM profiles p 
  WHERE (LOWER(p.full_name) LIKE '%director%')
  AND p.email IN ('director@teleguardia.com', 'director@empresa.com')
);

-- Update despachador to despachador_patrullas role
UPDATE user_roles 
SET role = 'despachador_patrullas'::user_role
WHERE user_id IN (
  SELECT p.user_id 
  FROM profiles p 
  WHERE (LOWER(p.full_name) LIKE '%despachador%')
  AND p.email IN ('despachador@empresa.com', 'despachador@teleguardia.com')
);

-- Update asesor to asesor_ventas role
UPDATE user_roles 
SET role = 'asesor_ventas'::user_role
WHERE user_id IN (
  SELECT p.user_id 
  FROM profiles p 
  WHERE (LOWER(p.full_name) LIKE '%asesor%')
  AND p.email = 'asesor@teleguardia.com'
);

-- Create new operator users using the safe function
-- Luis Perez
SELECT assign_user_role_safely('luis.perez@teleguardia.com', 'operador_alarmas');

-- Jaime Alvarez  
SELECT assign_user_role_safely('jaime.alvarez@teleguardia.com', 'operador_alarmas');

-- Carlos Betancur
SELECT assign_user_role_safely('carlos.betancur@teleguardia.com', 'operador_alarmas');