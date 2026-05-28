import { MAX_IMAGE_SIZE_BYTES } from './constants'
import { isBlob, isFile } from './typeGuards'
import { supabase } from './supabase'

export async function compressImageToBlob(file: File): Promise<Blob> {
  return await new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Error al leer el archivo.'))
    reader.onload = () => {
      const img = new Image()
      img.onerror = () => reject(new Error('Error al procesar la imagen.'))
      img.onload = () => {
        const MAX_WIDTH = 1200
        const MAX_HEIGHT = 1200
        let width = img.width
        let height = img.height

        if (width > height) {
          if (width > MAX_WIDTH) {
            const newHeight = Math.round((height * MAX_WIDTH) / width)
            height = newHeight
            width = MAX_WIDTH
          }
        } else {
          if (height > MAX_HEIGHT) {
            const newWidth = Math.round((width * MAX_HEIGHT) / height)
            width = newWidth
            height = MAX_HEIGHT
          }
        }

        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        ctx?.drawImage(img, 0, 0, width, height)

        canvas.toBlob(
          (blob) => {
            if (!blob) return reject(new Error('No se pudo generar el blob.'))
            resolve(blob)
          },
          'image/webp',
          0.8
        )
      }
      img.src = reader.result as string
    }
    reader.readAsDataURL(file)
  })
}

function dataURLToBlob(dataUrl: string): Blob {
  const parts = dataUrl.split(',')
  const mime = parts[0].match(/:(.*?);/)?.[1] || 'image/jpeg'
  const bstr = atob(parts[1])
  let n = bstr.length
  const u8arr = new Uint8Array(n)
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n)
  }
  return new Blob([u8arr], { type: mime })
}

export async function subirArchivoStorage(
  fileOrBlob: File | Blob | string,
  userId: string,
  nombre: string
): Promise<string> {
  let fileBlob: Blob

  if (typeof fileOrBlob === 'string') {
    // data url
    fileBlob = dataURLToBlob(fileOrBlob)
  } else {
    fileBlob = fileOrBlob
  }

  // Validar tamaño (2MB)
  if (fileBlob.size > MAX_IMAGE_SIZE_BYTES) {
    throw new Error('La imagen supera los 2MB permitidos')
  }

  const ext = fileBlob.type.split('/')[1] || 'webp'
  const path = `${userId}/${nombre}.${ext}`
  const BUCKET_NAME = 'comercio-local'

  const { error: uploadError } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(path, fileBlob, { upsert: true, contentType: fileBlob.type })

  if (uploadError) {
    throw new Error(uploadError.message || 'Error al subir la imagen')
  }

  const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(path)

  return data.publicUrl
}

export async function procesarImagen(
  imagen: string | File | Blob | undefined,
  userId: string,
  nombre: string
): Promise<string> {
  if (!imagen) return ''

  // Si ya es URL (pública), devolverla
  if (
    typeof imagen === 'string' &&
    (imagen.startsWith('http') || imagen.startsWith('/'))
  ) {
    return imagen
  }

  // Si viene como data URL (base64), convertir a blob y subir
  if (typeof imagen === 'string' && imagen.startsWith('data:image/')) {
    return subirArchivoStorage(imagen, userId, nombre)
  }

  // Si es File o Blob, subir directamente usando type-guards
  if (isFile(imagen) || isBlob(imagen)) {
    return subirArchivoStorage(imagen, userId, nombre)
  }

  // Fallback: devolver string vacío
  return ''
}
