import type { PerfilComercio, Producto } from './constants'
import { RUBROS_FOTO_OPCIONAL } from './constants'

export interface UsuarioCuenta extends PerfilComercio {
  password?: string // Simulación de seguridad para autenticación
}

const SEMILLA_PUBLICACIONES: UsuarioCuenta[] = [
  {
    id: 'usr_mabel',
    email: 'mabel@local.com',
    password: 'mabel123',
    nombre_emprendimiento: 'La Cocina de Mabel',
    categoria: 'comidas',
    descripcion:
      'Empanadas caseras cortadas a cuchillo y tartas dulces por encargo.',
    whatsapp: '5491123456789',
    ciudad: 'Ayacucho',
    fotoLogo:
      'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=150&auto=format&fit=crop&q=60',
    fotoPortada:
      'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=800&auto=format&fit=crop&q=80',
    productos: [
      {
        id: 'prod_mabel_1',
        titulo: 'Torta de chocolate mediana',
        precio: 5000,
        foto: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=500&auto=format&fit=crop&q=60',
        descripcion:
          'Torta húmeda de chocolate con doble relleno de dulce de leche.'
      }
    ]
  },
  {
    id: 'usr_carlos',
    email: 'carlos@local.com',
    password: 'carlos123',
    nombre_emprendimiento: 'Carlos Albornoz',
    categoria: 'oficios',
    descripcion:
      'Plomería en general, destapaciones y reparaciones de artefactos del hogar. Urgencias 24hs.',
    whatsapp: '5491198765432',
    ciudad: 'Tandil',
    fotoLogo: '',
    fotoPortada: '',
    productos: []
  },
  {
    id: 'usr_esencias',
    email: 'esencias@local.com',
    password: 'esencias123',
    nombre_emprendimiento: 'Esencias del Alma',
    categoria: 'artesanias',
    descripcion:
      'Sahumerios artesanales, velas de soja naturales y esencias orgánicas para el hogar.',
    whatsapp: '5491155555555',
    ciudad: 'Ayacucho',
    fotoLogo:
      'https://images.unsplash.com/photo-1602928321679-560bb453f190?w=150&auto=format&fit=crop&q=60',
    fotoPortada: '',
    productos: [
      {
        id: 'prod_esencias_1',
        titulo: 'Pack x10 Sahumerios lavanda',
        precio: 1500,
        foto: 'https://images.unsplash.com/photo-1602928321679-560bb453f190?w=500&auto=format&fit=crop&q=60',
        descripcion:
          'Sahumerios hechos a mano con aceites esenciales orgánicos.'
      }
    ]
  },
  {
    id: 'usr_elena',
    email: 'elena@local.com',
    password: 'elena123',
    nombre_emprendimiento: 'Elena Martínez',
    categoria: 'jardineria',
    descripcion:
      'Mantenimiento de espacios verdes, corte de pasto, poda de árboles y diseño de jardines residenciales.',
    whatsapp: '5491144444444',
    ciudad: 'Rauch',
    fotoLogo: '',
    fotoPortada: '',
    productos: []
  },
  {
    id: 'usr_tapestry',
    email: 'tapices@local.com',
    password: 'tapices123',
    nombre_emprendimiento: 'Taller de Tapices Renacer',
    categoria: 'artesanias',
    descripcion:
      'Tapices y tejidos artesanales hechos a mano con técnicas tradicionales. Personalización por encargo.',
    whatsapp: '5491133333333',
    ciudad: 'Balcarce',
    fotoLogo: '',
    fotoPortada:
      'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=800&auto=format&fit=crop&q=80',
    productos: [
      {
        id: 'prod_tapices_1',
        titulo: 'Tapiz mediano de lana',
        precio: 8000,
        foto: 'https://images.unsplash.com/photo-1504198453319-5ce911bafcde?w=500&auto=format&fit=crop&q=60',
        descripcion:
          'Tapiz decorativo tejido con lana de oveja teñida naturalmente.'
      }
    ]
  }
]

const STORAGE_KEYS = {
  DB: 'comercio_local_db_v2', // Versión 2 para evitar conflictos con el esquema anterior
  SESSION: 'comercio_local_session_v2',
  LAST_CITY: 'comercio_local_last_city_v2'
}

// Inicializar DB
export function inicializarDB(): UsuarioCuenta[] {
  if (typeof window === 'undefined') return SEMILLA_PUBLICACIONES

  const dbRaw = localStorage.getItem(STORAGE_KEYS.DB)
  if (!dbRaw) {
    localStorage.setItem(STORAGE_KEYS.DB, JSON.stringify(SEMILLA_PUBLICACIONES))
    return SEMILLA_PUBLICACIONES
  }
  try {
    return JSON.parse(dbRaw)
  } catch (e) {
    console.error('Error leyendo DB local:', e)
    return SEMILLA_PUBLICACIONES
  }
}

