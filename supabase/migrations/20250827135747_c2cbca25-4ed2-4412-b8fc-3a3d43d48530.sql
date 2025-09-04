-- Agregar índices solo para columnas que existen
CREATE INDEX IF NOT EXISTS idx_alarmas_operador_id ON alarmas(operador_id);
CREATE INDEX IF NOT EXISTS idx_alarmas_despachador_id ON alarmas(despachador_id);
CREATE INDEX IF NOT EXISTS idx_turnos_operador_operador_id ON turnos_operador(operador_id);
CREATE INDEX IF NOT EXISTS idx_turnos_supervisor_supervisor_id ON turnos_supervisor(supervisor_id);
CREATE INDEX IF NOT EXISTS idx_supervisor_actividades_supervisor_id ON supervisor_actividades(supervisor_id);
CREATE INDEX IF NOT EXISTS idx_incidentes_supervisor_id ON incidentes(supervisor_id);
CREATE INDEX IF NOT EXISTS idx_servicios_tecnicos_tecnico_id ON servicios_tecnicos(tecnico_id);
CREATE INDEX IF NOT EXISTS idx_cotizaciones_user_id ON cotizaciones(user_id);

-- Verificar campos de la tabla alarmas y agregar los que falten
DO $$
BEGIN
    -- Agregar supervisor_id si no existe (para supervisores que atienden alarmas)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'alarmas' AND column_name = 'supervisor_id'
    ) THEN
        ALTER TABLE alarmas ADD COLUMN supervisor_id UUID;
        CREATE INDEX IF NOT EXISTS idx_alarmas_supervisor_id ON alarmas(supervisor_id);
    END IF;
END $$;

-- Crear función mejorada para verificar acceso de usuario
CREATE OR REPLACE FUNCTION has_user_access_to_data(
  user_id UUID,
  table_name TEXT,
  record_id UUID
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_role TEXT;
  has_access BOOLEAN := FALSE;
BEGIN
  -- Obtener el rol del usuario
  SELECT role INTO user_role
  FROM user_roles 
  WHERE user_roles.user_id = has_user_access_to_data.user_id
  LIMIT 1;
  
  -- Los administradores tienen acceso a todo
  IF user_role = 'administrador' THEN
    RETURN TRUE;
  END IF;
  
  -- Lógica específica por tabla y rol
  CASE table_name
    WHEN 'alarmas' THEN
      CASE user_role
        WHEN 'operador_alarmas' THEN
          SELECT EXISTS(SELECT 1 FROM alarmas WHERE id = record_id AND operador_id = has_user_access_to_data.user_id) INTO has_access;
        WHEN 'despachador_patrullas' THEN
          SELECT EXISTS(SELECT 1 FROM alarmas WHERE id = record_id AND despachador_id = has_user_access_to_data.user_id) INTO has_access;
        WHEN 'supervisor_motorizado' THEN
          SELECT EXISTS(SELECT 1 FROM alarmas WHERE id = record_id AND (supervisor_id = has_user_access_to_data.user_id OR supervisor = (SELECT full_name FROM profiles WHERE user_id = has_user_access_to_data.user_id))) INTO has_access;
      END CASE;
    WHEN 'turnos_operador' THEN
      IF user_role = 'operador_alarmas' THEN
        SELECT EXISTS(SELECT 1 FROM turnos_operador WHERE id = record_id AND operador_id = has_user_access_to_data.user_id) INTO has_access;
      END IF;
    WHEN 'turnos_supervisor' THEN
      IF user_role = 'supervisor_motorizado' THEN
        SELECT EXISTS(SELECT 1 FROM turnos_supervisor WHERE id = record_id AND supervisor_id = has_user_access_to_data.user_id) INTO has_access;
      END IF;
  END CASE;
  
  RETURN has_access;
END;
$$;