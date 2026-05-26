const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/reverse'

function extraerCiudad(data: {
  address?: { city?: string; town?: string; village?: string; county?: string }
}): string | null {
  return (
    data.address?.city ||
    data.address?.town ||
    data.address?.village ||
    data.address?.county ||
    null
  )
}

async function obtenerCiudadPorCoordenadas(
  lat: number,
  lng: number
): Promise<string | null> {
  const url = `${NOMINATIM_URL}?format=jsonv2&lat=${lat}&lon=${lng}&accept-language=es`
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'ComercioLocal/1.0' }
    })
    if (!res.ok) return null
    const data = await res.json()
    return extraerCiudad(data)
  } catch {
    return null
  }
}

export async function detectarLocalidad(
  ciudadesValidas: string[]
): Promise<string | null> {
  if (typeof navigator === 'undefined') return null

  let coords: { latitude: number; longitude: number }
  try {
    const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('timeout'))
      }, 10000)
      navigator.geolocation.getCurrentPosition(
        (p) => {
          clearTimeout(timeout)
          resolve(p)
        },
        (err) => {
          clearTimeout(timeout)
          reject(err)
        },
        { enableHighAccuracy: false, timeout: 8000, maximumAge: 600000 }
      )
    })
    coords = { latitude: pos.coords.latitude, longitude: pos.coords.longitude }
  } catch {
    return null
  }

  const ciudad = await obtenerCiudadPorCoordenadas(
    coords.latitude,
    coords.longitude
  )
  if (!ciudad) return null

  const match = ciudadesValidas.find(
    (c) => c.toLowerCase() === ciudad.toLowerCase()
  )
  if (match) return match

  const normalizado = ciudad.trim()
  const matchNormalizado = ciudadesValidas.find(
    (c) => c.toLowerCase() === normalizado.toLowerCase()
  )
  return matchNormalizado || null
}
