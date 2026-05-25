/**
 * Seed test users into Supabase (bypasses email confirmation).
 * Usage: node scripts/seed-test-users.mjs
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const __filename = fileURLToPath(import.meta.url)
const __dirname  = path.dirname(__filename)
config({ path: path.resolve(__dirname, '..', '.env.local') })

const SUPABASE_URL              = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const users = [
  {
    email:    'test-tourist@kango.local',
    password: 'Test1234!',
    role:     'tourist',
    full_name: '测试游客',
    phone:    '+61400000001',
  },
  {
    email:    'test-driver@kango.local',
    password: 'Test1234!',
    role:     'driver',
    full_name: '测试司机',
    phone:    '+61400000002',
    vehicle_type:  'Toyota Alphard 7座',
    vehicle_plate: 'TEST001',
    license_no:    'DA-TEST-001',
    is_verified:   true,
  },
]

async function findUserByEmail(email) {
  let page = 1
  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 })
    if (error) throw error
    const hit = data.users.find(u => u.email?.toLowerCase() === email.toLowerCase())
    if (hit) return hit
    if (data.users.length < 200) return null
    page += 1
  }
}

async function upsertUser(u) {
  const existing = await findUserByEmail(u.email)
  let userId
  if (existing) {
    const { data, error } = await admin.auth.admin.updateUserById(existing.id, {
      password:       u.password,
      email_confirm:  true,
      user_metadata: { role: u.role, full_name: u.full_name },
    })
    if (error) throw error
    userId = data.user.id
    console.log(`  updated existing auth user (${u.email})`)
  } else {
    const { data, error } = await admin.auth.admin.createUser({
      email:         u.email,
      password:      u.password,
      email_confirm: true,
      user_metadata: { role: u.role, full_name: u.full_name },
    })
    if (error) throw error
    userId = data.user.id
    console.log(`  created new auth user (${u.email})`)
  }

  const profile = {
    id:          userId,
    role:        u.role,
    full_name:   u.full_name,
    phone:       u.phone ?? null,
    license_no:    u.license_no    ?? null,
    vehicle_type:  u.vehicle_type  ?? null,
    vehicle_plate: u.vehicle_plate ?? null,
    is_verified:   u.is_verified ?? false,
  }
  const { error: profileErr } = await admin.from('profiles').upsert(profile, { onConflict: 'id' })
  if (profileErr) throw profileErr
  console.log(`  upserted profile row (role=${u.role})`)
  return userId
}

async function main() {
  console.log('Seeding test users into', SUPABASE_URL)
  for (const u of users) {
    console.log(`\n${u.email}`)
    await upsertUser(u)
  }
  console.log('\n================ Test Credentials ================')
  for (const u of users) {
    console.log(`  ${u.role.padEnd(7)}  email: ${u.email}    password: ${u.password}`)
  }
  console.log('==================================================')
  console.log('Login at http://localhost:3000/login')
}

main().catch(err => {
  console.error('Seed failed:', err)
  process.exit(1)
})
