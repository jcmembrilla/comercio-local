import { vi, describe, it, expect } from 'vitest'

vi.mock('../../utils/supabase', () => ({
  supabase: {}
}))

import { isCategoriaRubro, validarCategoriaRubro } from '../profile.service'

describe('isCategoriaRubro', () => {
  it('returns true for valid categories', () => {
    expect(isCategoriaRubro('comidas')).toBe(true)
    expect(isCategoriaRubro('oficios')).toBe(true)
    expect(isCategoriaRubro('artesanias')).toBe(true)
    expect(isCategoriaRubro('jardineria')).toBe(true)
    expect(isCategoriaRubro('estetica')).toBe(true)
    expect(isCategoriaRubro('educacion')).toBe(true)
    expect(isCategoriaRubro('tecnologia')).toBe(true)
    expect(isCategoriaRubro('otros')).toBe(true)
  })

  it('returns false for invalid categories', () => {
    expect(isCategoriaRubro('invalid')).toBe(false)
    expect(isCategoriaRubro('')).toBe(false)
    expect(isCategoriaRubro('COMIDAS')).toBe(false)
  })

  it('returns false for non-string values', () => {
    expect(isCategoriaRubro(null)).toBe(false)
    expect(isCategoriaRubro(undefined)).toBe(false)
    expect(isCategoriaRubro(42)).toBe(false)
    expect(isCategoriaRubro({})).toBe(false)
  })
})

describe('validarCategoriaRubro', () => {
  it('returns the category string for valid categories', () => {
    expect(validarCategoriaRubro('comidas')).toBe('comidas')
    expect(validarCategoriaRubro('tecnologia')).toBe('tecnologia')
    expect(validarCategoriaRubro('otros')).toBe('otros')
  })

  it('returns null for invalid categories', () => {
    expect(validarCategoriaRubro('invalid')).toBeNull()
    expect(validarCategoriaRubro('')).toBeNull()
  })

  it('returns null for non-string values', () => {
    expect(validarCategoriaRubro(null)).toBeNull()
    expect(validarCategoriaRubro(undefined)).toBeNull()
  })
})
