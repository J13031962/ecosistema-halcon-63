-- Crear algunos datos de prueba
INSERT INTO public.clientes (nombre, direccion, municipio, telefono, email, tipo_servicio, estado) VALUES
('EMPRESA ABC S.A.S', 'Carrera 10 # 20-30', 'Bogotá', '3001234567', 'contacto@empresaabc.com', 'Seguridad Empresarial', 'activo'),
('Juan Pérez', 'Calle 15 # 25-40', 'Medellín', '3007654321', 'juan.perez@email.com', 'Seguridad Residencial', 'activo'),
('CENTRO COMERCIAL XYZ', 'Avenida 80 # 50-60', 'Cali', '3009876543', 'gerencia@centroxyz.com', 'Seguridad Comercial', 'activo'),
('María González', 'Transversal 5 # 12-18', 'Barranquilla', '3005551234', 'maria.gonzalez@email.com', 'Seguridad Residencial', 'activo'),
('CONSTRUCTORA DEL VALLE', 'Carrera 25 # 100-15', 'Bucaramanga', '3002468135', 'info@constructoravalle.com', 'Seguridad Industrial', 'activo');

-- Crear algunas patrullas de ejemplo
INSERT INTO public.patrullas (numero_patrulla, estado, ubicacion, supervisor_nombre) VALUES
('P001', 'disponible', 'Zona Norte', 'Carlos Rodríguez'),
('P002', 'en_servicio', 'Zona Sur', 'Ana María López'),
('P003', 'disponible', 'Zona Centro', 'Miguel Ángel Torres'),
('P004', 'mantenimiento', 'Base Central', 'Luis Fernando Castro'),
('P005', 'en_servicio', 'Zona Oeste', 'Patricia Herrera');