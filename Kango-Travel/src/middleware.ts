import { type NextRequest, NextResponse } from 'next/server'
import createIntlMiddleware from 'next-intl/middleware'
import { routing } from '@/i18n/routing'
import { createServerClient } from '@supabase/ssr'

const intlMiddleware = createIntlMiddleware(routing)

const touristPatterns = ['/tourist', '/demand']
const driverPatterns  = ['/driver']
const authPatterns    = ['/login', '/register']

function stripLocale(pathname: string): string {
  return pathname.replace(/^\/(zh)/, '') || '/'
}

export async function middleware(request: NextRequest) {
  const intlResponse = intlMiddleware(request)

  // Refresh Supabase session on the intl response
  let response = intlResponse ?? NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = intlResponse ?? NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const path = stripLocale(request.nextUrl.pathname)

  const isTouristRoute = touristPatterns.some(p => path.startsWith(p))
  const isDriverRoute  = driverPatterns.some(p => path.startsWith(p))
  const isAuthRoute    = authPatterns.some(p => path.startsWith(p))

  const locale = request.nextUrl.pathname.startsWith('/zh') ? 'zh' : 'en'
  const loginPath = locale === 'zh' ? '/zh/login' : '/login'
  const homePath  = locale === 'zh' ? '/zh' : '/'

  if (!user && (isTouristRoute || isDriverRoute)) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = loginPath
    redirectUrl.searchParams.set('redirectTo', request.nextUrl.pathname)
    return NextResponse.redirect(redirectUrl)
  }

  if (user && isAuthRoute) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = homePath
    return NextResponse.redirect(redirectUrl)
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api|auth|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
