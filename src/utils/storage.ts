import { supabase } from './supabase'
import type { PerfilComercio, Producto } from './constants'
import { RUBROS_FOTO_OPCIONAL } from './constants'

export interface UsuarioCuenta extends PerfilComercio {
  password?: string
}

const STORAGE_KEYS = {
  LAST_CITY: 'comercio_local_last_city_v2'
}

// ─── Mappers ────────────────────────────────────────

function mapRowToPerfil(row: any): PerfilComercio {
  return {
    id: row.id,
    email: row.email || '',
    nombre_emprendimiento: row.nombre_emprendimiento,
    categoria: row.categoria,
    descripcion: row.descripcion || '',
    whatsapp: row.whatsapp || '',
    ciudad: row.ciudad || '',
    direccion: row.direccion || '',
    lat: row.lat,
    lng: row.lng,
    sitio_web: row.sitio_web || '',
    historia: row.historia || '',
    fotoLogo: row.foto_logo || '',
    fotoPortada: row.foto_portada || '',
    productos: (row.products || []).map(mapRowToProducto)
  }
}

function mapRowToProducto(row: any): Producto {
  return {
    id: row.id,
    titulo: row.titulo,
    descripcion: row.descripcion || '',
    precio: row.precio,
    foto: row.foto || ''
  }
}

// ─── Perfiles públicos ──────────────────────────────

export async function obtenerPublicaciones(
  ciudadFiltro?: string
): Promise<PerfilComercio[]> {
  let query = supabase
    .from('profiles')
    .select('*, products(*)')
    .order('created_at', { ascending: false })

  if (ciudadFiltro && ciudadFiltro !== 'todas') {
    query = query.eq('ciudad', ciudadFiltro)
  }

  const { data, error } = await query
  if (error) {
    console.error('Error obteniendo publicaciones:', error)
    return []
  }
  return (data || []).map(mapRowToPerfil)
}

export async function obtenerPerfilPorId(
  id: string
): Promise<PerfilComercio | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*, products(*)')
    .eq('id', id)
    .maybeSingle()

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

// ─── Auth ──────────────────────────────────────────

export async function registrarUsuario(
  email: string,
  password: string,
  datos: Omit<PerfilComercio, 'id' | 'email' | 'productos' | 'lat' | 'lng'>
): Promise<{ success: boolean; message: string }> {
  const emailNorm = email.toLowerCase().trim()

  const { data: existente } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', emailNorm)
    .maybeSingle()

  if (existente) {
    return {
      success: false,
      message: 'El correo electrónico ya se encuentra registrado.'
    }
  }

  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: emailNorm,
    password
  })

  if (authError || !authData.user) {
    return {
      success: false,
      message: authError?.message || 'Error al registrar'
    }
  }

  const { error: insertError } = await supabase.from('profiles').insert({
    id: authData.user.id,
    email: emailNorm,
    nombre_emprendimiento: datos.nombre_emprendimiento,
    categoria: datos.categoria,
    descripcion: datos.descripcion || '',
    whatsapp: datos.whatsapp || '',
    ciudad: datos.ciudad || '',
    direccion: datos.direccion || '',
    sitio_web: datos.sitio_web || '',
    historia: datos.historia || '',
    foto_logo: datos.fotoLogo || '',
    foto_portada: datos.fotoPortada || ''
  })

  if (insertError) {
    return { success: false, message: insertError.message }
  }

  return { success: true, message: 'Registro exitoso' }
}

export async function autenticarUsuario(
  email: string,
  password: string
): Promise<{ success: boolean; message: string; usuario?: PerfilComercio }> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.toLowerCase().trim(),
    password
  })

  if (error) {
    const msg =
      error.message === 'Invalid login credentials'
        ? 'Correo o contraseña incorrectos.'
        : error.message
    return { success: false, message: msg }
  }

  const { data: perfil, error: perfilError } = await supabase
    .from('profiles')
    .select('*, products(*)')
    .eq('id', data.user.id)
    .maybeSingle()

  if (perfilError || !perfil) {
    return { success: false, message: 'Perfil no encontrado.' }
  }

  return {
    success: true,
    message: 'Ingreso exitoso',
    usuario: mapRowToPerfil(perfil)
  }
}

