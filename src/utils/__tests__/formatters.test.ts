import { describe, it, expect } from 'vitest'
import {
  calcularIniciales,
  construirLinkWhatsApp,
  escapeHtml,
  mezclarArray,
  detectarRedSocial,
  formatearPerfilParaCompartir
} from '../formatters'
import type { PerfilComercio } from '../constants'

describe('calcularIniciales', () => {
  it('should extract initials from a full name', () => {
    expect(calcularIniciales('La Cocina de Mabel')).toBe('LC')
  })

  it('should return up to 2 characters', () => {
    expect(calcularIniciales('Carlos Albornoz')).toBe('CA')
  })

  it('should handle single word names', () => {
    expect(calcularIniciales('Esencias')).toBe('E')
  })

  it('should uppercase the result', () => {
    expect(calcularIniciales('luciana gomez')).toBe('LG')
  })

  it('should handle empty string', () => {
    expect(calcularIniciales('')).toBe('')
  })
})

describe('construirLinkWhatsApp', () => {
  const whatsapp = '5491123456789'
  const nombre = 'Mabel'

  it('should build a basic WhatsApp link', () => {
    const link = construirLinkWhatsApp(whatsapp, nombre)
    expect(link).toContain('wa.me/5491123456789')
    expect(link).toContain(encodeURIComponent(nombre))
    expect(link).toContain('Hola')
  })

  it('should include product name when provided', () => {
    const link = construirLinkWhatsApp(whatsapp, nombre, 'Empanadas')
    expect(link).toContain(encodeURIComponent('Empanadas'))
  })

  it('should encode special characters in product name', () => {
    const link = construirLinkWhatsApp(whatsapp, nombre, 'Docena de empanadas')
    expect(link).toContain(encodeURIComponent("'"))
  })
})

describe('escapeHtml', () => {
  it('escapes & < > " and \'', () => {
    expect(escapeHtml('&<>"\'')).toBe('&amp;&lt;&gt;&quot;&#039;')
  })

  it('returns safe strings unchanged', () => {
    expect(escapeHtml('Hola mundo')).toBe('Hola mundo')
    expect(escapeHtml('123')).toBe('123')
  })

  it('handles empty string', () => {
    expect(escapeHtml('')).toBe('')
  })
})

describe('mezclarArray', () => {
  it('returns an array of the same length', () => {
    const input = [1, 2, 3, 4, 5]
    const result = mezclarArray(input)
    expect(result).toHaveLength(5)
  })

  it('does not mutate the original array', () => {
    const input = [1, 2, 3]
    const original = [...input]
    mezclarArray(input)
    expect(input).toEqual(original)
  })

  it('contains all original elements', () => {
    const input = [1, 2, 3, 4, 5]
    const result = mezclarArray(input)
    expect(result.sort()).toEqual(input.sort())
  })

  it('handles empty array', () => {
    expect(mezclarArray([])).toEqual([])
  })

  it('handles single element', () => {
    expect(mezclarArray([1])).toEqual([1])
  })
})

describe('detectarRedSocial', () => {
  it('detects instagram', () => {
    expect(detectarRedSocial('https://instagram.com/usuario')).toBe('instagram')
    expect(detectarRedSocial('https://www.instagram.com/usuario')).toBe(
      'instagram'
    )
  })

  it('detects facebook', () => {
    expect(detectarRedSocial('https://facebook.com/usuario')).toBe('facebook')
    expect(detectarRedSocial('https://www.facebook.com/usuario')).toBe(
      'facebook'
    )
    expect(detectarRedSocial('https://fb.com/usuario')).toBe('facebook')
  })

  it('detects generic web', () => {
    expect(detectarRedSocial('https://mipagina.com')).toBe('web')
    expect(detectarRedSocial('https://ejemplo.com.ar')).toBe('web')
  })
})

describe('formatearPerfilParaCompartir', () => {
  it('formats profile for sharing', () => {
    const perfil = {
      nombreEmprendimiento: 'La Cocina de Mabel',
      categoria: 'comidas' as const,
      ciudad: 'Tandil'
    } as PerfilComercio
    expect(formatearPerfilParaCompartir(perfil)).toBe(
      'La Cocina de Mabel — comidas en Tandil'
    )
  })
})
