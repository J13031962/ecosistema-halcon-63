-- Crear una alarma de prueba con información de zona
INSERT INTO alarmas (
  cliente_id, 
  tipo, 
  estado, 
  prioridad, 
  descripcion, 
  direccion, 
  municipio,
  numero_zona,
  nombre_zona,
  tipo_sensor,
  operador_nombre,
  created_at
) VALUES (
  '0ef0ab83-c94a-460a-bbc3-5f8126bbd032',
  'Fuego',
  'activa',
  'alta',
  'Detección de humo en zona principal - Alarma de prueba con información de zona',
  'Carrera 25 # 100-15',
  'Cali',
  'Z-001',
  'Sala Principal',
  'Detector de Humo',
  'Operador Central',
  NOW()
);