// Obtener todas las publicaciones
export function obtenerPublicaciones(ciudadFiltro?: string): PerfilComercio[] {
  const usuarios = inicializarDB()
  const perfiles = usuarios.map(({ password: _password, ...perfil }) => perfil)

  if (ciudadFiltro && ciudadFiltro !== 'todas') {
    return perfiles.filter(
      (p) => p.ciudad.toLowerCase() === ciudadFiltro.toLowerCase()
    )
  }
  return perfiles
}

// Obtener ciudades dinámicas activas en el sistema para mostrarlas en la cabecera
export function obtenerCiudadesActivas(): string[] {
  const publicaciones = obtenerPublicaciones()
  const ciudadesSemilla = ['Ayacucho', 'Tandil', 'Balcarce', 'Rauch']

  // Añadir las ciudades que hayan creado los usuarios en vivo (normalizadas)
  const ciudadesComercios = publicaciones.map((p) => {
    // Primera letra en mayúscula para consistencia visual
    const c = p.ciudad.trim()
    return c.charAt(0).toUpperCase() + c.slice(1)
  })

  const todas = [...ciudadesSemilla, ...ciudadesComercios]
  // Retornar lista de valores únicos ordenados alfabéticamente
  return Array.from(new Set(todas)).sort()
}

// Obtener perfil por ID para la página dedicada /perfil?id=usr_xxx
export function obtenerPerfilPorId(id: string): PerfilComercio | null {
  const publicaciones = obtenerPublicaciones()
  const perfil = publicaciones.find((p) => p.id === id)
  return perfil || null
}

// Registrar usuario
export function registrarUsuario(
  email: string,
  password: string,
  datos: Omit<PerfilComercio, 'id' | 'email' | 'productos'>
): { success: boolean; message: string } {
  if (typeof window === 'undefined')
    return { success: false, message: 'Entorno no soportado' }

  const usuarios = inicializarDB()
  const emailNorm = email.toLowerCase().trim()

  const existe = usuarios.some((u) => u.email.toLowerCase() === emailNorm)
  if (existe) {
    return {
      success: false,
      message: 'El correo electrónico ya se encuentra registrado.'
    }
  }

  const nuevoUsuario: UsuarioCuenta = {
    id: `usr_${Date.now()}`,
    email: emailNorm,
    password,
    nombre_emprendimiento: datos.nombre_emprendimiento,
    categoria: datos.categoria,
    descripcion: datos.descripcion,
    whatsapp: datos.whatsapp,
    ciudad: datos.ciudad,
    fotoLogo: datos.fotoLogo || '',
    fotoPortada: datos.fotoPortada || '',
    productos: []
  }

  usuarios.push(nuevoUsuario)
  localStorage.setItem(STORAGE_KEYS.DB, JSON.stringify(usuarios))

  iniciarSesionSimulada(nuevoUsuario)
  return { success: true, message: 'Registro exitoso' }
}

// Autenticar credenciales
export function autenticarUsuario(
  email: string,
  password: string
): { success: boolean; message: string; usuario?: PerfilComercio } {
  if (typeof window === 'undefined')
    return { success: false, message: 'Entorno no soportado' }

  const usuarios = inicializarDB()
  const emailNorm = email.toLowerCase().trim()

  const usuario = usuarios.find((u) => u.email.toLowerCase() === emailNorm)

  if (!usuario) {
    return {
      success: false,
      message: 'El correo electrónico no está registrado.'
    }
  }

  if (usuario.password !== password) {
    return {
      success: false,
      message: 'Contraseña incorrecta. Inténtalo de nuevo.'
    }
  }

  iniciarSesionSimulada(usuario)

  const { password: _password, ...perfil } = usuario
  return { success: true, message: 'Ingreso exitoso', usuario: perfil }
}

function iniciarSesionSimulada(usuario: UsuarioCuenta) {
  const { password: _password, ...perfil } = usuario
  localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(perfil))
}

// Obtener sesión activa
export function obtenerSesionActiva(): PerfilComercio | null {
  if (typeof window === 'undefined') return null

  const sesionRaw = localStorage.getItem(STORAGE_KEYS.SESSION)
  if (!sesionRaw) return null

  try {
    const sesion = JSON.parse(sesionRaw) as PerfilComercio
    const usuarios = inicializarDB()
    const actualizado = usuarios.find((u) => u.id === sesion.id)
    if (actualizado) {
      const { password: _pw, ...perfil } = actualizado
      return perfil
    }
    return sesion
  } catch {
    return null
  }
}

// Cerrar sesión
export function cerrarSesion() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEYS.SESSION)
  }
}

