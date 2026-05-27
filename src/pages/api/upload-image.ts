import type { APIRoute } from 'astro'
import { createClient } from '@supabase/supabase-js'

export const POST: APIRoute = async ({ request }) => {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const userId = formData.get('userId') as string
    const nombre = formData.get('nombre') as string

    if (!file || !userId || !nombre) {
      return new Response(JSON.stringify({ error: 'Parámetros inválidos' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const SUPABASE_URL = import.meta.env.PUBLIC_SUPABASE_URL
    const SUPABASE_SERVICE_ROLE_KEY = import.meta.env.SUPABASE_SERVICE_ROLE_KEY

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return new Response(
        JSON.stringify({
          error: 'Faltan variables de entorno de Supabase en el servidor'
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    const supabaseServer = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    const buffer = Buffer.from(await file.arrayBuffer())

    // Validar tamaño (Max 2MB)
    if (buffer.length > 2 * 1024 * 1024) {
      return new Response(
        JSON.stringify({ error: 'La imagen supera los 2MB permitidos' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    const ext = file.type.split('/')[1] || 'webp'
    const path = `${userId}/${nombre}.${ext}`
    const BUCKET_NAME = 'comercio-local'

    const { error: uploadError } = await supabaseServer.storage
      .from(BUCKET_NAME)
      .upload(path, buffer, { upsert: true, contentType: file.type })

    if (uploadError) {
      return new Response(JSON.stringify({ error: uploadError.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const { data } = supabaseServer.storage.from(BUCKET_NAME).getPublicUrl(path)

    return new Response(JSON.stringify({ publicUrl: data.publicUrl }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error desconocido'
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}
