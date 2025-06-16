import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';

export async function middleware(req) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  // Vérifier si l'utilisateur est sur une page de réinitialisation de mot de passe
  const isResetPage = req.nextUrl.pathname.startsWith('/Login/ResetPassword');
  const isUpdatePasswordPage = req.nextUrl.pathname.startsWith('/Login/update-password');

  // Si c'est la page de demande de réinitialisation, laisser passer
  if (isResetPage) {
    return res;
  }

  // Pour la page de mise à jour du mot de passe, vérifier le hash dans l'URL
  if (isUpdatePasswordPage) {
    const hash = req.nextUrl.hash;
    if (!hash) {
      const redirectUrl = req.nextUrl.clone();
      redirectUrl.pathname = '/Login/ResetPassword';
      return NextResponse.redirect(redirectUrl);
    }
    return res;
  }

  // Pour les autres pages, vérifier l'authentification
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Si l'utilisateur n'est pas connecté et essaie d'accéder à une page protégée
  if (!session && req.nextUrl.pathname.startsWith('/dashboard')) {
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = '/Login';
    return NextResponse.redirect(redirectUrl);
  }

  // Si l'utilisateur est connecté et essaie d'accéder à la page de connexion
  if (session && req.nextUrl.pathname === '/Login') {
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = '/dashboard';
    return NextResponse.redirect(redirectUrl);
  }

  return res;
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/Login',
    '/Login/update-password',
    '/Login/ResetPassword'
  ]
} 