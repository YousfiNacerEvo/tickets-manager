import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';

export async function middleware(req) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });
  const { pathname } = req.nextUrl;

  // Vérifier si c'est une page de réinitialisation de mot de passe
  if (pathname.startsWith('/Login/ResetPassword')) {
    return res;
  }

  // Vérifier si c'est la page de mise à jour du mot de passe
  if (pathname.startsWith('/Login/update-password')) {
    // Si l'URL contient un hash ou des paramètres de token, permettre l'accès
    if (req.url.includes('#') || req.url.includes('token=') || req.url.includes('type=')) {
      return res;
    }
    // Sinon, rediriger vers la page de réinitialisation
    return NextResponse.redirect(new URL('/Login/ResetPassword', req.url));
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