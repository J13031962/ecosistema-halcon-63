-- Create a test alarm for supervisor3 to test QR functionality
INSERT INTO public.alarmas (
  cliente_id,
  tipo,
  estado,
  prioridad,
  descripcion,
  direccion,
  municipio,
  supervisor_id,
  supervisor,
  patrulla_asignada
) VALUES (
  (SELECT id FROM clientes LIMIT 1), -- Use first available client
  'Prueba QR Supervisor3',
  'en_proceso',
  'alta',
  'Alarma de prueba para verificar funcionalidad QR del supervisor3',
  'Calle 15 # 25-40',
  'Medellín',
  'f9a2c390-7625-408b-9d65-f97ecb1f51eb', -- supervisor3 ID
  'rfdjlfsf', -- supervisor3 name
  'PAT-SUP3-QR-TEST'
);