import { supabase } from './supabase'
import type { PerfilComercio, Producto, CategoriaRubro } from './constants'
import { RUBROS_FOTO_OPCIONAL, CATEGORIAS } from './constants'
import type { ProfileRow, ProductRow } from './database.types'
import { procesarImagen } from './images'

const STORAGE_KEYS = {
  LAST_CITY: 'comercio_local_last_city_v2'
}

function isCategoriaRubro(value: unknown): value is CategoriaRubro {
  return (
    typeof value === 'string' && CATEGORIAS.some((cat) => cat.value === value)
  )
}

function validarCategoriaRubro(value: unknown): CategoriaRubro | null {
  return isCategoriaRubro(value) ? value : null
}

function traducirError(error: { message?: string } | null): string {
  if (!error?.message) return 'Ocurrió un error inesperado.'
  const msg = error.message
  if (msg.includes('Bucket not found'))
    return 'El bucket de almacenamiento no está configurado. Verificá Supabase Storage.'
  if (msg.includes('Invalid login credentials'))
    return 'Correo electrónico o contraseña incorrectos.'
  if (msg.includes('duplicate key value'))
    return 'Este correo electrónico ya está registrado.'
  if (msg.includes('Email not confirmed'))
    return 'El correo electrónico no está confirmado.'
  if (msg.includes('Email rate limit exceeded'))
    return 'Demasiados intentos. Esperá unos minutos y volvé a intentar.'
  if (msg.includes('new row violates row-level security policy'))
    return 'No tenés permisos para realizar esta acción.'
  if (msg.includes('JWT')) return 'La sesión expiró. Iniciá sesión nuevamente.'
  if (msg.includes('does not exist') || msg.includes('not found'))
    return 'El recurso solicitado no existe.'
  return msg
}

// ─── Mappers ────────────────────────────────────────

function mapRowToPerfil(row: ProfileRow): PerfilComercio {
  const categoria = isCategoriaRubro(row.categoria) ? row.categoria : 'otros'

  if (categoria === 'otros' && row.categoria !== 'otros') {
    console.warn(
      `Categoria inválida para el perfil ${row.id}: "${row.categoria}". Usando fallback "otros".`
    )
  }

  return {
    id: row.id,
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

function mapRowToProducto(row: ProductRow): Producto {
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
    .select(
      'id, nombre_emprendimiento, categoria, descripcion, whatsapp, ciudad, direccion, lat, lng, foto_logo, foto_portada, sitio_web, historia, created_at, products(*)'
    )
    .order('created_at', { ascending: false })

  if (ciudadFiltro) {
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
    .select(
      'id, nombre_emprendimiento, categoria, descripcion, whatsapp, ciudad, direccion, lat, lng, foto_logo, foto_portada, sitio_web, historia, created_at, products(*)'
    )
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

  const categoria = validarCategoriaRubro(datos.categoria)
  if (!categoria) {
    return { success: false, message: 'Categoría inválida.' }
  }

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
      message: traducirError(authError)
    }
  }

  const userId = authData.user.id
  let fotoLogo: string
  let fotoPortada: string
  try {
    fotoLogo = await procesarImagen(datos.fotoLogo, userId, 'logo')
    fotoPortada = await procesarImagen(datos.fotoPortada, userId, 'portada')
  } catch (e: unknown) {
    return {
      success: false,
      message:
        e instanceof Error ? traducirError(e) : 'Error al subir las imágenes.'
    }
  }

  const { error: rpcError } = await supabase.rpc('crear_perfil_registro', {
    user_id: userId,
    user_email: emailNorm,
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

  if (rpcError) {
    return { success: false, message: traducirError(rpcError) }
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
    return { success: false, message: traducirError(error) }
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
  const categoria = validarCategoriaRubro(datos.categoria)
  if (!categoria) {
    return { success: false, message: 'Categoría inválida.' }
  }

  let fotoLogo: string
  let fotoPortada: string
  try {
    fotoLogo = await procesarImagen(datos.fotoLogo, id, 'logo')
    fotoPortada = await procesarImagen(datos.fotoPortada, id, 'portada')
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

  const categoria = perfil.categoria as CategoriaRubro
  const fotoOpcional = RUBROS_FOTO_OPCIONAL.includes(categoria)
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

  let fotoUrl = ''
  if (tieneFoto && producto.foto) {
    try {
      fotoUrl = await procesarImagen(
        producto.foto,
        usuarioId,
        `products/${crypto.randomUUID()}`
      )
    } catch (e: unknown) {
      return {
        success: false,
        message:
          e instanceof Error ? traducirError(e) : 'Error al subir la imagen.'
      }
    }
  }

  const nuevoProducto = {
    profile_id: usuarioId,
    titulo: producto.titulo.trim(),
    descripcion: producto.descripcion.trim(),
    precio: producto.precio != null ? Number(producto.precio) : null,
    foto: fotoUrl
  }

  const { data, error } = await supabase
    .from('products')
    .insert(nuevoProducto)
    .select()
    .single()
  if (error || !data) {
    return {
      success: false,
      message: traducirError(error) || 'Error al guardar la publicación'
    }
  }

  return {
    success: true,
    message: '¡Publicación agregada con éxito!',
    producto: {
      id: data.id,
      titulo: data.titulo,
      descripcion: data.descripcion,
      precio: data.precio ?? undefined,
      foto: data.foto
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

  const categoria = perfil.categoria as CategoriaRubro
  const fotoOpcional = RUBROS_FOTO_OPCIONAL.includes(categoria)
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

  let fotoUrl = ''
  if (tieneFoto && nuevosDatos.foto) {
    try {
      fotoUrl = await procesarImagen(
        nuevosDatos.foto,
        usuarioId,
        `products/${crypto.randomUUID()}`
      )
    } catch (e: unknown) {
      return {
        success: false,
        message:
          e instanceof Error ? traducirError(e) : 'Error al subir la imagen.'
      }
    }
  }

  const { error } = await supabase
    .from('products')
    .update({
      titulo: nuevosDatos.titulo.trim(),
      descripcion: nuevosDatos.descripcion.trim(),
      precio: nuevosDatos.precio != null ? Number(nuevosDatos.precio) : null,
      foto: fotoUrl
    })
    .eq('id', String(productoId))
    .eq('profile_id', usuarioId)

  if (error) {
    return { success: false, message: traducirError(error) }
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
    return { success: false, message: traducirError(error) }
  }
  return {
    success: true,
    message: '¡Artículo/Servicio eliminado del catálogo!'
  }
}

// ─── Utilidades (localStorage) ─────────────────────

export function obtenerUltimaCiudad(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(STORAGE_KEYS.LAST_CITY)
}

export function guardarUltimaCiudad(ciudad: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEYS.LAST_CITY, ciudad)
  }
}
