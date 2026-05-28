import { supabase } from '../utils/supabase'
import type { Producto, CategoriaRubro } from '../utils/constants'
import { RUBROS_FOTO_OPCIONAL } from '../utils/constants'
import { procesarImagen } from '../utils/images'
import { traducirError } from './error.service'

type ProductoData = Omit<Producto, 'id' | 'foto'> & {
  foto?: string | File | Blob
}

interface ValidacionProducto {
  valido: true
  categoria: CategoriaRubro
  tieneFoto: boolean
  tieneDescripcion: boolean
}

interface ValidacionError {
  valido: false
  mensaje: string
}

async function validarProducto(
  usuarioId: string,
  datos: ProductoData
): Promise<ValidacionProducto | ValidacionError> {
  const { data: perfil } = await supabase
    .from('profiles')
    .select('categoria')
    .eq('id', usuarioId)
    .maybeSingle()

  if (!perfil) {
    return { valido: false, mensaje: 'Usuario no encontrado.' }
  }

  const categoria = perfil.categoria as CategoriaRubro
  const fotoOpcional = RUBROS_FOTO_OPCIONAL.includes(categoria)
  const tieneFoto = !!(
    datos.foto &&
    (typeof datos.foto === 'string' ? datos.foto.trim().length > 0 : true)
  )
  const tieneDescripcion = !!(datos.descripcion && datos.descripcion.trim())

  if (!datos.titulo.trim()) {
    return {
      valido: false,
      mensaje: 'El título de la publicación es obligatorio.'
    }
  }

  if (fotoOpcional) {
    if (!tieneDescripcion) {
      return {
        valido: false,
        mensaje:
          'Para este rubro, la descripción es obligatoria. Podés agregar una foto o no, pero describí qué hacés.'
      }
    }
  } else {
    if (!tieneFoto && !tieneDescripcion) {
      return {
        valido: false,
        mensaje:
          'Debés subir al menos una foto o escribir una descripción para publicar.'
      }
    }
    if (!tieneFoto) {
      return {
        valido: false,
        mensaje:
          'Para este rubro, la foto es obligatoria. Agregá una imagen del producto o trabajo.'
      }
    }
    if (!tieneDescripcion) {
      return {
        valido: false,
        mensaje:
          'La descripción es obligatoria. Contá de qué se trata este producto o servicio.'
      }
    }
  }

  return { valido: true, categoria, tieneFoto, tieneDescripcion }
}

export async function agregarProducto(
  usuarioId: string,
  producto: ProductoData
): Promise<{ success: boolean; message: string; producto?: Producto }> {
  const validacion = await validarProducto(usuarioId, producto)
  if (!validacion.valido) {
    return { success: false, message: validacion.mensaje }
  }

  let fotoUrl = ''
  if (validacion.tieneFoto && producto.foto) {
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
  nuevosDatos: ProductoData
): Promise<{ success: boolean; message: string }> {
  const validacion = await validarProducto(usuarioId, nuevosDatos)
  if (!validacion.valido) {
    return { success: false, message: validacion.mensaje }
  }

  let fotoUrl = ''
  if (validacion.tieneFoto && nuevosDatos.foto) {
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
