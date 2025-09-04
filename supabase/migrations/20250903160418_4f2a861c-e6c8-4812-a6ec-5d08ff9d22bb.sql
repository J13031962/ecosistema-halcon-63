-- Mejorar políticas RLS para sistema en cascada (corregido)

-- Política para asignación de servicios técnicos (Jefe técnicos puede asignar a cualquier técnico)
DROP POLICY IF EXISTS "Director técnico puede crear servicios asignados" ON servicios_tecnicos_asignados;
CREATE POLICY "Jefe técnicos puede crear servicios asignados" 
ON servicios_tecnicos_asignados FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid() 
    AND ur.role IN ('administrador', 'jefe_tecnicos')
  )
);

-- Política para que jefe técnicos puedan ver todos los servicios
DROP POLICY IF EXISTS "Director técnico puede ver todos los servicios" ON servicios_tecnicos_asignados;
CREATE POLICY "Jefe técnicos puede ver todos los servicios" 
ON servicios_tecnicos_asignados FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid() 
    AND ur.role IN ('administrador', 'jefe_tecnicos')
  )
);

-- Política para que jefe técnicos puedan actualizar servicios
DROP POLICY IF EXISTS "Director técnico puede actualizar servicios" ON servicios_tecnicos_asignados;
CREATE POLICY "Jefe técnicos puede actualizar servicios" 
ON servicios_tecnicos_asignados FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid() 
    AND ur.role IN ('administrador', 'jefe_tecnicos')
  )
);

-- Políticas para sistema en cascada de alarmas
-- Operadores pueden crear alarmas
DROP POLICY IF EXISTS "Operadores pueden crear alarmas" ON alarmas;
CREATE POLICY "Operadores pueden crear alarmas" 
ON alarmas FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid() 
    AND ur.role IN ('administrador', 'operador_alarmas')
  )
);

-- Despachadores pueden actualizar alarmas (asignar supervisor)
DROP POLICY IF EXISTS "Despachadores pueden actualizar alarmas" ON alarmas;
CREATE POLICY "Despachadores pueden actualizar alarmas" 
ON alarmas FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid() 
    AND ur.role IN ('administrador', 'despachador_patrullas')
  ) OR 
  despachador_id = auth.uid()
);

-- Reemplazar política existente para visualización de alarmas en sistema cascada
DROP POLICY IF EXISTS "Authenticated users can view alarmas" ON alarmas;
DROP POLICY IF EXISTS "Supervisores pueden ver sus alarmas asignadas" ON alarmas;
CREATE POLICY "Sistema cascada visualización alarmas" 
ON alarmas FOR SELECT 
USING (
  -- Administrador ve todo
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid() 
    AND ur.role = 'administrador'
  ) OR
  -- Directores ven todo
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid() 
    AND ur.role = 'director'
  ) OR
  -- Operadores ven todas las alarmas
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid() 
    AND ur.role = 'operador_alarmas'
  ) OR
  -- Despachadores ven todas las alarmas
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid() 
    AND ur.role = 'despachador_patrullas'
  ) OR
  -- Supervisores solo ven las suyas
  supervisor_id = auth.uid() OR 
  supervisor = (SELECT full_name FROM profiles WHERE user_id = auth.uid())
);

-- Supervisores pueden actualizar estado de sus alarmas asignadas
DROP POLICY IF EXISTS "Supervisores pueden actualizar sus alarmas" ON alarmas;
CREATE POLICY "Supervisores pueden actualizar sus alarmas" 
ON alarmas FOR UPDATE 
USING (
  -- Administradores pueden actualizar cualquier alarma
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid() 
    AND ur.role = 'administrador'
  ) OR
  -- Despachadores pueden actualizar alarmas
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid() 
    AND ur.role = 'despachador_patrullas'
  ) OR
  -- Supervisores solo pueden actualizar las suyas
  supervisor_id = auth.uid() OR 
  supervisor = (SELECT full_name FROM profiles WHERE user_id = auth.uid())
);

-- Política para incidentes - supervisores pueden crear y roles superiores ver
DROP POLICY IF EXISTS "Authenticated users can manage incidentes" ON incidentes;
DROP POLICY IF EXISTS "Supervisores pueden crear incidentes" ON incidentes;
CREATE POLICY "Supervisores pueden crear incidentes" 
ON incidentes FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid() 
    AND ur.role IN ('administrador', 'supervisor_motorizado')
  )
);

DROP POLICY IF EXISTS "Authenticated users can view incidentes" ON incidentes;
CREATE POLICY "Usuarios pueden ver incidentes relevantes" 
ON incidentes FOR SELECT 
USING (
  -- Administrador ve todo
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid() 
    AND ur.role = 'administrador'
  ) OR
  -- Directores ven todo
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid() 
    AND ur.role = 'director'
  ) OR
  -- Despachadores ven todo
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid() 
    AND ur.role = 'despachador_patrullas'
  ) OR
  -- Operadores ven todo
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid() 
    AND ur.role = 'operador_alarmas'
  ) OR
  -- Supervisores ven los suyos
  supervisor_id = auth.uid()
);

-- Política para actividades de supervisor
DROP POLICY IF EXISTS "Authenticated users can manage supervisor_actividades" ON supervisor_actividades;
CREATE POLICY "Supervisores pueden crear actividades" 
ON supervisor_actividades FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid() 
    AND ur.role IN ('administrador', 'supervisor_motorizado')
  )
);

DROP POLICY IF EXISTS "Authenticated users can view supervisor_actividades" ON supervisor_actividades;
CREATE POLICY "Usuarios pueden ver actividades relevantes" 
ON supervisor_actividades FOR SELECT 
USING (
  -- Administrador ve todo
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid() 
    AND ur.role = 'administrador'
  ) OR
  -- Directores ven todo
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid() 
    AND ur.role = 'director'
  ) OR
  -- Despachadores ven todo
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid() 
    AND ur.role = 'despachador_patrullas'
  ) OR
  -- Operadores ven todo
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid() 
    AND ur.role = 'operador_alarmas'
  ) OR
  -- Supervisores ven los suyos
  supervisor_id = auth.uid()
);

-- Política para turnos - solo administradores pueden asignar turnos a operadores
DROP POLICY IF EXISTS "Authenticated users can manage turnos_operador" ON turnos_operador;
CREATE POLICY "Solo administradores pueden gestionar turnos operador" 
ON turnos_operador FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid() 
    AND ur.role = 'administrador'
  )
) 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid() 
    AND ur.role = 'administrador'
  )
);

-- Operadores pueden ver sus propios turnos
CREATE POLICY "Operadores pueden ver sus turnos" 
ON turnos_operador FOR SELECT 
USING (
  operador_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid() 
    AND ur.role IN ('administrador', 'director')
  )
);