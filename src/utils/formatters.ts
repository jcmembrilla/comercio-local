import type { PerfilComercio } from './constants'

export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

export function mezclarArray<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function calcularIniciales(nombre: string): string {
  return nombre
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

export function construirLinkWhatsApp(
  whatsapp: string,
  nombre: string,
  producto?: string
): string {
  const base = `https://wa.me/${whatsapp}?text=Hola%20${encodeURIComponent(nombre)},%20vi%20tu%20perfil%20en%20Comercio%20Local`
  if (producto) {
    return `${base}%20y%20me%20interesa%20'${encodeURIComponent(producto)}'`
  }
  return `${base}%20y%20me%20interesa%20lo%20que%20ofrecés.`
}

export function formatearPerfilParaCompartir(perfil: PerfilComercio): string {
  return `${perfil.nombre_emprendimiento} — ${perfil.categoria} en ${perfil.ciudad}`
}

export function detectarRedSocial(
  url: string
): 'instagram' | 'facebook' | 'web' {
  const lower = url.toLowerCase()
  if (lower.includes('instagram.com')) return 'instagram'
  if (lower.includes('facebook.com') || lower.includes('fb.com'))
    return 'facebook'
  return 'web'
}

export function renderizarEstrellas(promedio: number, total: number): string {
  const estrellas = Math.round(promedio)
  let html = ''
  for (let i = 0; i < 5; i++) {
    html += `<span class="${i < estrellas ? 'text-amber-400' : ''}" style="${i >= estrellas ? 'color: var(--tertiary)' : ''}">★</span>`
  }
  html += ` <span class="text-xs" style="color: var(--tertiary)">${promedio} (${total})</span>`
  return html
}
