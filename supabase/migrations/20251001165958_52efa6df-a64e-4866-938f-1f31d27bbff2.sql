-- Actualizar política de INSERT para clientes
DROP POLICY IF EXISTS "Usuarios_autenticados_pueden_insertar_clientes" ON public.clientes;

CREATE POLICY "Operadores pueden insertar clientes" ON public.clientes
FOR INSERT 
WITH CHECK (
  (EXISTS ( 
    SELECT 1
    FROM user_roles ur
    WHERE ur.user_id = auth.uid() 
      AND ur.role = ANY (ARRAY['administrador'::user_role, 'director'::user_role, 'operador_alarmas'::user_role])
  )) 
  OR 
  (EXISTS ( 
    SELECT 1
    FROM users_auth ua
    WHERE ua.email = (auth.jwt() ->> 'email') 
      AND ua.active = true 
      AND ua.role = ANY (ARRAY['administrador'::text, 'director'::text, 'operador_alarmas'::text])
  ))
);

-- Actualizar política de UPDATE para clientes
DROP POLICY IF EXISTS "Usuarios_autenticados_pueden_actualizar_clientes" ON public.clientes;

CREATE POLICY "Operadores pueden actualizar clientes" ON public.clientes
FOR UPDATE 
USING (
  (EXISTS ( 
    SELECT 1
    FROM user_roles ur
    WHERE ur.user_id = auth.uid() 
      AND ur.role = ANY (ARRAY['administrador'::user_role, 'director'::user_role, 'operador_alarmas'::user_role])
  )) 
  OR 
  (EXISTS ( 
    SELECT 1
    FROM users_auth ua
    WHERE ua.email = (auth.jwt() ->> 'email') 
      AND ua.active = true 
      AND ua.role = ANY (ARRAY['administrador'::text, 'director'::text, 'operador_alarmas'::text])
  ))
)
WITH CHECK (
  (EXISTS ( 
    SELECT 1
    FROM user_roles ur
    WHERE ur.user_id = auth.uid() 
      AND ur.role = ANY (ARRAY['administrador'::user_role, 'director'::user_role, 'operador_alarmas'::user_role])
  )) 
  OR 
  (EXISTS ( 
    SELECT 1
    FROM users_auth ua
    WHERE ua.email = (auth.jwt() ->> 'email') 
      AND ua.active = true 
      AND ua.role = ANY (ARRAY['administrador'::text, 'director'::text, 'operador_alarmas'::text])
  ))
);