import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import { fileURLToPath } from 'url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const envPath = resolve(__dirname, '..', '.env')
const envContent = readFileSync(envPath, 'utf-8')

function env(key) {
  const m = envContent.match(new RegExp(`^${key}=(.+)`, 'm'))
  return m ? m[1].trim() : ''
}

const supabaseUrl = env('PUBLIC_SUPABASE_URL')
const supabaseKey = env('PUBLIC_SUPABASE_ANON_KEY')

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

const seedUsers = [
  {
    email: 'carlos@local.com',
    password: 'carlos123',
    oldId: 'usr_carlos',
    name: 'Carlos Albornoz'
  },
  {
    email: 'esencias@local.com',
    password: 'esencias123',
    oldId: 'usr_esencias',
    name: 'Esencias del Alma'
  },
  {
    email: 'elena@local.com',
    password: 'elena123',
    oldId: 'usr_elena',
    name: 'Elena Martínez'
  },
  {
    email: 'tapices@local.com',
    password: 'tapices123',
    oldId: 'usr_tapestry',
    name: 'Taller de Tapices Renacer'
  }
]

async function main() {
  for (const { email, password, oldId, name } of seedUsers) {
    console.log(`\n--- ${email} (${name}) ---`)

    // Create auth user
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email,
      password
    })

    if (signUpError) {
      // User may already exist — try signing in to get the UUID
      const { data: si, error: siErr } = await supabase.auth.signInWithPassword(
        { email, password }
      )
      if (siErr) {
        console.log(`  Error: ${siErr.message}`)
        continue
      }
      if (si.user) {
        // Change old profile email, insert new, update products, delete old
        const newId = si.user.id
        const { data: oldProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', oldId)
          .maybeSingle()
        if (!oldProfile) {
          console.log('  No profile found for', oldId)
          continue
        }
        await supabase
          .from('profiles')
          .update({ email: `old_${email}` })
          .eq('id', oldId)
        const { error: ins } = await supabase.from('profiles').insert({
          id: newId,
          email,
          password: oldProfile.password,
          nombre_emprendimiento: oldProfile.nombre_emprendimiento,
          categoria: oldProfile.categoria,
          descripcion: oldProfile.descripcion,
          whatsapp: oldProfile.whatsapp,
          ciudad: oldProfile.ciudad,
          direccion: oldProfile.direccion,
          lat: oldProfile.lat,
          lng: oldProfile.lng,
          foto_logo: oldProfile.foto_logo,
          foto_portada: oldProfile.foto_portada
        })
        if (ins) {
          console.log('  Insert error:', ins.message)
          continue
        }
        await supabase
          .from('products')
          .update({ profile_id: newId })
          .eq('profile_id', oldId)
        await supabase.from('profiles').delete().eq('id', oldId)
        console.log(`  Profile migrated to ${newId}`)
      }
      continue
    }

    const userId = authData.user?.id
    if (!userId) {
      console.log('  No user ID')
      continue
    }
    console.log(`  Auth user created: ${userId}`)

    const { data: oldProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', oldId)
      .maybeSingle()
    if (!oldProfile) {
      console.log('  No profile found for', oldId)
      continue
    }

    // Change old email to avoid unique conflict, insert new with UUID, update products, delete old
    await supabase
      .from('profiles')
      .update({ email: `old_${email}` })
      .eq('id', oldId)
    const { error: ins } = await supabase.from('profiles').insert({
      id: userId,
      email,
      password: oldProfile.password,
      nombre_emprendimiento: oldProfile.nombre_emprendimiento,
      categoria: oldProfile.categoria,
      descripcion: oldProfile.descripcion,
      whatsapp: oldProfile.whatsapp,
      ciudad: oldProfile.ciudad,
      direccion: oldProfile.direccion,
      lat: oldProfile.lat,
      lng: oldProfile.lng,
      foto_logo: oldProfile.foto_logo,
      foto_portada: oldProfile.foto_portada
    })
    if (ins) {
      console.log('  Insert error:', ins.message)
      continue
    }
    await supabase
      .from('products')
      .update({ profile_id: userId })
      .eq('profile_id', oldId)
    await supabase.from('profiles').delete().eq('id', oldId)
    console.log(`  Profile migrated to ${userId}`)
  }

  console.log('\nDone!')
}

main()
