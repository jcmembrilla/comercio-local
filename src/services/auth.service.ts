import { supabase } from '../utils/supabase'
import type { PerfilComercio } from '../utils/constants'
import { validarCategoriaRubro, mapRowToPerfil } from './profile.service'
import { traducirError } from './error.service'
import { subirArchivoStorage } from '../utils/images'

export async function registrarUsuario(
  email: string,
  password: string,
  datos: Omit<
    PerfilComercio,
    'id' | 'email' | 'productos' | 'lat' | 'lng' | 'fotoLogo' | 'fotoPortada'
  > & {
    fotoLogo?: string | File | Blob
    fotoPortada?: string | File | Blob
  }
): Promise<{
  success: boolean
  message: string
  requireEmailConfirmation?: boolean
}> {
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
  const requireEmailConfirmation = !authData.session
  let fotoLogo: string
  let fotoPortada: string
  try {
    // Subimos imágenes comprimidas/como blobs usando el endpoint FormData
    const uploadIfNeeded = async (
      fileOrUrl: string | File | Blob | undefined,
      userId: string,
      nombre: string
    ) => {
      if (!fileOrUrl) return ''
      // Si ya es una URL pública, no necesitamos subir
      if (
        typeof fileOrUrl === 'string' &&
        (fileOrUrl.startsWith('http') || fileOrUrl.startsWith('/'))
      )
        return fileOrUrl
      return await subirArchivoStorage(fileOrUrl, userId, nombre)
    }

    fotoLogo = await uploadIfNeeded(datos.fotoLogo, userId, 'logo')
    fotoPortada = await uploadIfNeeded(datos.fotoPortada, userId, 'portada')
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

  return {
    success: true,
    message: requireEmailConfirmation
      ? 'Registro exitoso. Te enviamos un email de confirmación, revisá tu bandeja de entrada.'
      : 'Registro exitoso',
    requireEmailConfirmation
  }
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
    data: { user }
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data, error } = await supabase
    .from('profiles')
    .select('*, products(*)')
    .eq('id', user.id)
    .maybeSingle()

  if (error || !data) return null
  return mapRowToPerfil(data)
}

export async function cerrarSesion() {
  await supabase.auth.signOut()
}
