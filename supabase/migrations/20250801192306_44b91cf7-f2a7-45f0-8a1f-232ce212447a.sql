-- Fix remaining RLS issues
-- Enable RLS on system_functions table
ALTER TABLE public.system_functions ENABLE ROW LEVEL SECURITY;