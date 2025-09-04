-- Fix RLS policies for profiles table to allow admins to manage user profiles

-- Drop existing policies
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can delete their own profile" ON public.profiles;

-- Create new policies that allow admins to manage all profiles
CREATE POLICY "Admins can manage all profiles" 
ON public.profiles 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 
    FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'administrador'::public.app_role
  )
);

CREATE POLICY "Users can manage their own profile" 
ON public.profiles 
FOR ALL 
USING (auth.uid() = user_id);