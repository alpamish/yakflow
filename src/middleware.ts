import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

const publicPaths = ['/login', '/register']
const publicApiPaths = ['/api/auth', '/api/register']
const staticPaths = ['/_next', '/favicon', '/yakflow.png', '/yakflow-full.png']

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl
    const token = req.nextauth.token

    if (publicPaths.includes(pathname)) return NextResponse.next()
    if (publicApiPaths.some((p) => pathname.startsWith(p))) return NextResponse.next()
    if (staticPaths.some((p) => pathname.startsWith(p))) return NextResponse.next()

    if (!token) {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json(
          { success: false, error: 'Unauthorized' },
          { status: 401 }
        )
      }
      const loginUrl = new URL('/login', req.url)
      loginUrl.searchParams.set('callbackUrl', pathname)
      return NextResponse.redirect(loginUrl)
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl

        if (publicPaths.includes(pathname)) return true
        if (publicApiPaths.some((p) => pathname.startsWith(p))) return true
        if (staticPaths.some((p) => pathname.startsWith(p))) return true
        if (pathname.startsWith('/api/')) return true

        return !!token
      },
    },
  }
)

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|yakflow.png|yakflow-full.png).*)'],
}
