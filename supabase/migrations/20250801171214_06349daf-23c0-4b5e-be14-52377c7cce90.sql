-- Crear tabla para historial de cambios de usuarios
CREATE TABLE public.user_change_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  changed_by UUID NOT NULL,
  change_type TEXT NOT NULL CHECK (change_type IN ('create', 'update', 'activate', 'deactivate', 'role_change', 'permissions_change')),
  old_values JSONB,
  new_values JSONB,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_change_history ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admins can view all change history" 
ON public.user_change_history 
FOR SELECT 
USING (EXISTS (
  SELECT 1
  FROM user_roles
  WHERE user_roles.user_id = auth.uid() 
  AND user_roles.role = 'administrador'::app_role
));

CREATE POLICY "Admins can insert change history" 
ON public.user_change_history 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1
  FROM user_roles
  WHERE user_roles.user_id = auth.uid() 
  AND user_roles.role = 'administrador'::app_role
));

-- Create function to track user changes
CREATE OR REPLACE FUNCTION public.log_user_change(
  p_user_id UUID,
  p_change_type TEXT,
  p_old_values JSONB DEFAULT NULL,
  p_new_values JSONB DEFAULT NULL,
  p_description TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE SQL
SECURITY DEFINER
AS $$
  INSERT INTO public.user_change_history (
    user_id, 
    changed_by, 
    change_type, 
    old_values, 
    new_values, 
    description
  )
  VALUES (
    p_user_id,
    auth.uid(),
    p_change_type,
    p_old_values,
    p_new_values,
    p_description
  );
$$;