import { MAX_IMAGE_SIZE_BYTES } from './constants'
import { supabase } from './supabase'

const BUCKET_NAME = 'comercio-local'

export function leerArchivoBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      reject(
        new Error(
          `La imagen no puede superar los 2MB. El archivo pesa ${(file.size / 1024 / 1024).toFixed(1)}MB.`
        )
      )
      return
    }
    const reader = new FileReader()
    reader.onload = (e) => resolve(e.target?.result as string)
    reader.onerror = () => reject(new Error('Error al leer el archivo.'))
    reader.readAsDataURL(file)
  })
}

function base64ABlob(base64: string): { blob: Blob; ext: string } {
  const parts = base64.split(',')
  const mime = parts[0].match(/:(.*?);/)?.[1] || 'image/jpeg'
  const ext = mime.split('/')[1] || 'jpg'
  const raw = atob(parts[1])
  const arr = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i++) {
    arr[i] = raw.charCodeAt(i)
  }
  return { blob: new Blob([arr], { type: mime }), ext }
}

export async function subirImagenStorage(
  base64: string,
  userId: string,
  nombre: string
): Promise<string> {
  const { blob, ext } = base64ABlob(base64)
  const path = `${userId}/${nombre}.${ext}`

  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(path, blob, { upsert: true, contentType: blob.type })

  if (error) throw error

  const {
    data: { publicUrl }
  } = supabase.storage.from(BUCKET_NAME).getPublicUrl(path)

  return publicUrl
}

export async function procesarImagen(
  imagen: string | undefined,
  userId: string,
  nombre: string
): Promise<string> {
  if (!imagen) return ''
  if (imagen.startsWith('data:image/')) {
    return subirImagenStorage(imagen, userId, nombre)
  }
  return imagen
}
