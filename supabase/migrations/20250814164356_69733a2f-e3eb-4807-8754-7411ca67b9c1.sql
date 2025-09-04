-- Drop the problematic policies that cause infinite recursion
DROP POLICY IF EXISTS "Admins can manage all user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can manage all permissions" ON public.user_permissions;

-- Create a security definer function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin_user(user_id_param uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = user_id_param AND role = 'administrador'
  );
$$;

-- Create simple policies for user_roles that don't cause recursion
CREATE POLICY "Users can view their own roles" 
ON public.user_roles 
FOR SELECT 
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own roles" 
ON public.user_roles 
FOR INSERT 
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Create admin policies using the security definer function
CREATE POLICY "Admins can manage all user roles via function" 
ON public.user_roles 
FOR ALL 
TO authenticated
USING (public.is_admin_user(auth.uid()));

-- Fix profiles policies
CREATE POLICY "Admins can manage all profiles via function" 
ON public.profiles 
FOR ALL 
TO authenticated
USING (public.is_admin_user(auth.uid()));

CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (user_id = auth.uid());

-- Fix user_permissions policies
CREATE POLICY "Admins can manage all permissions via function" 
ON public.user_permissions 
FOR ALL 
TO authenticated
USING (public.is_admin_user(auth.uid()));

CREATE POLICY "Users can view their own permissions" 
ON public.user_permissions 
FOR SELECT 
TO authenticated
USING (user_id = auth.uid());