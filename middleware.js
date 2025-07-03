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

  // Routes publiques qui ne nécessitent pas d'authentification
  const publicRoutes = ['/Login', '/Login/ResetPassword', '/Login/update-password'];
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));
  const isPasswordReset = pathname.startsWith('/Login/update-password') && req.nextUrl.searchParams.has('code');

  if (isPublicRoute || isPasswordReset) {
    console.log('Route publique ou réinitialisation de mot de passe détectée, accès autorisé');
    return res;
  }

  // Vérifie la session
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    console.log('Session non trouvée, redirection vers /Login');
    const redirectUrl = new URL('/Login', req.url);
    redirectUrl.searchParams.set('redirectTo', req.url);
    return NextResponse.redirect(redirectUrl);
  }

  console.log('Session trouvée, accès autorisé');
  return res;
}

export const config = {
  matcher: [
    // Exclure les fichiers statiques à la racine (ex: /logo.png, /robots.txt, etc.)
    '/((?!_next/static|_next/image|favicon.ico|logo.png|public/).*)',
  ],
}; 