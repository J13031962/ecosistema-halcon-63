-- Create table for real-time supervisor locations
CREATE TABLE public.supervisor_ubicaciones_tiempo_real (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  supervisor_id UUID NOT NULL,
  alarma_id UUID NOT NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  precision_meters INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add index for efficient queries
CREATE INDEX idx_supervisor_ubicaciones_supervisor_id ON public.supervisor_ubicaciones_tiempo_real(supervisor_id);
CREATE INDEX idx_supervisor_ubicaciones_alarma_id ON public.supervisor_ubicaciones_tiempo_real(alarma_id);
CREATE INDEX idx_supervisor_ubicaciones_created_at ON public.supervisor_ubicaciones_tiempo_real(created_at DESC);

-- Enable RLS
ALTER TABLE public.supervisor_ubicaciones_tiempo_real ENABLE ROW LEVEL SECURITY;

-- Create policies for real-time locations
CREATE POLICY "Supervisores pueden insertar sus ubicaciones" 
ON public.supervisor_ubicaciones_tiempo_real 
FOR INSERT 
WITH CHECK (supervisor_id = auth.uid());

CREATE POLICY "Supervisores pueden ver sus propias ubicaciones" 
ON public.supervisor_ubicaciones_tiempo_real 
FOR SELECT 
USING (supervisor_id = auth.uid());

CREATE POLICY "Operativos pueden ver todas las ubicaciones" 
ON public.supervisor_ubicaciones_tiempo_real 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM user_roles ur
  WHERE ur.user_id = auth.uid() 
  AND ur.role = ANY (ARRAY['administrador'::user_role, 'director'::user_role, 'despachador_patrullas'::user_role, 'operador_alarmas'::user_role])
));

-- Create trigger for updated_at
CREATE TRIGGER update_supervisor_ubicaciones_tiempo_real_updated_at
BEFORE UPDATE ON public.supervisor_ubicaciones_tiempo_real
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for this table
ALTER publication supabase_realtime ADD TABLE public.supervisor_ubicaciones_tiempo_real;