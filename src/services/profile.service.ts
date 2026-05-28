import { supabase } from '../utils/supabase'
import type {
  PerfilComercio,
  Producto,
  CategoriaRubro
} from '../utils/constants'
import { CATEGORIAS } from '../utils/constants'
import type { ProfileRow, ProductRow } from '../utils/database.types'
import { procesarImagen } from '../utils/images'
import { traducirError } from './error.service'

const STORAGE_KEYS = {
  LAST_CITY: 'comercio_local_last_city_v2'
}

// Flag para recordar si la columna `slug` existe en la base de datos.
let dbHasSlugColumn: boolean | null = null

export function isCategoriaRubro(value: unknown): value is CategoriaRubro {
  return (
    typeof value === 'string' && CATEGORIAS.some((cat) => cat.value === value)
  )
}

export function validarCategoriaRubro(value: unknown): CategoriaRubro | null {
  return isCategoriaRubro(value) ? value : null
}

export function mapRowToProducto(row: ProductRow): Producto {
  return {
    id: row.id,
    titulo: row.titulo,
    descripcion: row.descripcion || '',
    precio: row.precio ?? undefined,
    foto: row.foto || ''
  }
}

export function mapRowToPerfil(row: ProfileRow): PerfilComercio {
  const categoria = isCategoriaRubro(row.categoria) ? row.categoria : 'otros'

  if (categoria === 'otros' && row.categoria !== 'otros') {
    console.warn(
      `Categoria inválida para el perfil ${row.id}: "${row.categoria}". Usando fallback "otros".`
    )
  }

  return {
    id: row.id,
    slug: row.slug || undefined,
    email: row.email || '',
    nombreEmprendimiento: row.nombre_emprendimiento,
    categoria,
    descripcion: row.descripcion || '',
    whatsapp: row.whatsapp || '',
    ciudad: row.ciudad || '',
    direccion: row.direccion || '',
    lat: row.lat,
    lng: row.lng,
    sitioWeb: row.sitio_web || '',
    historia: row.historia || '',
    fotoLogo: row.foto_logo || '',
    fotoPortada: row.foto_portada || '',
    productos: (row.products || []).map(mapRowToProducto)
  }
}

export async function obtenerPublicaciones(
  ciudadFiltro?: string
): Promise<PerfilComercio[]> {
  const selectWithSlug =
    'id, slug, nombre_emprendimiento, categoria, descripcion, whatsapp, ciudad, direccion, lat, lng, foto_logo, foto_portada, sitio_web, historia, created_at, products(*)'
  const selectWithoutSlug =
    'id, nombre_emprendimiento, categoria, descripcion, whatsapp, ciudad, direccion, lat, lng, foto_logo, foto_portada, sitio_web, historia, created_at, products(*)'

  const makeQuery = (includeSlug: boolean, ciudad?: string) => {
    if (includeSlug) {
      let q = supabase
        .from('profiles')
        .select(selectWithSlug)
        .order('created_at', { ascending: false })
      if (ciudad) q = q.eq('ciudad', ciudad)
      return q
    }

    let q = supabase
      .from('profiles')
      .select(selectWithoutSlug)
      .order('created_at', { ascending: false })
    if (ciudad) q = q.eq('ciudad', ciudad)
    return q
  }

  // Intentar usar slug si no sabemos lo contrario
  const includeSlug = dbHasSlugColumn !== false
  let res = await makeQuery(includeSlug, ciudadFiltro)
  let { data, error } = res

  // Si falla por columna inexistente (42703), reintentar sin slug y memorizar la ausencia
  if (error && (error as unknown as { code?: string }).code === '42703') {
    dbHasSlugColumn = false
    res = await makeQuery(false, ciudadFiltro)
    data = res.data
    error = res.error
  }

  if (error) {
    try {
      console.error(
        'Error obteniendo publicaciones:',
        JSON.parse(JSON.stringify(error))
      )
    } catch {
      console.error('Error obteniendo publicaciones:', error)
    }
    if (import.meta.env.MODE === 'development') throw error
    return []
  }

  return (data || []).map(mapRowToPerfil)
}

