-- Asegurar que el administrador principal esté correctamente configurado
-- Primero verificar si admin@empresa.com existe, si no, crearlo
DO $$
BEGIN
  -- Verificar si existe el perfil de admin@empresa.com
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE email = 'admin@empresa.com') THEN
    -- Crear el perfil del administrador
    INSERT INTO profiles (id, email, full_name, active) 
    VALUES (
      gen_random_uuid(),
      'admin@empresa.com',
      'Administrador Principal',
      true
    );
  END IF;
  
  -- Obtener el ID del administrador
  DECLARE 
    admin_id UUID;
  BEGIN
    SELECT id INTO admin_id FROM profiles WHERE email = 'admin@empresa.com';
    
    -- Asegurar que tenga el rol de administrador
    INSERT INTO user_roles (user_id, role) 
    VALUES (admin_id, 'administrador'::user_role)
    ON CONFLICT (user_id, role) DO NOTHING;
  END;
END $$;

-- Corregir políticas de clientes para permitir que funcionen correctamente
DROP POLICY IF EXISTS "Users can create clientes" ON clientes;
DROP POLICY IF EXISTS "Users can update clientes" ON clientes;
DROP POLICY IF EXISTS "Users can view clientes" ON clientes;

-- Nuevas políticas más permisivas para clientes
CREATE POLICY "Authenticated users can create clientes" 
ON clientes FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update clientes" 
ON clientes FOR UPDATE 
USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view clientes" 
ON clientes FOR SELECT 
USING (auth.role() = 'authenticated');