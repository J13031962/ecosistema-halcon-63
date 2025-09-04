-- Fix the handle_new_user trigger and create initial users
-- First, create the trigger for handle_new_user function
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create initial admin users in auth.users table
-- Note: These will need to be created via Supabase Auth API, but we'll prepare the profiles
-- and roles for when they sign up

-- Ensure user_permissions table exists for granular permissions
CREATE TABLE IF NOT EXISTS public.user_permissions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  permission_key text NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on user_permissions
ALTER TABLE public.user_permissions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_permissions
CREATE POLICY "Admins can manage all permissions" 
ON public.user_permissions 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() AND ur.role = 'administrador'
  )
);

CREATE POLICY "Users can view their own permissions" 
ON public.user_permissions 
FOR SELECT 
USING (user_id = auth.uid());

-- Update profiles table to allow admin management
CREATE POLICY "Admins can manage all profiles" 
ON public.profiles 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() AND ur.role = 'administrador'
  )
);

-- Update user_roles table to allow admin management
CREATE POLICY "Admins can manage all user roles" 
ON public.user_roles 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() AND ur.role = 'administrador'
  )
);

-- Create function to get user roles (for frontend)
CREATE OR REPLACE FUNCTION public.get_user_roles(target_user_id uuid)
RETURNS SETOF public.user_roles
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT * FROM public.user_roles WHERE user_id = target_user_id;
$$;

-- Create function to check if user has specific permission
CREATE OR REPLACE FUNCTION public.has_permission(target_user_id uuid, permission_key text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_permissions 
    WHERE user_id = target_user_id AND permission_key = $2
  );
$$;