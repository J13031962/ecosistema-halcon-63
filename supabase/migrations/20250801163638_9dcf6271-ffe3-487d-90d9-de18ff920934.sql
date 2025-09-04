-- Crear tabla de funciones/permisos disponibles
CREATE TABLE public.system_functions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  function_key text NOT NULL UNIQUE,
  function_name text NOT NULL,
  description text,
  category text NOT NULL,
  role_origin text NOT NULL, -- El rol al que originalmente pertenece esta función
  url text NOT NULL,
  icon text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Crear tabla de permisos de usuario
CREATE TABLE public.user_permissions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  function_key text NOT NULL REFERENCES public.system_functions(function_key) ON DELETE CASCADE,
  granted_by uuid, -- ID del administrador que otorgó el permiso
  granted_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, function_key)
);

-- Habilitar RLS en las nuevas tablas
ALTER TABLE public.system_functions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_permissions ENABLE ROW LEVEL SECURITY;

-- Políticas para system_functions (los administradores pueden ver y gestionar todas)
CREATE POLICY "Admins can manage all functions" 
ON public.system_functions 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.user_roles 
  WHERE user_id = auth.uid() AND role = 'administrador'
));

-- Políticas para user_permissions
CREATE POLICY "Admins can manage all permissions" 
ON public.user_permissions 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.user_roles 
  WHERE user_id = auth.uid() AND role = 'administrador'
));

CREATE POLICY "Users can view their own permissions" 
ON public.user_permissions 
FOR SELECT 
USING (auth.uid() = user_id);

-- Insertar las funciones del sistema basadas en el menú actual
INSERT INTO public.system_functions (function_key, function_name, description, category, role_origin, url, icon) VALUES
-- Funciones de Administrador
('dashboard', 'Dashboard Principal', 'Acceso al panel principal de administración', 'Panel Administrador', 'administrador', '/dashboard', 'Home'),
('usuarios', 'Gestión de Usuarios', 'Crear, editar y eliminar usuarios del sistema', 'Panel Administrador', 'administrador', '/usuarios', 'Users'),
('configuracion', 'Configuración Sistema', 'Configurar parámetros del sistema', 'Panel Administrador', 'administrador', '/configuracion', 'Settings'),

-- Funciones de Director
('reportes_ejecutivos', 'Reportes Ejecutivos', 'Ver reportes ejecutivos y estadísticas', 'Funciones Director', 'director', '/reportes-ejecutivos', 'BarChart3'),
('analisis', 'Análisis Avanzado', 'Análisis avanzado de datos', 'Funciones Director', 'director', '/analisis', 'FileText'),
('estado_general', 'Estado General', 'Vista general del estado del sistema', 'Funciones Director', 'director', '/estado-general', 'Shield'),
('personal', 'Gestión Personal', 'Gestionar personal de la empresa', 'Funciones Director', 'director', '/personal', 'Users'),
('gestion_turnos', 'Gestión de Turnos', 'Administrar turnos de trabajo', 'Funciones Director', 'director', '/gestion-turnos', 'Clock'),
('ingresar_clientes', 'Ingresar Clientes', 'Registrar nuevos clientes', 'Funciones Director', 'director', '/ingresar-clientes', 'UserPlus'),

-- Funciones de Operador Alarmas
('central_alarmas', 'Central de Alarmas', 'Monitorear y gestionar alarmas', 'Funciones Operador Alarmas', 'operador_alarmas', '/central-alarmas', 'AlertTriangle'),
('radio', 'Radio Comunicaciones', 'Sistema de radio comunicaciones', 'Funciones Operador Alarmas', 'operador_alarmas', '/radio', 'Radio'),
('eventos', 'Registro Eventos', 'Registrar eventos del sistema', 'Funciones Operador Alarmas', 'operador_alarmas', '/eventos', 'Clock'),
('llamadas', 'Registro Llamadas', 'Registrar llamadas recibidas', 'Funciones Operador Alarmas', 'operador_alarmas', '/llamadas', 'Phone'),

