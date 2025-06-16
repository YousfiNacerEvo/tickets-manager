import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';

export async function middleware(req) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });
  const { pathname } = req.nextUrl;

  console.log('Middleware - URL:', req.url);
  console.log('Middleware - Pathname:', pathname);

  // Vérifier si c'est une page de réinitialisation de mot de passe
  if (pathname.startsWith('/Login/ResetPassword')) {
    return res;
  }

  // Vérifier si c'est la page de mise à jour du mot de passe
  if (pathname.startsWith('/Login/update-password')) {
    console.log('Middleware - Page update-password détectée');
    console.log('Middleware - URL complète:', req.url);
    
    // Permettre l'accès à la page update-password
    return res;
  }

  // Vérifier la session pour les autres routes protégées
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Si l'utilisateur n'est pas connecté et essaie d'accéder au dashboard
  if (!session && pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/Login', req.url));
  }

  // Si l'utilisateur est connecté et essaie d'accéder à la page de connexion
  if (session && pathname === '/Login') {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  return res;
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/Login',
    '/Login/update-password',
    '/Login/ResetPassword'
  ],
}; 