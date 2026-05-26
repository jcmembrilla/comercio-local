/// <reference types="astro/client" />

interface ToastOptions {
  message: string
  type?: 'success' | 'error' | 'info'
  duration?: number
}

interface Window {
  mostrarToast?: (options: ToastOptions) => void
}
