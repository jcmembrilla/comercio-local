import { describe, it, expect } from 'vitest'
import { isBlob, isFile } from '../typeGuards'

describe('isBlob', () => {
  it('returns true for a Blob', () => {
    const blob = new Blob(['test'], { type: 'text/plain' })
    expect(isBlob(blob)).toBe(true)
  })

  it('returns true for a File (which extends Blob)', () => {
    const file = new File(['test'], 'test.txt', { type: 'text/plain' })
    expect(isBlob(file)).toBe(true)
  })

  it('returns false for a string', () => {
    expect(isBlob('hello')).toBe(false)
  })

  it('returns false for a number', () => {
    expect(isBlob(42)).toBe(false)
  })

  it('returns false for null', () => {
    expect(isBlob(null)).toBe(false)
  })

  it('returns false for undefined', () => {
    expect(isBlob(undefined)).toBe(false)
  })

  it('returns false for an object without size/type', () => {
    expect(isBlob({})).toBe(false)
  })
})

describe('isFile', () => {
  it('returns true for a File', () => {
    const file = new File(['test'], 'test.txt', { type: 'text/plain' })
    expect(isFile(file)).toBe(true)
  })

  it('returns false for a Blob (no name property)', () => {
    const blob = new Blob(['test'], { type: 'text/plain' })
    expect(isFile(blob)).toBe(false)
  })

  it('returns false for a string', () => {
    expect(isFile('hello')).toBe(false)
  })

  it('returns false for null', () => {
    expect(isFile(null)).toBe(false)
  })
})
