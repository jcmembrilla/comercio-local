-- Permisos para la función RPC
GRANT EXECUTE ON FUNCTION crear_perfil_registro TO anon;
GRANT EXECUTE ON FUNCTION crear_perfil_registro TO authenticated;
GRANT EXECUTE ON FUNCTION crear_perfil_registro TO service_role;

-- También debemos asegurarnos de que el SECURITY DEFINER esté bien configurado en la función
-- (Recreamos la función agregando SET search_path = public)
CREATE OR REPLACE FUNCTION crear_perfil_registro(
  user_id UUID,
  user_email TEXT,
  nombre_emprendimiento TEXT,
  categoria TEXT,
  descripcion TEXT DEFAULT '',
  whatsapp TEXT DEFAULT '',
  ciudad TEXT DEFAULT '',
  direccion TEXT DEFAULT '',
  sitio_web TEXT DEFAULT '',
  historia TEXT DEFAULT '',
  foto_logo TEXT DEFAULT '',
  foto_portada TEXT DEFAULT ''
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO profiles (
    id, email, nombre_emprendimiento, categoria, descripcion,
    whatsapp, ciudad, direccion, sitio_web, historia, foto_logo, foto_portada
  ) VALUES (
    user_id, user_email, crear_perfil_registro.nombre_emprendimiento,
    categoria, descripcion, whatsapp, ciudad, direccion,
    sitio_web, historia, foto_logo, foto_portada
  );
END;
$$;

-- Políticas de Storage para el bucket "comercio-local"
-- Asegúrate de que el bucket existe antes de correr esto:
-- insert into storage.buckets (id, name, public) values ('comercio-local', 'comercio-local', true);

-- Políticas para permitir acceso público a las imágenes
CREATE POLICY "Imágenes públicas" 
ON storage.objects FOR SELECT 
USING ( bucket_id = 'comercio-local' );

-- Políticas para permitir subida a usuarios autenticados (y al service_role implícitamente)
CREATE POLICY "Subida de imágenes autenticada" 
ON storage.objects FOR INSERT 
WITH CHECK ( bucket_id = 'comercio-local' AND (auth.uid() = (regexp_split_to_array(name, '/'))[1]::uuid) );

-- Políticas para actualizar sus propias imágenes
CREATE POLICY "Actualizar imágenes propias" 
ON storage.objects FOR UPDATE 
USING ( bucket_id = 'comercio-local' AND (auth.uid() = (regexp_split_to_array(name, '/'))[1]::uuid) );

-- Políticas para borrar sus propias imágenes
CREATE POLICY "Borrar imágenes propias" 
ON storage.objects FOR DELETE 
USING ( bucket_id = 'comercio-local' AND (auth.uid() = (regexp_split_to_array(name, '/'))[1]::uuid) );
