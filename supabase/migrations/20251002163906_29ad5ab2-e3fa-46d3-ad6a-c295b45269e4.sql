-- Insertar configuración de servicios para Coraza en octubre 2025
INSERT INTO patrullas_coraza (
  empresa_contratada_id,
  year,
  month,
  patrullas_disponibles,
  acompanamientos_disponibles,
  revistas_disponibles,
  patrullas_usadas,
  acompanamientos_usados,
  revistas_usadas
) VALUES (
  'ab265e8a-ec4c-469a-a50c-3ba6d77e339a', -- ID de Coraza
  2025,
  10, -- Octubre
  100, -- 100 patrullas disponibles
  50,  -- 50 acompañamientos disponibles
  30,  -- 30 revistas disponibles
  0,   -- 0 usadas inicialmente
  0,
  0
) ON CONFLICT DO NOTHING;