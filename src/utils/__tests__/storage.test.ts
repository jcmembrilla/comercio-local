import { describe, it, expect, beforeEach } from 'vitest'
import {
  inicializarDB,
  obtenerPublicaciones,
  registrarUsuario,
  autenticarUsuario,
  obtenerSesionActiva,
  actualizarPerfil,
  agregarProducto,
  eliminarProducto,
  obtenerCiudadesActivas,
  obtenerPerfilPorId
} from '../storage'

beforeEach(() => {
  localStorage.clear()
})

describe('inicializarDB', () => {
  it('should seed the database with initial profiles', () => {
    const db = inicializarDB()
    expect(db.length).toBeGreaterThanOrEqual(5)
    expect(db[0].email).toBeDefined()
  })

  it('should return stored data on subsequent calls', () => {
    inicializarDB()
    const db2 = inicializarDB()
    expect(db2.length).toBeGreaterThanOrEqual(5)
  })
})

describe('obtenerPublicaciones', () => {
  it('should return profiles without passwords', () => {
    inicializarDB()
    const perfiles = obtenerPublicaciones()
    expect(perfiles.length).toBeGreaterThan(0)
    expect(perfiles[0]).not.toHaveProperty('password')
  })

  it('should filter by city when provided', () => {
    inicializarDB()
    const ayacucho = obtenerPublicaciones('Ayacucho')
    ayacucho.forEach((p) => {
      expect(p.ciudad.toLowerCase()).toBe('ayacucho')
    })
  })
})

describe('registrarUsuario', () => {
  const validProfile = {
    nombre_emprendimiento: 'Test User',
    categoria: 'comidas' as const,
    descripcion: 'Test description',
    whatsapp: '5491100000000',
    ciudad: 'Ayacucho',
    fotoLogo: '',
    fotoPortada: ''
  }

  it('should register a new user', () => {
    const res = registrarUsuario('test@test.com', 'test123', validProfile)
    expect(res.success).toBe(true)
  })

  it('should reject duplicate emails', () => {
    registrarUsuario('test@test.com', 'test123', validProfile)
    const res = registrarUsuario('test@test.com', 'test456', validProfile)
    expect(res.success).toBe(false)
    expect(res.message).toContain('registrado')
  })

  it('should auto-login after registration', () => {
    const res = registrarUsuario('unique@test.com', 'test123', validProfile)
    expect(res.success).toBe(true)

    const sesion = obtenerSesionActiva()
    expect(sesion).not.toBeNull()
    expect(sesion?.email).toBe('unique@test.com')
  })
})

describe('autenticarUsuario', () => {
  it('should login with correct credentials', () => {
    const res = autenticarUsuario('mabel@local.com', 'mabel123')
    expect(res.success).toBe(true)
    expect(res.usuario?.nombre_emprendimiento).toBe('La Cocina de Mabel')
  })

  it('should reject wrong password', () => {
    const res = autenticarUsuario('mabel@local.com', 'wrongpass')
    expect(res.success).toBe(false)
    expect(res.message).toContain('Contraseña')
  })

  it('should reject unregistered email', () => {
    const res = autenticarUsuario('noexiste@test.com', 'test123')
    expect(res.success).toBe(false)
    expect(res.message).toContain('registrado')
  })
})

describe('actualizarPerfil', () => {
  it('should update profile fields', () => {
    inicializarDB()
    const res = autenticarUsuario('mabel@local.com', 'mabel123')
    expect(res.success).toBe(true)
    const id = res.usuario!.id

    const update = actualizarPerfil(id, {
      nombre_emprendimiento: 'Mabel Updated',
      categoria: 'comidas',
      descripcion: 'Nueva descripcion',
      whatsapp: '5491199999999',
      ciudad: 'Tandil',
      fotoLogo: '',
      fotoPortada: ''
    })
    expect(update.success).toBe(true)

    const sesion = obtenerSesionActiva()
    expect(sesion?.nombre_emprendimiento).toBe('Mabel Updated')
    expect(sesion?.ciudad).toBe('Tandil')
  })
})

describe('agregarProducto', () => {
  it('should add a product to a user', () => {
    inicializarDB()
    const res = autenticarUsuario('mabel@local.com', 'mabel123')
    const id = res.usuario!.id

    const prod = agregarProducto(id, {
      titulo: 'Torta de chocolate',
      descripcion: 'Torta húmeda con dulce de leche',
      precio: 5000,
      foto: 'https://example.com/torta.jpg'
    })
    expect(prod.success).toBe(true)

    const sesion = obtenerSesionActiva()
    expect(sesion?.productos.length).toBeGreaterThanOrEqual(2)
  })

  it('should reject product without title', () => {
    inicializarDB()
    const res = autenticarUsuario('mabel@local.com', 'mabel123')
    const id = res.usuario!.id

    const prod = agregarProducto(id, {
      titulo: '',
      descripcion: 'Test',
      foto: 'https://example.com/img.jpg'
    })
    expect(prod.success).toBe(false)
    expect(prod.message).toContain('título')
  })
})

describe('eliminarProducto', () => {
  it('should remove a product from the user', () => {
    inicializarDB()
    autenticarUsuario('mabel@local.com', 'mabel123')
    const sesion = obtenerSesionActiva()
    const prodId = sesion!.productos[0].id
    const id = sesion!.id

    const del = eliminarProducto(id, prodId)
    expect(del.success).toBe(true)

    const updated = obtenerSesionActiva()
    expect(updated?.productos.length).toBe(0)
  })
})

describe('obtenerCiudadesActivas', () => {
  it('should return unique sorted cities', () => {
    inicializarDB()
    const ciudades = obtenerCiudadesActivas()
    expect(ciudades).toContain('Ayacucho')
    expect(ciudades).toContain('Tandil')
    expect(ciudades).toContain('Balcarce')
    expect(ciudades).toContain('Rauch')
  })
})

describe('obtenerPerfilPorId', () => {
  it('should return a profile by ID', () => {
    inicializarDB()
    const perfil = obtenerPerfilPorId('usr_mabel')
    expect(perfil).not.toBeNull()
    expect(perfil?.nombre_emprendimiento).toBe('La Cocina de Mabel')
  })

  it('should return null for non-existent ID', () => {
    inicializarDB()
    const perfil = obtenerPerfilPorId('usr_nonexistent')
    expect(perfil).toBeNull()
  })
})
