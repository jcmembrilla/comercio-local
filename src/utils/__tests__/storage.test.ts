import { describe, it, expect, beforeEach, vi } from 'vitest'
import type { Mock } from 'vitest'

type ChainResult = { data: unknown; error: unknown }

const sessionResolvers: {
  getSession: () => Promise<{ data: { session: unknown } }>
} = {
  getSession: () => Promise.resolve({ data: { session: null } })
}

const mockAuth = {
  signUp: vi.fn(),
  signInWithPassword: vi.fn(),
  signOut: vi.fn(),
  getSession: vi.fn(() => sessionResolvers.getSession())
}

function resolveThenable(v: ChainResult): ChainResult & Promise<ChainResult> {
  return Object.assign(Promise.resolve(v), v)
}

function makeChain(result: ChainResult) {
  const chain = {
    select: vi.fn(() => chain),
    order: vi.fn(() => chain),
    eq: vi.fn(() => chain),
    not: vi.fn(() => chain),
    maybeSingle: vi.fn(() => resolveThenable(result)),
    insert: vi.fn(() => resolveThenable(result)),
    update: vi.fn(() => resolveThenable(result)),
    delete: vi.fn(() => chain),
    then: (resolve: (v: ChainResult) => unknown) => resolve(result)
  }
  return chain
}

let mockFrom: Mock = vi.fn()

vi.mock('../supabase', () => ({
  supabase: {
    from: (...args: unknown[]) =>
      (mockFrom as (...a: unknown[]) => unknown)(...args),
    auth: mockAuth
  }
}))

beforeEach(() => {
  vi.clearAllMocks()
  mockFrom = vi.fn()
  sessionResolvers.getSession = () =>
    Promise.resolve({ data: { session: null } })
})

const mockProfileRow = {
  id: 'usr_mabel',
  email: 'mabel@local.com',
  nombre_emprendimiento: 'La Cocina de Mabel',
  categoria: 'comidas',
  descripcion: 'Comidas caseras y tartas',
  whatsapp: '5491100000000',
  ciudad: 'Ayacucho',
  foto_logo: '',
  foto_portada: '',
  direccion: '',
  lat: null,
  lng: null,
  products: [
    {
      id: 'prod_001',
      profile_id: 'usr_mabel',
      titulo: 'Tarta de verduras',
      descripcion: 'Tarta de zapallo y calabaza',
      precio: 4000,
      foto: ''
    }
  ]
}

describe('obtenerPublicaciones', () => {
  it('should return profiles without passwords', async () => {
    const chain = makeChain({ data: [mockProfileRow], error: null })
    mockFrom.mockReturnValue(chain)

    const { obtenerPublicaciones } = await import('../storage')
    const perfiles = await obtenerPublicaciones()
    expect(perfiles.length).toBeGreaterThan(0)
    expect(perfiles[0]).not.toHaveProperty('password')
  })

  it('should filter by city when provided', async () => {
    const chain = makeChain({ data: [mockProfileRow], error: null })
    mockFrom.mockReturnValue(chain)

    const { obtenerPublicaciones } = await import('../storage')
    const ayacucho = await obtenerPublicaciones('Ayacucho')
    for (const p of ayacucho) {
      expect(p.ciudad.toLowerCase()).toBe('ayacucho')
    }
  })
})

describe('obtenerCiudadesActivas', () => {
  it('should return unique sorted cities', async () => {
    const chain = makeChain({
      data: [
        { ciudad: 'Ayacucho' },
        { ciudad: 'Tandil' },
        { ciudad: 'Ayacucho' }
      ],
      error: null
    })
    mockFrom.mockReturnValue(chain)

    const { obtenerCiudadesActivas } = await import('../storage')
    const ciudades = await obtenerCiudadesActivas()
    expect(ciudades).toContain('Ayacucho')
    expect(ciudades).toContain('Tandil')
  })
})

describe('obtenerPerfilPorId', () => {
  it('should return a profile by ID', async () => {
    const chain = makeChain({ data: mockProfileRow, error: null })
    mockFrom.mockReturnValue(chain)

    const { obtenerPerfilPorId } = await import('../storage')
    const perfil = await obtenerPerfilPorId('usr_mabel')
    expect(perfil).not.toBeNull()
    expect(perfil?.nombre_emprendimiento).toBe('La Cocina de Mabel')
  })

  it('should return null for non-existent ID', async () => {
    const chain = makeChain({ data: null, error: null })
    mockFrom.mockReturnValue(chain)

    const { obtenerPerfilPorId } = await import('../storage')
    const perfil = await obtenerPerfilPorId('usr_nonexistent')
    expect(perfil).toBeNull()
  })
})
