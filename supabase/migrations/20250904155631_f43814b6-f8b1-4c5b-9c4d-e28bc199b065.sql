-- Asignar manualmente la alarma más reciente de pánico al supervisor3@teleguardia.com
UPDATE alarmas 
SET 
  supervisor_id = 'f9a2c390-7625-408b-9d65-f97ecb1f51eb',
  supervisor = 'rfdjlfsf', 
  patrulla_asignada = 'PAT-SUP3-TEST',
  estado = 'en_proceso',
  tiempo_asignacion = NOW()
WHERE id = 'ce255093-c2ed-49e2-834d-89fb9c49f1d5';