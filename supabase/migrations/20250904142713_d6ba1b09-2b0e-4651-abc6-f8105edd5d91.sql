-- Agregar roles faltantes al enum user_role
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'tecnico_propio';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'tecnico_externo';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'director_tecnico';