export async function obtenerSesionActiva(): Promise<PerfilComercio | null> {
  const {
    data: { session }
  } = await supabase.auth.getSession()
  if (!session?.user) return null

  const { data, error } = await supabase
    .from('profiles')
    .select('*, products(*)')
    .eq('id', session.user.id)
    .maybeSingle()

  if (error || !data) return null
  return mapRowToPerfil(data)
}

export async function cerrarSesion() {
  await supabase.auth.signOut()
}

// ─── Perfil propio ─────────────────────────────────

export async function actualizarPerfil(
  id: string,
  datos: Omit<PerfilComercio, 'id' | 'email' | 'productos' | 'lat' | 'lng'>
): Promise<{ success: boolean; message: string }> {
  const { error } = await supabase
    .from('profiles')
    .update({
      nombre_emprendimiento: datos.nombre_emprendimiento,
      categoria: datos.categoria,
      descripcion: datos.descripcion || '',
      whatsapp: datos.whatsapp || '',
      ciudad: datos.ciudad || '',
      direccion: datos.direccion || '',
      sitio_web: datos.sitio_web || '',
      historia: datos.historia || '',
      foto_logo: datos.fotoLogo || '',
      foto_portada: datos.fotoPortada || ''
    })
    .eq('id', id)

  if (error) {
    return { success: false, message: error.message }
  }
  return { success: true, message: 'Perfil actualizado correctamente.' }
}

// ─── Productos ─────────────────────────────────────

export async function agregarProducto(
  usuarioId: string,
  producto: Omit<Producto, 'id'>
): Promise<{ success: boolean; message: string; producto?: Producto }> {
  const { data: perfil } = await supabase
    .from('profiles')
    .select('categoria')
    .eq('id', usuarioId)
    .maybeSingle()

  if (!perfil) {
    return { success: false, message: 'Usuario no encontrado.' }
  }

  const categoria = perfil.categoria
  const fotoOpcional = RUBROS_FOTO_OPCIONAL.includes(categoria as any)
  const tieneFoto = !!(producto.foto && producto.foto.trim())
  const tieneDescripcion = !!(
    producto.descripcion && producto.descripcion.trim()
  )

  if (!producto.titulo.trim()) {
    return {
      success: false,
      message: 'El título de la publicación es obligatorio.'
    }
  }

  if (fotoOpcional) {
    if (!tieneDescripcion) {
      return {
        success: false,
        message:
          'Para este rubro, la descripción es obligatoria. Podés agregar una foto o no, pero describí qué hacés.'
      }
    }
  } else {
    if (!tieneFoto && !tieneDescripcion) {
      return {
        success: false,
        message:
          'Debés subir al menos una foto o escribir una descripción para publicar.'
      }
    }
    if (!tieneFoto) {
      return {
        success: false,
        message:
          'Para este rubro, la foto es obligatoria. Agregá una imagen del producto o trabajo.'
      }
    }
    if (!tieneDescripcion) {
      return {
        success: false,
        message:
          'La descripción es obligatoria. Contá de qué se trata este producto o servicio.'
      }
    }
  }

  const nuevoProducto = {
    id: `prod_${Date.now()}`,
    profile_id: usuarioId,
    titulo: producto.titulo.trim(),
    descripcion: producto.descripcion.trim(),
    precio: producto.precio !== undefined ? Number(producto.precio) : null,
    foto: tieneFoto ? producto.foto!.trim() : ''
  }

  const { error } = await supabase.from('products').insert(nuevoProducto)
  if (error) {
    return { success: false, message: error.message }
  }

  return {
    success: true,
    message: '¡Publicación agregada con éxito!',
    producto: {
      id: nuevoProducto.id,
      titulo: nuevoProducto.titulo,
      descripcion: nuevoProducto.descripcion,
      precio: nuevoProducto.precio ?? undefined,
      foto: nuevoProducto.foto
    }
  }
}

