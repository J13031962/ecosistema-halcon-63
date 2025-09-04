-- Verificar que hay servicios y asignar al usuario técnico actual si existe
DO $$
DECLARE
  tecnico_user_id uuid;
BEGIN
  -- Buscar un usuario con rol técnico
  SELECT user_id INTO tecnico_user_id 
  FROM public.user_roles 
  WHERE role = 'tecnico' 
  LIMIT 1;
  
  -- Si existe un técnico, asignar los servicios
  IF tecnico_user_id IS NOT NULL THEN
    UPDATE public.servicios_tecnicos_asignados 
    SET tecnico_id = tecnico_user_id;
    
    RAISE NOTICE 'Servicios asignados al técnico: %', tecnico_user_id;
  ELSE
    RAISE NOTICE 'No se encontró usuario con rol técnico';
  END IF;
END $$;

-- Verificar que los servicios estén asignados correctamente
SELECT 
  id,
  cliente_razon_social,
  motivo_servicio,
  tecnico_tipo,
  tecnico_id,
  estado
FROM public.servicios_tecnicos_asignados;