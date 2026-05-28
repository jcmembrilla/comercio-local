import { describe, it, expect } from 'vitest'
import { traducirError } from '../error.service'

describe('traducirError', () => {
  it('returns generic message for null error', () => {
    expect(traducirError(null)).toBe('Ocurrió un error inesperado.')
  })

  it('returns generic message for error without message', () => {
    expect(traducirError({})).toBe('Ocurrió un error inesperado.')
  })

  it('translates Bucket not found', () => {
    expect(traducirError({ message: 'Bucket not found' })).toBe(
      'El bucket de almacenamiento no está configurado. Verificá Supabase Storage.'
    )
  })

  it('translates Invalid login credentials', () => {
    expect(traducirError({ message: 'Invalid login credentials' })).toBe(
      'Correo electrónico o contraseña incorrectos.'
    )
  })

  it('translates duplicate key value', () => {
    expect(traducirError({ message: 'duplicate key value' })).toBe(
      'Este correo electrónico ya está registrado.'
    )
  })

  it('translates User already registered', () => {
    expect(traducirError({ message: 'User already registered' })).toBe(
      'Este correo electrónico ya está registrado.'
    )
  })

  it('translates Email not confirmed', () => {
    expect(traducirError({ message: 'Email not confirmed' })).toBe(
      'El correo electrónico no está confirmado.'
    )
  })

  it('translates Email rate limit exceeded', () => {
    expect(traducirError({ message: 'Email rate limit exceeded' })).toBe(
      'Demasiados intentos. Esperá unos minutos y volvé a intentar.'
    )
  })

  it('translates new row violates row-level security policy', () => {
    expect(
      traducirError({
        message: 'new row violates row-level security policy'
      })
    ).toBe('No tenés permisos para realizar esta acción.')
  })

  it('translates JWT errors', () => {
    expect(traducirError({ message: 'JWT expired' })).toBe(
      'La sesión expiró. Iniciá sesión nuevamente.'
    )
  })

  it('translates does not exist', () => {
    expect(traducirError({ message: 'relation does not exist' })).toBe(
      'El recurso solicitado no existe.'
    )
  })

  it('translates not found', () => {
    expect(traducirError({ message: 'profile not found' })).toBe(
      'El recurso solicitado no existe.'
    )
  })

  it('returns original message for unknown errors', () => {
    expect(traducirError({ message: 'Algo salió mal' })).toBe('Algo salió mal')
  })
})
