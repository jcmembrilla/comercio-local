import type { PerfilComercio } from './constants'

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
