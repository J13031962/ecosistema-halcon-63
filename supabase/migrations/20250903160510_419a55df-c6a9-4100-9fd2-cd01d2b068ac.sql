-- Configurar políticas RLS definitivas para sistema en cascada

-- Eliminar y recrear políticas para servicios técnicos
DROP POLICY IF EXISTS "Jefe técnicos puede crear servicios asignados" ON servicios_tecnicos_asignados;
DROP POLICY IF EXISTS "Jefe técnicos puede ver todos los servicios" ON servicios_tecnicos_asignados;
DROP POLICY IF EXISTS "Jefe técnicos puede actualizar servicios" ON servicios_tecnicos_asignados;

-- Políticas para servicios técnicos
CREATE POLICY "Jefe tecnicos insertar servicios" 
ON servicios_tecnicos_asignados FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid() 
    AND ur.role IN ('administrador'::user_role, 'jefe_tecnicos'::user_role)
  )
);

CREATE POLICY "Jefe tecnicos ver servicios" 
ON servicios_tecnicos_asignados FOR SELECT 
USING (
  tecnico_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid() 
    AND ur.role IN ('administrador'::user_role, 'jefe_tecnicos'::user_role)
  )
);

CREATE POLICY "Jefe tecnicos actualizar servicios" 
ON servicios_tecnicos_asignados FOR UPDATE 
USING (
  tecnico_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid() 
    AND ur.role IN ('administrador'::user_role, 'jefe_tecnicos'::user_role)
  )
);

-- Eliminar políticas conflictivas de alarmas
DROP POLICY IF EXISTS "Operadores pueden crear alarmas" ON alarmas;
DROP POLICY IF EXISTS "Despachadores pueden actualizar alarmas" ON alarmas;
DROP POLICY IF EXISTS "Sistema cascada visualización alarmas" ON alarmas;
DROP POLICY IF EXISTS "Supervisores pueden actualizar sus alarmas" ON alarmas;

-- Nuevas políticas para alarmas con sistema en cascada
CREATE POLICY "Operadores crear alarmas" 
ON alarmas FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid() 
    AND ur.role IN ('administrador'::user_role, 'operador_alarmas'::user_role)
  )
);

CREATE POLICY "Visualización alarmas cascada" 
ON alarmas FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid() 
    AND ur.role IN ('administrador'::user_role, 'director'::user_role, 'operador_alarmas'::user_role, 'despachador_patrullas'::user_role)
  ) OR
  supervisor_id = auth.uid() OR 
  supervisor = (SELECT full_name FROM profiles WHERE user_id = auth.uid())
);

CREATE POLICY "Actualización alarmas cascada" 
ON alarmas FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid() 
    AND ur.role IN ('administrador'::user_role, 'despachador_patrullas'::user_role)
  ) OR
  supervisor_id = auth.uid() OR 
  supervisor = (SELECT full_name FROM profiles WHERE user_id = auth.uid())
);

-- Políticas para incidentes
DROP POLICY IF EXISTS "Supervisores pueden crear incidentes" ON incidentes;
DROP POLICY IF EXISTS "Usuarios pueden ver incidentes relevantes" ON incidentes;

CREATE POLICY "Supervisores crear incidentes" 
ON incidentes FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid() 
    AND ur.role IN ('administrador'::user_role, 'supervisor_motorizado'::user_role)
  )
);

CREATE POLICY "Ver incidentes cascada" 
ON incidentes FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid() 
    AND ur.role IN ('administrador'::user_role, 'director'::user_role, 'despachador_patrullas'::user_role, 'operador_alarmas'::user_role)
  ) OR
  supervisor_id = auth.uid()
);

-- Políticas para actividades de supervisor
DROP POLICY IF EXISTS "Supervisores pueden crear actividades" ON supervisor_actividades;
DROP POLICY IF EXISTS "Usuarios pueden ver actividades relevantes" ON supervisor_actividades;

CREATE POLICY "Supervisores crear actividades" 
ON supervisor_actividades FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid() 
    AND ur.role IN ('administrador'::user_role, 'supervisor_motorizado'::user_role)
  )
);

CREATE POLICY "Ver actividades cascada" 
ON supervisor_actividades FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid() 
    AND ur.role IN ('administrador'::user_role, 'director'::user_role, 'despachador_patrullas'::user_role, 'operador_alarmas'::user_role)
  ) OR
  supervisor_id = auth.uid()
);

-- Políticas para turnos de operador
DROP POLICY IF EXISTS "Solo administradores pueden gestionar turnos operador" ON turnos_operador;
DROP POLICY IF EXISTS "Operadores pueden ver sus turnos" ON turnos_operador;

CREATE POLICY "Admins gestionar turnos operador" 
ON turnos_operador FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid() 
    AND ur.role = 'administrador'::user_role
  )
) 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid() 
    AND ur.role = 'administrador'::user_role
  )
);

CREATE POLICY "Operadores ver turnos propios" 
ON turnos_operador FOR SELECT 
USING (
  operador_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid() 
    AND ur.role IN ('administrador'::user_role, 'director'::user_role)
  )
);