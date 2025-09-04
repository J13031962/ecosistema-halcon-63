-- Solo corregir las políticas de user_roles y clientes sin crear usuarios
-- Las políticas de user_roles ya están arregladas, vamos a verificar las de clientes

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