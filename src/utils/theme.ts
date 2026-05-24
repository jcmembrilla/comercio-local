const STORAGE_KEY = 'comercio_local_theme'

export function obtenerTema(): 'light' | 'dark' {
  if (typeof localStorage === 'undefined') return 'dark'
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored === 'light' || stored === 'dark') return stored
  return 'dark'
}

export function aplicarTema(tema: 'light' | 'dark') {
  document.documentElement.classList.toggle('light', tema === 'light')
}

export function cambiarTema(tema: 'light' | 'dark') {
  localStorage.setItem(STORAGE_KEY, tema)
  aplicarTema(tema)
}

export function initTheme() {
  const tema = obtenerTema()
  aplicarTema(tema)
}
