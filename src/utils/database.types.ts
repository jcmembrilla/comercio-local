export interface ProfileRow {
  id: string
  email?: string
  nombre_emprendimiento: string
  categoria: string
  descripcion: string
  whatsapp: string
  ciudad: string
  direccion: string
  lat?: number
  lng?: number
  foto_logo: string
  foto_portada: string
  sitio_web: string
  historia: string
  created_at?: string
  products?: ProductRow[]
}

export interface ProductRow {
  id: string
  profile_id: string
  titulo: string
  descripcion: string
  precio?: number
  foto: string
  created_at?: string
}