-- Funciones de Despachador
('patrullas_activas', 'Patrullas Activas', 'Monitorear patrullas activas', 'Funciones Despachador', 'despachador_patrullas', '/patrullas-activas', 'Car'),
('asignaciones', 'Asignaciones', 'Asignar rutas y tareas', 'Funciones Despachador', 'despachador_patrullas', '/asignaciones', 'MapPin'),
('coordinacion', 'Coordinación', 'Coordinar operaciones', 'Funciones Despachador', 'despachador_patrullas', '/coordinacion', 'Phone'),

-- Funciones de Supervisor
('mi_patrulla', 'Mi Patrulla', 'Gestionar mi patrulla asignada', 'Funciones Supervisor', 'supervisor_motorizado', '/mi-patrulla', 'Car'),
('rutas', 'Rutas Asignadas', 'Ver rutas asignadas', 'Funciones Supervisor', 'supervisor_motorizado', '/rutas', 'MapPin'),
('incidentes', 'Registro Incidentes', 'Registrar incidentes', 'Funciones Supervisor', 'supervisor_motorizado', '/incidentes', 'AlertTriangle'),
('actividades', 'Registro Actividades', 'Registrar actividades diarias', 'Funciones Supervisor', 'supervisor_motorizado', '/actividades', 'Clock'),

-- Funciones de Técnicos
('mantenimiento', 'Mantenimiento', 'Gestionar mantenimiento de equipos', 'Funciones Técnicos', 'tecnico', '/mantenimiento', 'Wrench'),
('soporte', 'Soporte Técnico', 'Brindar soporte técnico', 'Funciones Técnicos', 'tecnico', '/soporte', 'Settings'),

-- Funciones de Ventas
('clientes', 'Gestión Clientes', 'Gestionar cartera de clientes', 'Funciones Ventas', 'asesor_ventas', '/clientes', 'Users'),
('ventas', 'Reportes Ventas', 'Ver reportes de ventas', 'Funciones Ventas', 'asesor_ventas', '/ventas', 'DollarSign'),
('generar_cotizaciones', 'Generar Cotizaciones', 'Crear y gestionar cotizaciones', 'Funciones Ventas', 'asesor_ventas', '/generar-cotizaciones', 'FileSignature'),

-- Funciones de Inventario
('inventario', 'Inventario General', 'Gestionar inventario de la empresa', 'Gestión Inventario', 'administrador', '/inventario', 'Package'),
('ingresar_material', 'Ingresar Material', 'Registrar nuevo material/equipo', 'Gestión Inventario', 'administrador', '/ingresar-material', 'Package'),

-- Funciones de Monitoreo General
('alarmas', 'Todas las Alarmas', 'Ver todas las alarmas del sistema', 'Monitoreo General', 'administrador', '/alarmas', 'AlertTriangle'),
('patrullas', 'Todas las Patrullas', 'Ver todas las patrullas', 'Monitoreo General', 'administrador', '/patrullas', 'Car'),
('ubicaciones', 'Todas las Ubicaciones', 'Ver todas las ubicaciones', 'Monitoreo General', 'administrador', '/ubicaciones', 'MapPin'),
('reportes', 'Reportes Generales', 'Ver reportes generales', 'Monitoreo General', 'administrador', '/reportes', 'FileText');

-- Función para verificar si un usuario tiene un permiso específico
CREATE OR REPLACE FUNCTION public.has_permission(user_uuid uuid, permission_key text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  -- Verificar si tiene el permiso específico asignado
  SELECT EXISTS (
    SELECT 1 
    FROM public.user_permissions up
    WHERE up.user_id = user_uuid 
    AND up.function_key = permission_key
  )
  OR
  -- O si su rol principal incluye esa función
  EXISTS (
    SELECT 1 
    FROM public.user_roles ur
    JOIN public.system_functions sf ON sf.role_origin = ur.role::text
    WHERE ur.user_id = user_uuid 
    AND sf.function_key = permission_key
  );
$$;