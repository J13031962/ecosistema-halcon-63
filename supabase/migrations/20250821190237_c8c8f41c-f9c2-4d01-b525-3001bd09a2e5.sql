-- Primero actualizar los profiles para incluir foto y número de documento
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS foto_url TEXT,
ADD COLUMN IF NOT EXISTS numero_documento TEXT;

-- Crear bucket para fotos de usuarios si no existe
INSERT INTO storage.buckets (id, name, public) 
VALUES ('user-photos', 'user-photos', false)
ON CONFLICT (id) DO NOTHING;

-- Políticas para fotos de usuarios
CREATE POLICY "Usuarios pueden ver sus propias fotos" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'user-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Usuarios pueden subir sus propias fotos" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'user-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Usuarios pueden actualizar sus propias fotos" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'user-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Usuarios pueden eliminar sus propias fotos" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'user-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Permitir que administradores vean todas las fotos
CREATE POLICY "Administradores pueden ver todas las fotos" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'user-photos' AND is_admin_user(auth.uid()));

-- Permitir que administradores gestionen todas las fotos
CREATE POLICY "Administradores pueden gestionar todas las fotos" 
ON storage.objects 
FOR ALL 
USING (bucket_id = 'user-photos' AND is_admin_user(auth.uid()));