// Actualizar perfil
export function actualizarPerfil(
  id: string,
  datos: Omit<PerfilComercio, 'id' | 'email' | 'productos'>
): { success: boolean; message: string } {
  if (typeof window === 'undefined')
    return { success: false, message: 'Entorno no soportado' }

  const usuarios = inicializarDB()
  const indice = usuarios.findIndex((u) => u.id === id)

  if (indice === -1) {
    return { success: false, message: 'Usuario no encontrado.' }
  }

  usuarios[indice] = {
    ...usuarios[indice],
    nombre_emprendimiento: datos.nombre_emprendimiento,
    categoria: datos.categoria,
    descripcion: datos.descripcion,
    whatsapp: datos.whatsapp,
    ciudad: datos.ciudad,
    fotoLogo: datos.fotoLogo || '',
    fotoPortada: datos.fotoPortada || ''
  }

  localStorage.setItem(STORAGE_KEYS.DB, JSON.stringify(usuarios))

  const { password: _pw, ...perfil } = usuarios[indice]
  localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(perfil))

  return { success: true, message: 'Perfil actualizado correctamente.' }
}

// Agregar producto/servicio (Validación condicional por rubro)
export function agregarProducto(
  usuarioId: string,
  producto: Omit<Producto, 'id'>
): { success: boolean; message: string; producto?: Producto } {
  if (typeof window === 'undefined')
    return { success: false, message: 'Entorno no soportado' }

  const usuarios = inicializarDB()
  const indice = usuarios.findIndex((u) => u.id === usuarioId)

  if (indice === -1) {
    return { success: false, message: 'Usuario no encontrado.' }
  }

  const categoria = usuarios[indice].categoria
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
    // Servicios: basta con descripción (foto es opcional)
    if (!tieneDescripcion) {
      return {
        success: false,
        message:
          'Para este rubro, la descripción es obligatoria. Podés agregar una foto o no, pero describí qué hacés.'
      }
    }
  } else {
    // Comidas, artesanías, estética, otros: requieren foto Y descripción
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

  const nuevoProducto: Producto = {
    id: `prod_${Date.now()}`,
    titulo: producto.titulo.trim(),
    descripcion: producto.descripcion.trim(),
    precio: producto.precio ? Number(producto.precio) : undefined,
    foto: tieneFoto ? producto.foto!.trim() : ''
  }

  usuarios[indice].productos.push(nuevoProducto)
  localStorage.setItem(STORAGE_KEYS.DB, JSON.stringify(usuarios))

  return {
    success: true,
    message: '¡Publicación agregada con éxito!',
    producto: nuevoProducto
  }
}

// Editar producto/servicio (Validación condicional por rubro)
export function editarProducto(
  usuarioId: string,
  productoId: string | number,
  nuevosDatos: Omit<Producto, 'id'>
): { success: boolean; message: string } {
  if (typeof window === 'undefined')
    return { success: false, message: 'Entorno no soportado' }

  const usuarios = inicializarDB()
  const usuarioIndice = usuarios.findIndex((u) => u.id === usuarioId)

  if (usuarioIndice === -1) {
    return { success: false, message: 'Usuario no encontrado.' }
  }

  const categoria = usuarios[usuarioIndice].categoria
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

  const productoIndice = usuarios[usuarioIndice].productos.findIndex(
    (p) => String(p.id) === String(productoId)
  )
  if (productoIndice === -1) {
    return {
      success: false,
      message: 'El producto o servicio a editar no existe.'
    }
  }

  usuarios[usuarioIndice].productos[productoIndice] = {
    id: productoId,
    titulo: nuevosDatos.titulo.trim(),
    descripcion: nuevosDatos.descripcion.trim(),
    precio: nuevosDatos.precio ? Number(nuevosDatos.precio) : undefined,
    foto: tieneFoto ? nuevosDatos.foto!.trim() : ''
  }

  localStorage.setItem(STORAGE_KEYS.DB, JSON.stringify(usuarios))
  return { success: true, message: '¡Publicación actualizada con éxito!' }
}

// Eliminar producto/servicio
export function eliminarProducto(
  usuarioId: string,
  productoId: string | number
): { success: boolean; message: string } {
  if (typeof window === 'undefined')
    return { success: false, message: 'Entorno no soportado' }

  const usuarios = inicializarDB()
  const indice = usuarios.findIndex((u) => u.id === usuarioId)

  if (indice === -1) {
    return { success: false, message: 'Usuario no encontrado.' }
  }

  const productosOriginales = usuarios[indice].productos
  usuarios[indice].productos = productosOriginales.filter(
    (p) => String(p.id) !== String(productoId)
  )

  if (usuarios[indice].productos.length === productosOriginales.length) {
    return { success: false, message: 'El producto o servicio no existe.' }
  }

  localStorage.setItem(STORAGE_KEYS.DB, JSON.stringify(usuarios))
  return {
    success: true,
    message: '¡Artículo/Servicio eliminado del catálogo!'
  }
}

// Obtener o guardar última localidad consultada
export function obtenerUltimaCiudad(): string {
  if (typeof window === 'undefined') return 'todas'
  return localStorage.getItem(STORAGE_KEYS.LAST_CITY) || 'todas'
}

export function guardarUltimaCiudad(ciudad: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEYS.LAST_CITY, ciudad)
  }
}
