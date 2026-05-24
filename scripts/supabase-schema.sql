-- Crear tabla de perfiles (comercios/usuarios)
-- Nota: el auth lo maneja Supabase Auth (auth.users), no esta tabla.
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
  id TEXT PRIMARY KEY,
  profile_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  descripcion TEXT DEFAULT '',
  precio FLOAT,
  foto TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Crear tabla de calificaciones (solo estrellas, sin comentarios)
CREATE TABLE ratings (
  id TEXT PRIMARY KEY,
  profile_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para consultas frecuentes
CREATE INDEX idx_products_profile_id ON products(profile_id);
CREATE INDEX idx_ratings_profile_id ON ratings(profile_id);
