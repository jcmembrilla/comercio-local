-- 1. Agregamos la columna slug si no existe
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;

-- 2. Función para convertir un texto a formato URL amigable (slug)
CREATE OR REPLACE FUNCTION slugify("value" TEXT)
RETURNS TEXT AS $$
  -- removes accents (diacritics) from a given text
  WITH "unaccented" AS (
    SELECT translate("value", 'áéíóúÁÉÍÓÚñÑ', 'aeiouAEIOUnN') AS "value"
  ),
  -- lowercases the string
  "lowercased" AS (
    SELECT lower("value") AS "value"
    FROM "unaccented"
  ),
  -- replaces anything that's not a letter, number, hyphen('-'), or underscore('_') with a hyphen
  "hyphenated" AS (
    SELECT regexp_replace("value", '[^a-z0-9\\-_]+', '-', 'gi') AS "value"
    FROM "lowercased"
  ),
  -- trims hyphens('-') if they exist on the head or tail of the string
  "trimmed" AS (
    SELECT regexp_replace(regexp_replace("value", '\\-+$', ''), '^\\-', '') AS "value"
    FROM "hyphenated"
  )
  SELECT "value" FROM "trimmed";
$$ LANGUAGE SQL STRICT IMMUTABLE;

-- 3. Trigger Function para auto-generar un slug único
CREATE OR REPLACE FUNCTION generate_unique_slug()
RETURNS TRIGGER AS $$
DECLARE
  base_slug TEXT;
  new_slug TEXT;
  counter INTEGER := 1;
BEGIN
  -- Si es un INSERT, o si el nombre cambió, o si el slug está vacío
  IF NEW.nombre_emprendimiento IS NOT NULL AND (TG_OP = 'INSERT' OR NEW.nombre_emprendimiento <> OLD.nombre_emprendimiento OR NEW.slug IS NULL) THEN
    base_slug := slugify(NEW.nombre_emprendimiento);
    new_slug := base_slug;
    
    -- Manejo de colisiones: si ya existe, agregamos un número
    WHILE EXISTS (SELECT 1 FROM profiles WHERE slug = new_slug AND id != NEW.id) LOOP
      new_slug := base_slug || '-' || counter;
      counter := counter + 1;
    END LOOP;
    
    NEW.slug := new_slug;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Creamos el Trigger
DROP TRIGGER IF EXISTS trigger_generate_slug ON profiles;
CREATE TRIGGER trigger_generate_slug
BEFORE INSERT OR UPDATE ON profiles
FOR EACH ROW EXECUTE FUNCTION generate_unique_slug();

-- 5. Generar slugs para los perfiles que ya existen en la base de datos
UPDATE profiles SET nombre_emprendimiento = nombre_emprendimiento WHERE slug IS NULL;
