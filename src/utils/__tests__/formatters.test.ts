import { describe, it, expect } from 'vitest'
import { calcularIniciales, construirLinkWhatsApp } from '../formatters'

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
