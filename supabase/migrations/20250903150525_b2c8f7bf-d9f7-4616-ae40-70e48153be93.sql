-- Limpiar y asignar rol correcto al administrador
DELETE FROM user_roles WHERE user_id = 'd2c8ee73-0823-4edd-a0ae-8fd35d694221';

-- Asignar rol de administrador al usuario admin@empresa.com
INSERT INTO user_roles (user_id, role) 
VALUES ('d2c8ee73-0823-4edd-a0ae-8fd35d694221', 'administrador');