export async function editarProducto(
  usuarioId: string,
  productoId: string | number,
  nuevosDatos: Omit<Producto, 'id'>
): Promise<{ success: boolean; message: string }> {
  const { data: perfil } = await supabase
    .from('profiles')
    .select('categoria')
    .eq('id', usuarioId)
    .maybeSingle()

  if (!perfil) {
    return { success: false, message: 'Usuario no encontrado.' }
  }

  const categoria = perfil.categoria
  const fotoOpcional = RUBROS_FOTO_OPCIONAL.includes(categoria as any)
  const tieneFoto = !!(nuevosDatos.foto && nuevosDatos.foto.trim())
  const tieneDescripcion = !!(
    nuevosDatos.descripcion && nuevosDatos.descripcion.trim()
  )

  if (!nuevosDatos.titulo.trim()) {
    return {
      success: false,
      message: 'El título de la publicación es obligatorio.'
    }
  }

  if (fotoOpcional) {
    if (!tieneDescripcion) {
      return {
        success: false,
        message: 'Para este rubro, la descripción es obligatoria.'
      }
    }
  } else {
    if (!tieneFoto && !tieneDescripcion) {
      return {
        success: false,
        message:
          'Debés subir al menos una foto o escribir una descripción para publicar.'
      }
    }
    if (!tieneFoto) {
      return {
        success: false,
        message: 'Para este rubro, la foto es obligatoria.'
      }
    }
    if (!tieneDescripcion) {
      return { success: false, message: 'La descripción es obligatoria.' }
    }
  }

  const { error } = await supabase
    .from('products')
    .update({
      titulo: nuevosDatos.titulo.trim(),
      descripcion: nuevosDatos.descripcion.trim(),
      precio:
        nuevosDatos.precio !== undefined ? Number(nuevosDatos.precio) : null,
      foto: tieneFoto ? nuevosDatos.foto!.trim() : ''
    })
    .eq('id', String(productoId))
    .eq('profile_id', usuarioId)

  if (error) {
    return { success: false, message: error.message }
  }
  return { success: true, message: '¡Publicación actualizada con éxito!' }
}

export async function eliminarProducto(
  usuarioId: string,
  productoId: string | number
): Promise<{ success: boolean; message: string }> {
  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', String(productoId))
    .eq('profile_id', usuarioId)

  if (error) {
    return { success: false, message: error.message }
  }
  return {
    success: true,
    message: '¡Artículo/Servicio eliminado del catálogo!'
  }
}

// ─── Calificaciones (ratings) ──────────────────────

export async function agregarRating(
  profileId: string,
  rating: number
): Promise<{ success: boolean; message: string }> {
  if (rating < 1 || rating > 5) {
    return { success: false, message: 'La calificación debe ser entre 1 y 5.' }
  }

  const { error } = await supabase.from('ratings').insert({
    id: `rat_${Date.now()}`,
    profile_id: profileId,
    rating
  })

  if (error) {
    return { success: false, message: error.message }
  }
  return { success: true, message: 'Calificación guardada.' }
}

export async function obtenerRating(
  profileId: string
): Promise<{ promedio: number; total: number; distribucion: number[] }> {
  const { data, error } = await supabase
    .from('ratings')
    .select('rating')
    .eq('profile_id', profileId)

  if (error || !data || data.length === 0) {
    return { promedio: 0, total: 0, distribucion: [0, 0, 0, 0, 0] }
  }

  const total = data.length
  const suma = data.reduce((acc, r) => acc + r.rating, 0)
  const promedio = Math.round((suma / total) * 10) / 10

  const distribucion = [0, 0, 0, 0, 0]
  data.forEach((r) => {
    distribucion[r.rating - 1]++
  })

  return { promedio, total, distribucion }
}

export async function obtenerRatingsPorIds(
  ids: string[]
): Promise<Map<string, { promedio: number; total: number }>> {
  if (ids.length === 0) return new Map()
  const { data, error } = await supabase
    .from('ratings')
    .select('profile_id, rating')
    .in('profile_id', ids)

  if (error || !data) return new Map()

  const agrupado = new Map<string, number[]>()
  data.forEach((r) => {
    const arr = agrupado.get(r.profile_id) || []
    arr.push(r.rating)
    agrupado.set(r.profile_id, arr)
  })

  const resultado = new Map<string, { promedio: number; total: number }>()
  agrupado.forEach((ratings, id) => {
    const total = ratings.length
    const suma = ratings.reduce((a, b) => a + b, 0)
    const promedio = Math.round((suma / total) * 10) / 10
    resultado.set(id, { promedio, total })
  })
  return resultado
}

// ─── Utilidades (localStorage) ─────────────────────

export function obtenerUltimaCiudad(): string {
  if (typeof window === 'undefined') return 'todas'
  return localStorage.getItem(STORAGE_KEYS.LAST_CITY) || 'todas'
}

export function guardarUltimaCiudad(ciudad: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEYS.LAST_CITY, ciudad)
  }
}
