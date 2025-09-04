-- Fix the user_permissions policy to only allow users to see their own permissions
DROP POLICY IF EXISTS "Users can view all permissions" ON public.user_permissions;

CREATE POLICY "Users can view their own permissions" 
ON public.user_permissions 
FOR SELECT 
TO authenticated
USING (user_id = auth.uid());