import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';

export async function middleware(req) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });
  const { pathname } = req.nextUrl;

  console.log('=== MIDDLEWARE ===');
  console.log('URL complète:', req.url);
  console.log('Pathname:', pathname);
  console.log('Search params:', Object.fromEntries(req.nextUrl.searchParams.entries()));

  // Vérifier la session
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Routes publiques qui ne nécessitent pas d'authentification
  const publicRoutes = ['/Login', '/Login/ResetPassword', '/Login/update-password'];
  
  // Vérifier si la route actuelle est une route publique
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));

  // Si c'est une route publique, permettre l'accès
  if (isPublicRoute) {
    console.log('Route publique détectée, accès autorisé');
    return res;
  }

  // Si l'utilisateur n'est pas connecté et essaie d'accéder à une route protégée
  if (!session) {
    console.log('Session non trouvée, redirection vers /Login');
    const redirectUrl = new URL('/Login', req.url);
    return NextResponse.redirect(redirectUrl);
  }

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