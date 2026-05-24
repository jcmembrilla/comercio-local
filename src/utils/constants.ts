export interface Producto {
  id: string | number
  titulo: string
  precio?: number
  foto?: string // Imagen en base64 o URL. Obligatoria según el rubro.
  descripcion: string // Descripción del artículo o servicio.
}

export interface PerfilComercio {
  id: string
  email: string
  nombre_emprendimiento: string
  categoria:
    | 'comidas'
    | 'oficios'
    | 'artesanias'
    | 'jardineria'
    | 'estetica'
    | 'educacion'
    | 'tecnologia'
    | 'otros'
  descripcion: string
  whatsapp: string
  ciudad: string
  direccion?: string
  lat?: number
  lng?: number
  sitio_web?: string
  historia?: string
  productos: Producto[]
  fotoLogo?: string
  fotoPortada?: string
}

export type CategoriaRubro = PerfilComercio['categoria']

// Rubros donde la foto en publicaciones es OPCIONAL (basta con descripción)
export const RUBROS_FOTO_OPCIONAL: CategoriaRubro[] = [
  'oficios',
  'jardineria',
  'educacion',
  'tecnologia'
]

// Tamaño máximo de imagen subida (2MB)
export const MAX_IMAGE_SIZE_BYTES = 2 * 1024 * 1024

export const CATEGORIAS: { value: CategoriaRubro; label: string }[] = [
  { value: 'comidas', label: 'Comidas y Alimentos' },
  { value: 'artesanias', label: 'Artesanías y Deco' },
  { value: 'oficios', label: 'Oficios del Hogar' },
  { value: 'jardineria', label: 'Jardinería y Pileta' },
  { value: 'estetica', label: 'Belleza y Estética' },
  { value: 'educacion', label: 'Clases y Cursos' },
  { value: 'tecnologia', label: 'Servicio Técnico y Tech' },
  { value: 'otros', label: 'Otros' }
]

export const CIUDADES_PREDEFINIDAS = [
  'Ayacucho',
  'Tandil',
  'Balcarce',
  'Rauch'
] as const

export type CiudadPredefinida = (typeof CIUDADES_PREDEFINIDAS)[number]

export const COLORES_CATEGORIAS: Record<
  CategoriaRubro,
  { bg: string; border: string; text: string; fullClass: string; rgb: string }
> = {
  comidas: {
    bg: 'bg-emerald-950/40',
    border: 'border-emerald-500',
    text: 'text-emerald-400',
    fullClass: 'bg-emerald-950/40 border-emerald-500/50 text-emerald-400',
    rgb: '5, 150, 105'
  },
  oficios: {
    bg: 'bg-slate-900/60',
    border: 'border-slate-500',
    text: 'text-slate-300',
    fullClass: 'bg-slate-900/60 border-slate-500/50 text-slate-300',
    rgb: '100, 116, 139'
  },
  artesanias: {
    bg: 'bg-amber-950/30',
    border: 'border-amber-600',
    text: 'text-amber-400',
    fullClass: 'bg-amber-950/30 border-amber-600/50 text-amber-400',
    rgb: '217, 119, 6'
  },
  jardineria: {
    bg: 'bg-teal-950/40',
    border: 'border-teal-500',
    text: 'text-teal-400',
    fullClass: 'bg-teal-950/40 border-teal-500/50 text-teal-400',
    rgb: '20, 184, 166'
  },
  estetica: {
    bg: 'bg-rose-950/30',
    border: 'border-rose-500',
    text: 'text-rose-400',
    fullClass: 'bg-rose-950/30 border-rose-500/50 text-rose-400',
    rgb: '244, 63, 94'
  },
  educacion: {
    bg: 'bg-indigo-950/30',
    border: 'border-indigo-500',
    text: 'text-indigo-400',
    fullClass: 'bg-indigo-950/30 border-indigo-500/50 text-indigo-400',
    rgb: '99, 102, 241'
  },
  tecnologia: {
    bg: 'bg-cyan-950/30',
    border: 'border-cyan-500',
    text: 'text-cyan-400',
    fullClass: 'bg-cyan-950/30 border-cyan-500/50 text-cyan-400',
    rgb: '6, 182, 212'
  },
  otros: {
    bg: 'bg-zinc-900',
    border: 'border-zinc-600',
    text: 'text-zinc-400',
    fullClass: 'bg-zinc-900 border-zinc-600 text-zinc-400',
    rgb: '82, 82, 91'
  }
}

export const RESPALDOS_POR_RUBRO: Record<
  CategoriaRubro,
  { titulo: string; foto: string; portada: string }
> = {
  comidas: {
    titulo: 'Platos y preparaciones caseras',
    foto: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=500&auto=format&fit=crop&q=60',
    portada:
      'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=1000&auto=format&fit=crop&q=80'
  },
  oficios: {
    titulo: 'Herramientas y servicios para el hogar',
    foto: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=500&auto=format&fit=crop&q=60',
    portada:
      'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=1000&auto=format&fit=crop&q=80'
  },
  artesanias: {
    titulo: 'Creaciones y decoración artesanal',
    foto: 'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?w=500&auto=format&fit=crop&q=60',
    portada:
      'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=1000&auto=format&fit=crop&q=80'
  },
  jardineria: {
    titulo: 'Mantenimiento y espacios verdes',
    foto: 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=500&auto=format&fit=crop&q=60',
    portada:
      'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=1000&auto=format&fit=crop&q=80'
  },
  estetica: {
    titulo: 'Servicios de belleza y cuidado personal',
    foto: 'https://images.unsplash.com/photo-1560750588-73207b1ef5b8?w=500&auto=format&fit=crop&q=60',
    portada:
      'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=1000&auto=format&fit=crop&q=80'
  },
  educacion: {
    titulo: 'Clases particulares y cursos de formación',
    foto: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=500&auto=format&fit=crop&q=60',
    portada:
      'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=1000&auto=format&fit=crop&q=80'
  },
  tecnologia: {
    titulo: 'Soporte tecnológico y servicio técnico',
    foto: 'https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=500&auto=format&fit=crop&q=60',
    portada:
      'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=1000&auto=format&fit=crop&q=80'
  },
  otros: {
    titulo: 'Comercio y servicios generales',
    foto: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?w=500&auto=format&fit=crop&q=60',
    portada:
      'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1000&auto=format&fit=crop&q=80'
  }
}
