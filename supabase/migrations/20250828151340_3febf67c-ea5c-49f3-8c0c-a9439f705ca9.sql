-- Crear perfiles faltantes para usuarios que existen en auth.users pero no en profiles
-- Primero insertar los perfiles faltantes

-- Director
INSERT INTO public.profiles (id, user_id, email, full_name, active) 
SELECT 
    u.id,
    u.id,
    u.email,
    COALESCE(u.raw_user_meta_data->>'full_name', 'Director Central'),
    true
FROM auth.users u 
WHERE u.email = 'director@teleguardia.com' 
AND NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = u.id);

-- Técnico
INSERT INTO public.profiles (id, user_id, email, full_name, active) 
SELECT 
    u.id,
    u.id,
    u.email,
    COALESCE(u.raw_user_meta_data->>'full_name', 'Técnico del Sistema'),
    true
FROM auth.users u 
WHERE u.email = 'tecnico@teleguardia.com' 
AND NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = u.id);

-- Despachador
INSERT INTO public.profiles (id, user_id, email, full_name, active) 
SELECT 
    u.id,
    u.id,
    u.email,
    COALESCE(u.raw_user_meta_data->>'full_name', 'Despachador de Patrullas'),
    true
FROM auth.users u 
WHERE u.email = 'despachador@teleguardia.com' 
AND NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = u.id);

-- Asesor Ventas adicional
INSERT INTO public.profiles (id, user_id, email, full_name, active) 
SELECT 
    u.id,
    u.id,
    u.email,
    COALESCE(u.raw_user_meta_data->>'full_name', 'Asesor de Ventas'),
    true
FROM auth.users u 
WHERE u.email = 'asesorventas@teleguardia.com' 
AND NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = u.id);

-- Ahora asignar los roles faltantes usando los roles correctos del enum
INSERT INTO public.user_roles (user_id, role)
SELECT 
    u.id,
    'director'::user_role
FROM auth.users u 
WHERE u.email = 'director@teleguardia.com' 
AND NOT EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = u.id);

INSERT INTO public.user_roles (user_id, role)
SELECT 
    u.id,
    'tecnico'::user_role
FROM auth.users u 
WHERE u.email = 'tecnico@teleguardia.com' 
AND NOT EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = u.id);

INSERT INTO public.user_roles (user_id, role)
SELECT 
    u.id,
    'despachador_patrullas'::user_role
FROM auth.users u 
WHERE u.email = 'despachador@teleguardia.com' 
AND NOT EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = u.id);

INSERT INTO public.user_roles (user_id, role)
SELECT 
    u.id,
    'asesor_ventas'::user_role
FROM auth.users u 
WHERE u.email = 'asesorventas@teleguardia.com' 
AND NOT EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = u.id);