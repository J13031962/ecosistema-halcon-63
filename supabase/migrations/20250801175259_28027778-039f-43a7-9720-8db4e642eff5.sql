-- Insertar funciones del sistema de ejemplo para diferentes roles
INSERT INTO public.system_functions (function_key, function_name, description, category, role_origin, url, icon) VALUES
-- Funciones de Administrador
('admin_users', 'Gestión de Usuarios', 'Crear, editar y eliminar usuarios del sistema', 'Administración', 'administrador', '/usuarios', 'Users'),
('admin_roles', 'Gestión de Roles', 'Configurar roles y permisos del sistema', 'Administración', 'administrador', '/roles', 'Shield'),
('admin_config', 'Configuración Sistema', 'Configuración general del sistema', 'Administración', 'administrador', '/configuracion', 'Settings'),

-- Funciones de Director
('reports_executive', 'Reportes Ejecutivos', 'Generar y ver reportes ejecutivos', 'Reportes', 'director', '/reportes-ejecutivos', 'BarChart'),
('analysis_advanced', 'Análisis Avanzado', 'Análisis avanzado de datos', 'Análisis', 'director', '/analisis', 'TrendingUp'),
('general_status', 'Estado General', 'Ver estado general del sistema', 'Monitoreo', 'director', '/estado-general', 'Activity'),

-- Funciones de Operador de Alarmas
('alarms_central', 'Central de Alarmas', 'Gestión central de alarmas', 'Operaciones', 'operador_alarmas', '/central-alarmas', 'AlertTriangle'),
('alarms_management', 'Gestión de Alarmas', 'Gestionar alarmas del sistema', 'Operaciones', 'operador_alarmas', '/alarmas', 'Bell'),

-- Funciones de Despachador de Patrullas
('patrols_active', 'Patrullas Activas', 'Monitoreo de patrullas activas', 'Patrullas', 'despachador_patrullas', '/patrullas-activas', 'MapPin'),
('patrols_dispatch', 'Despacho de Patrullas', 'Asignar y despachar patrullas', 'Patrullas', 'despachador_patrullas', '/patrullas', 'Car'),

-- Funciones de Supervisor
('my_patrol', 'Mi Patrulla', 'Gestión de mi patrulla asignada', 'Patrullas', 'supervisor_motorizado', '/mi-patrulla', 'Navigation'),
('patrol_radio', 'Radio Patrulla', 'Comunicación por radio', 'Comunicaciones', 'supervisor_motorizado', '/radio', 'Radio'),

-- Funciones de Técnico
('inventory_management', 'Gestión de Inventario', 'Administrar inventario de materiales', 'Inventario', 'tecnico', '/inventario', 'Package'),
('material_entry', 'Ingreso de Material', 'Registrar entrada de materiales', 'Inventario', 'tecnico', '/ingresar-material', 'PackagePlus'),
('locations_management', 'Gestión de Ubicaciones', 'Administrar ubicaciones', 'Configuración', 'tecnico', '/ubicaciones', 'MapPin'),

-- Funciones de Jefe de Técnicos
('personnel_management', 'Gestión de Personal', 'Administrar personal técnico', 'Personal', 'jefe_tecnicos', '/personal', 'Users'),
('shift_management', 'Gestión de Turnos', 'Administrar turnos de trabajo', 'Personal', 'jefe_tecnicos', '/gestion-turnos', 'Clock'),
('assignments', 'Asignaciones', 'Gestionar asignaciones de trabajo', 'Personal', 'jefe_tecnicos', '/asignaciones', 'UserCheck'),

-- Funciones de Asesor de Ventas
('client_entry', 'Ingreso de Clientes', 'Registrar nuevos clientes', 'Ventas', 'asesor_ventas', '/ingresar-clientes', 'UserPlus'),
('quotable_elements', 'Elementos Cotizables', 'Gestionar elementos para cotización', 'Ventas', 'asesor_ventas', '/elementos-cotizables', 'DollarSign'),
('generate_quotes', 'Generar Cotizaciones', 'Crear cotizaciones para clientes', 'Ventas', 'asesor_ventas', '/generar-cotizaciones', 'FileText');