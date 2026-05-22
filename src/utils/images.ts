import { MAX_IMAGE_SIZE_BYTES } from './constants'

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
