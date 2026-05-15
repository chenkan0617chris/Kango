import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// POST /api/auth — register with role selection
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { email, password, full_name, role } = await request.json()

  if (!email || !password || !role || !['tourist', 'driver'].includes(role)) {
    return NextResponse.json({ error: '参数错误' }, { status: 400 })
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name, role },
    },
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  return NextResponse.json({ data }, { status: 201 })
}
