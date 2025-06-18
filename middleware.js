import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';

export async function middleware(req) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });
  const { pathname } = req.nextUrl;

  // LOGS DEBUG
  console.log('=== MIDDLEWARE DEBUG ===');
  console.log('URL:', req.url);
  console.log('Pathname:', pathname);
  console.log('Cookies:', req.cookies.getAll());

  const { data: { session } } = await supabase.auth.getSession();
  console.log('Session middleware:', session);

  // Routes publiques qui ne nécessitent pas d'authentification
  const publicRoutes = ['/Login', '/Login/ResetPassword', '/Login/update-password'];
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));

  // Vérifier si c'est une tentative de réinitialisation de mot de passe
  const isPasswordReset = pathname.startsWith('/Login/update-password') && req.nextUrl.searchParams.has('code');

  if (isPublicRoute || isPasswordReset) {
    console.log('Route publique ou réinitialisation de mot de passe détectée, accès autorisé');
    return res;
  }

  if (!session) {
    console.log('Session non trouvée, redirection vers /Login');
    const redirectUrl = new URL('/Login', req.url);
    return NextResponse.redirect(redirectUrl);
  }

  console.log('Session trouvée, accès autorisé');
  return res;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
}; 