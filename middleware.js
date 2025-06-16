import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';

export async function middleware(req) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });
  const { pathname } = req.nextUrl;

  console.log('=== MIDDLEWARE ===');
  console.log('URL complète:', req.url);
  console.log('Pathname:', pathname);
  console.log('Search params:', req.nextUrl.searchParams.toString());

  // Vérifier si c'est une page de réinitialisation de mot de passe
  if (pathname.startsWith('/Login/ResetPassword')) {
    console.log('Page ResetPassword détectée - Accès autorisé');
    return res;
  }

  // Vérifier si c'est la page de mise à jour du mot de passe
  if (pathname.startsWith('/Login/update-password')) {
    console.log('Page update-password détectée');
    
    // Vérifier si nous avons un code de réinitialisation
    const code = req.nextUrl.searchParams.get('code');
    console.log('Code de réinitialisation présent:', !!code);

    if (code) {
      console.log('Code trouvé - Accès autorisé à update-password');
      return res;
    }

    // Si pas de code, vérifier le hash
    if (req.url.includes('#')) {
      console.log('Hash trouvé - Accès autorisé à update-password');
      return res;
    }

    console.log('Aucun code ou hash trouvé - Redirection vers ResetPassword');
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