export async function obtenerPerfilPorId(
  id: string
): Promise<PerfilComercio | null> {
  const selectWithSlug =
    'id, slug, nombre_emprendimiento, categoria, descripcion, whatsapp, ciudad, direccion, lat, lng, foto_logo, foto_portada, sitio_web, historia, created_at, products(*)'
  const selectWithoutSlug =
    'id, nombre_emprendimiento, categoria, descripcion, whatsapp, ciudad, direccion, lat, lng, foto_logo, foto_portada, sitio_web, historia, created_at, products(*)'

  const includeSlug = dbHasSlugColumn !== false
  let res
  if (includeSlug) {
    res = await supabase
      .from('profiles')
      .select(selectWithSlug)
      .eq('id', id)
      .maybeSingle()
  } else {
    res = await supabase
      .from('profiles')
      .select(selectWithoutSlug)
      .eq('id', id)
      .maybeSingle()
  }

  let { data, error } = res
  if (error && (error as unknown as { code?: string }).code === '42703') {
    dbHasSlugColumn = false
    const retry = await supabase
      .from('profiles')
      .select(selectWithoutSlug)
      .eq('id', id)
      .maybeSingle()
    data = retry.data
    error = retry.error
  }

  if (error || !data) return null
  return mapRowToPerfil(data)
}

// SLUGS function (for later)
export async function obtenerPerfilPorSlug(
  slug: string
): Promise<PerfilComercio | null> {
  // Si sabemos que no existe la columna slug, no intentar la consulta
  if (dbHasSlugColumn === false) return null

  const selectWithSlug =
    'id, slug, nombre_emprendimiento, categoria, descripcion, whatsapp, ciudad, direccion, lat, lng, foto_logo, foto_portada, sitio_web, historia, created_at, products(*)'

  const res = await supabase
    .from('profiles')
    .select(selectWithSlug)
    .eq('slug', slug)
    .maybeSingle()

  const { data, error } = res
  if (error && (error as unknown as { code?: string }).code === '42703') {
    dbHasSlugColumn = false
    if (
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        slug
      )
    ) {
      return await obtenerPerfilPorId(slug)
    }
    return null
  }

  if (
    !data &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug)
  ) {
    return await obtenerPerfilPorId(slug)
  }

  if (error || !data) return null
  return mapRowToPerfil(data)
}

export async function obtenerCiudadesActivas(): Promise<string[]> {
  const { data } = await supabase
    .from('profiles')
    .select('ciudad')
    .not('ciudad', 'eq', '')
    .order('ciudad')

  if (!data || data.length === 0) {
    return ['Ayacucho', 'Tandil', 'Balcarce', 'Rauch']
  }

  const ciudades = [...new Set(data.map((r) => r.ciudad).filter(Boolean))]
  return ciudades.length > 0
    ? ciudades.sort()
    : ['Ayacucho', 'Tandil', 'Balcarce', 'Rauch']
}

export async function actualizarPerfil(
  id: string,
  datos: Omit<
    PerfilComercio,
    'id' | 'email' | 'productos' | 'lat' | 'lng' | 'fotoLogo' | 'fotoPortada'
  > & { fotoLogo?: string | File | Blob; fotoPortada?: string | File | Blob }
): Promise<{ success: boolean; message: string }> {
  const categoria = validarCategoriaRubro(datos.categoria)
  if (!categoria) {
    return { success: false, message: 'Categoría inválida.' }
  }

  let fotoLogo: string
  let fotoPortada: string
  try {
    // Solo hacer fetch de valores actuales si falta al menos un campo
    const necesitaFetch =
      datos.fotoLogo === undefined || datos.fotoPortada === undefined
    const { data: perfilActual } = necesitaFetch
      ? await supabase
          .from('profiles')
          .select('foto_logo, foto_portada')
          .eq('id', id)
          .maybeSingle()
      : { data: null }

    fotoLogo =
      datos.fotoLogo !== undefined
        ? await procesarImagen(datos.fotoLogo, id, 'logo')
        : perfilActual?.foto_logo || ''

    fotoPortada =
      datos.fotoPortada !== undefined
        ? await procesarImagen(datos.fotoPortada, id, 'portada')
        : perfilActual?.foto_portada || ''
  } catch (e: unknown) {
    return {
      success: false,
      message:
        e instanceof Error ? traducirError(e) : 'Error al subir las imágenes.'
    }
  }

  const { error } = await supabase
    .from('profiles')
    .update({
      nombre_emprendimiento: datos.nombreEmprendimiento,
      categoria,
      descripcion: datos.descripcion || '',
      whatsapp: datos.whatsapp || '',
      ciudad: datos.ciudad || '',
      direccion: datos.direccion || '',
      sitio_web: datos.sitioWeb || '',
      historia: datos.historia || '',
      foto_logo: fotoLogo,
      foto_portada: fotoPortada
    })
    .eq('id', id)

  if (error) {
    return { success: false, message: traducirError(error) }
  }
  return { success: true, message: 'Perfil actualizado correctamente.' }
}

export function obtenerUltimaCiudad(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(STORAGE_KEYS.LAST_CITY)
}

export function guardarUltimaCiudad(ciudad: string) {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEYS.LAST_CITY, ciudad)
}
