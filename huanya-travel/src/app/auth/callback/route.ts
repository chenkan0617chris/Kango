import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'
  const origin = request.nextUrl.origin

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=no_code`)
  }

  // Create the final redirect response up-front so we can attach session
  // cookies directly to it. Cookies set via cookies().set() are NOT reliably
  // included when returning a NextResponse.redirect() — attaching them
  // explicitly to the response object is the safe pattern.
  const response = NextResponse.redirect(`${origin}${next}`)

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  const { data, error } = await supabase.auth.exchangeCodeForSession(code)

  if (error || !data.user) {
    return NextResponse.redirect(`${origin}/login?error=auth_callback_error`)
  }

  // Ensure profile row exists — the DB trigger may not fire on all Supabase configs
  const admin = createAdminClient()
  const { data: existing } = await admin
    .from('profiles')
    .select('id')
    .eq('id', data.user.id)
    .maybeSingle()

  if (!existing) {
    const meta = data.user.user_metadata
    await admin.from('profiles').insert({
      id: data.user.id,
      full_name: meta?.full_name ?? meta?.name ?? data.user.email?.split('@')[0] ?? 'User',
      role: 'tourist',
    })
  }

  return response
}
