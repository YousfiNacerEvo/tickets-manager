import { NextResponse } from 'next/server'

export function middleware(request) {
  const token = request.cookies.get('token')?.value
  const { pathname } = request.nextUrl

  // Si l'utilisateur n'est pas connecté et essaie d'accéder à une route protégée
  if (!token && pathname !== '/Login') {
    const loginUrl = new URL('/Login', request.url)
    loginUrl.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Si l'utilisateur est connecté et essaie d'accéder à la page de login
  if (token && pathname === '/Login') {
    const redirectTo = request.nextUrl.searchParams.get('redirectTo') || '/dashboard'
    return NextResponse.redirect(new URL(redirectTo, request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/Login']
} 