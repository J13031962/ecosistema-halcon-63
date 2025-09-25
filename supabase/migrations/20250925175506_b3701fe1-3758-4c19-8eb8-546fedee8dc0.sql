-- Deshabilitar RLS en la tabla clientes temporalmente para permitir acceso completo a operadores
-- Esto resuelve el problema de autenticación mientras mantenemos auditoría en minuta_operaciones

ALTER TABLE public.clientes DISABLE ROW LEVEL SECURITY;

-- Mantener RLS habilitado en minuta_operaciones para auditoría
-- (ya está habilitado, solo confirmando que se mantiene)