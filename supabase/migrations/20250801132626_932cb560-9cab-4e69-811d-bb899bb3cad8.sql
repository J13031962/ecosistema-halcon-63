-- Create app_role enum
CREATE TYPE public.app_role AS ENUM (
  'administrador',
  'director', 
  'operador_alarmas',
  'despachador_patrullas',
  'supervisor',
  'tecnico',
  'jefe_tecnicos',
  'asesor_ventas'
);

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  last_login TIMESTAMP WITH TIME ZONE
);

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function for role checking
CREATE OR REPLACE FUNCTION public.get_user_roles(user_uuid UUID DEFAULT auth.uid())
RETURNS public.app_role[]
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT ARRAY_AGG(role) 
  FROM public.user_roles 
  WHERE user_id = user_uuid;
$$;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);

-- Insert test users
INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, role, aud)
VALUES
  -- Password for all: halcon123
  ('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000000', 'admin@halcon.com', '$2a$10$zQvpVJZx3KvY7DL/d5GvzeKzm3.d1aP1Z6L3T0A.L5K6jJ9U7V8WS', now(), now(), now(), '{}', '{"full_name": "Administrator HALCON"}', false, 'authenticated', 'authenticated'),
  ('22222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000000', 'director@halcon.com', '$2a$10$zQvpVJZx3KvY7DL/d5GvzeKzm3.d1aP1Z6L3T0A.L5K6jJ9U7V8WS', now(), now(), now(), '{}', '{"full_name": "Director HALCON"}', false, 'authenticated', 'authenticated'),
  ('33333333-3333-3333-3333-333333333333', '00000000-0000-0000-0000-000000000000', 'operador@halcon.com', '$2a$10$zQvpVJZx3KvY7DL/d5GvzeKzm3.d1aP1Z6L3T0A.L5K6jJ9U7V8WS', now(), now(), now(), '{}', '{"full_name": "Operador Alarmas"}', false, 'authenticated', 'authenticated'),
  ('44444444-4444-4444-4444-444444444444', '00000000-0000-0000-0000-000000000000', 'despachador@halcon.com', '$2a$10$zQvpVJZx3KvY7DL/d5GvzeKzm3.d1aP1Z6L3T0A.L5K6jJ9U7V8WS', now(), now(), now(), '{}', '{"full_name": "Despachador Patrullas"}', false, 'authenticated', 'authenticated'),
  ('55555555-5555-5555-5555-555555555555', '00000000-0000-0000-0000-000000000000', 'supervisor@teleguardia.com', '$2a$10$zQvpVJZx3KvY7DL/d5GvzeKzm3.d1aP1Z6L3T0A.L5K6jJ9U7V8WS', now(), now(), now(), '{}', '{"full_name": "supervisor"}', false, 'authenticated', 'authenticated'),
  ('66666666-6666-6666-6666-666666666666', '00000000-0000-0000-0000-000000000000', 'tecnico@halcon.com', '$2a$10$zQvpVJZx3KvY7DL/d5GvzeKzm3.d1aP1Z6L3T0A.L5K6jJ9U7V8WS', now(), now(), now(), '{}', '{"full_name": "Técnico HALCON"}', false, 'authenticated', 'authenticated'),
  ('77777777-7777-7777-7777-777777777777', '00000000-0000-0000-0000-000000000000', 'jefe.tecnicos@halcon.com', '$2a$10$zQvpVJZx3KvY7DL/d5GvzeKzm3.d1aP1Z6L3T0A.L5K6jJ9U7V8WS', now(), now(), now(), '{}', '{"full_name": "Jefe Técnicos"}', false, 'authenticated', 'authenticated'),
  ('88888888-8888-8888-8888-888888888888', '00000000-0000-0000-0000-000000000000', 'asesor@halcon.com', '$2a$10$zQvpVJZx3KvY7DL/d5GvzeKzm3.d1aP1Z6L3T0A.L5K6jJ9U7V8WS', now(), now(), now(), '{}', '{"full_name": "Asesor Ventas"}', false, 'authenticated', 'authenticated');

-- Insert profiles
INSERT INTO public.profiles (user_id, email, full_name)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'admin@halcon.com', 'Administrator HALCON'),
  ('22222222-2222-2222-2222-222222222222', 'director@halcon.com', 'Director HALCON'),
  ('33333333-3333-3333-3333-333333333333', 'operador@halcon.com', 'Operador Alarmas'),
  ('44444444-4444-4444-4444-444444444444', 'despachador@halcon.com', 'Despachador Patrullas'),
  ('55555555-5555-5555-5555-555555555555', 'supervisor@teleguardia.com', 'supervisor'),
  ('66666666-6666-6666-6666-666666666666', 'tecnico@halcon.com', 'Técnico HALCON'),
  ('77777777-7777-7777-7777-777777777777', 'jefe.tecnicos@halcon.com', 'Jefe Técnicos'),
  ('88888888-8888-8888-8888-888888888888', 'asesor@halcon.com', 'Asesor Ventas');

-- Insert user roles
INSERT INTO public.user_roles (user_id, role)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'administrador'),
  ('22222222-2222-2222-2222-222222222222', 'director'),
  ('33333333-3333-3333-3333-333333333333', 'operador_alarmas'),
  ('44444444-4444-4444-4444-444444444444', 'despachador_patrullas'),
  ('55555555-5555-5555-5555-555555555555', 'supervisor_motorizado'),
  ('66666666-6666-6666-6666-666666666666', 'tecnico'),
  ('77777777-7777-7777-7777-777777777777', 'jefe_tecnicos'),
  ('88888888-8888-8888-8888-888888888888', 'asesor_ventas');