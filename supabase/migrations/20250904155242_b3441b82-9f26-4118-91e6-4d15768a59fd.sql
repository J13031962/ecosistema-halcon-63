-- Actualizar alarmas asignadas a estado en_proceso para test
UPDATE alarmas 
SET estado = 'en_proceso'
WHERE supervisor_id IS NOT NULL 
AND estado = 'asignada';