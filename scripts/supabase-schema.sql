-- Crear tabla de perfiles (comercios/usuarios)
-- Nota: el auth lo maneja Supabase Auth (auth.users), no esta tabla.

-- ATENCIÓN: Estas sentencias borrarán las tablas existentes para recrearlas limpias con los nuevos UUIDs.
-- Esto eliminará los datos de prueba actuales.
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  nombre_emprendimiento TEXT NOT NULL,
  categoria TEXT NOT NULL,
  descripcion TEXT DEFAULT '',
  whatsapp TEXT DEFAULT '',
  ciudad TEXT DEFAULT '',
  direccion TEXT DEFAULT '',
  lat FLOAT,
  lng FLOAT,
  foto_logo TEXT DEFAULT '',
  foto_portada TEXT DEFAULT '',
  sitio_web TEXT DEFAULT '',
  historia TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Crear tabla de productos/servicios
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  descripcion TEXT DEFAULT '',
  precio FLOAT,
  foto TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para consultas frecuentes
CREATE INDEX idx_products_profile_id ON products(profile_id);
CREATE INDEX idx_profiles_ciudad ON profiles(ciudad);

-- ==========================================
-- POLÍTICAS DE SEGURIDAD (Row Level Security)
-- ==========================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Políticas para 'profiles'
CREATE POLICY "Perfiles públicos visibles para todos" ON profiles FOR SELECT USING (true);
CREATE POLICY "Usuarios pueden insertar su propio perfil" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Usuarios pueden actualizar su propio perfil" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Usuarios pueden borrar su propio perfil" ON profiles FOR DELETE USING (auth.uid() = id);

-- Políticas para 'products'
CREATE POLICY "Productos públicos visibles para todos" ON products FOR SELECT USING (true);
CREATE POLICY "Usuarios pueden insertar sus productos" ON products FOR INSERT WITH CHECK (auth.uid() = profile_id);
CREATE POLICY "Usuarios pueden actualizar sus productos" ON products FOR UPDATE USING (auth.uid() = profile_id);
CREATE POLICY "Usuarios pueden borrar sus productos" ON products FOR DELETE USING (auth.uid() = profile_id);

-- ==========================================
-- NOTAS PARA EJECUTAR EN SUPABASE DASHBOARD
-- ==========================================

-- 1. Eliminar la columna password (ya no se usa, auth lo maneja Supabase):
-- ALTER TABLE profiles DROP COLUMN IF EXISTS password;
