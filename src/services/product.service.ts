import { supabase } from '../utils/supabase'
import type { Producto, CategoriaRubro } from '../utils/constants'
import { RUBROS_FOTO_OPCIONAL } from '../utils/constants'
import { procesarImagen } from '../utils/images'
import { traducirError } from './error.service'

export async function agregarProducto(
  usuarioId: string,
  producto: Omit<Producto, 'id' | 'foto'> & { foto?: string | File | Blob }
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
  const tieneFoto = !!(
    producto.foto &&
    (typeof producto.foto === 'string' ? producto.foto.trim().length > 0 : true)
  )
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
      descripcion: data.descripcion || '',
      precio: data.precio ?? undefined,
      foto: data.foto || ''
    }
  }
}

export async function editarProducto(
  usuarioId: string,
  productoId: string,
  nuevosDatos: Omit<Producto, 'id' | 'foto'> & { foto?: string | File | Blob }
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
  const tieneFoto = !!(
    nuevosDatos.foto &&
    (typeof nuevosDatos.foto === 'string'
      ? nuevosDatos.foto.trim().length > 0
      : true)
  )
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
    .eq('id', productoId)
    .eq('profile_id', usuarioId)

  if (error) {
    return { success: false, message: traducirError(error) }
  }
  return { success: true, message: '¡Publicación actualizada con éxito!' }
}

export async function eliminarProducto(
  usuarioId: string,
  productoId: string
): Promise<{ success: boolean; message: string }> {
  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', productoId)
    .eq('profile_id', usuarioId)

  if (error) {
    return { success: false, message: traducirError(error) }
  }
  return {
    success: true,
    message: '¡Artículo/Servicio eliminado del catálogo!'
  }
}
