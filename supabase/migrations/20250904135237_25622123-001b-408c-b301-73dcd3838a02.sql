-- Función para verificar y sincronizar datos del supervisor
SELECT ensure_supervisor_data_integrity();

-- Verificar que el supervisor esté correctamente configurado
SELECT 
  p.id,
  p.email, 
  p.full_name,
  p.active,
  ur.role
FROM profiles p
LEFT JOIN user_roles ur ON p.id = ur.user_id
WHERE p.email = 'supervisor@teleguardia.com';