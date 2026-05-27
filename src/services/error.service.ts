export function traducirError(error: { message?: string } | null): string {
  if (!error?.message) return 'Ocurrió un error inesperado.'
  const msg = error.message
  if (msg.includes('Bucket not found'))
    return 'El bucket de almacenamiento no está configurado. Verificá Supabase Storage.'
  if (msg.includes('Invalid login credentials'))
    return 'Correo electrónico o contraseña incorrectos.'
  if (
    msg.includes('duplicate key value') ||
    msg.includes('User already registered')
  )
    return 'Este correo electrónico ya está registrado.'
  if (msg.includes('Email not confirmed'))
    return 'El correo electrónico no está confirmado.'
  if (msg.includes('Email rate limit exceeded'))
    return 'Demasiados intentos. Esperá unos minutos y volvé a intentar.'
  if (msg.includes('new row violates row-level security policy'))
    return 'No tenés permisos para realizar esta acción.'
  if (msg.includes('JWT')) return 'La sesión expiró. Iniciá sesión nuevamente.'
  if (msg.includes('does not exist') || msg.includes('not found'))
    return 'El recurso solicitado no existe.'
  return msg
}
