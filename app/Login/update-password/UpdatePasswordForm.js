'use client';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

function UpdatePasswordFormContent() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClientComponentClient();

  useEffect(() => {
    const initializeReset = async () => {
      try {
        console.log('=== DÉBUT DE L\'INITIALISATION ===');
        console.log('URL complète:', window.location.href);
        console.log('Search params:', Object.fromEntries(searchParams.entries()));
        console.log('Hash:', window.location.hash);

        // Vérifier les paramètres d'erreur dans l'URL
        const errorParam = searchParams.get('error');
        const errorCode = searchParams.get('error_code');
        const errorDescription = searchParams.get('error_description');
        const resetCode = searchParams.get('code');
        
        console.log('Paramètres d\'erreur:', {
          error: errorParam,
          errorCode,
          errorDescription,
          resetCode
        });

        // Vérifier si nous avons un code de réinitialisation
        if (resetCode) {
          console.log('Code de réinitialisation trouvé:', resetCode);
          try {
            console.log('Tentative de réinitialisation avec le code...');
            
            // Utiliser la méthode correcte pour la réinitialisation
            const { data, error: resetError } = await supabase.auth.verifyOtp({
              token_hash: resetCode,
              type: 'recovery'
            });

            if (resetError) {
              console.error('❌ ERREUR lors de la vérification du code:', resetError);
              throw resetError;
            }

            console.log('✅ Code vérifié avec succès');
            return;
          } catch (error) {
            console.error('❌ ERREUR lors de la vérification du code:', error);
            setError('Le lien de réinitialisation a expiré. Veuillez demander un nouveau lien.');
            return;
          }
        }

        // Vérifier si nous avons un hash dans l'URL
        const hash = window.location.hash;
        console.log('Hash URL:', hash);

        if (!hash) {
          console.log('❌ ERREUR: Pas de hash dans l\'URL');
          setError('Lien de réinitialisation invalide. Veuillez demander un nouveau lien.');
          return;
        }

        // Traitement du hash
        const params = new URLSearchParams(hash.substring(1));
        console.log('Paramètres du hash:', Object.fromEntries(params.entries()));

        const accessToken = params.get('access_token');
        const refreshToken = params.get('refresh_token');

        console.log('Tokens trouvés:', {
          hasAccessToken: !!accessToken,
          hasRefreshToken: !!refreshToken,
          accessTokenLength: accessToken?.length,
          refreshTokenLength: refreshToken?.length
        });

        if (!accessToken || !refreshToken) {
          console.log('❌ ERREUR: Tokens manquants dans le hash');
          setError('Lien de réinitialisation invalide. Veuillez demander un nouveau lien.');
          return;
        }

        try {
          console.log('Tentative de définition de la session avec les tokens...');
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          });

          if (sessionError) {
            console.error('❌ ERREUR lors de la définition de la session:', sessionError);
            throw sessionError;
          }

          console.log('✅ Session définie avec succès');
        } catch (error) {
          console.error('❌ ERREUR lors de la définition de la session:', error);
          setError('Le lien de réinitialisation a expiré. Veuillez demander un nouveau lien.');
          return;
        }

      } catch (error) {
        console.error('❌ ERREUR lors de l\'initialisation:', error);
        setError('Une erreur est survenue. Veuillez demander un nouveau lien.');
      }
    };

    initializeReset();
  }, [router, supabase.auth, searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');
    setError('');

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      setIsLoading(false);
      return;
    }

    try {
      console.log('Tentative de mise à jour du mot de passe...');
      // Mettre à jour le mot de passe
      const { error: updateError } = await supabase.auth.updateUser({
        password: password
      });

      if (updateError) {
        console.error('❌ ERREUR lors de la mise à jour du mot de passe:', updateError);
        throw updateError;
      }

      console.log('✅ Mot de passe mis à jour avec succès');
      setMessage('Votre mot de passe a été réinitialisé avec succès.');
      // Rediriger l'utilisateur vers la page de connexion après un court délai
      setTimeout(() => {
        router.push('/Login');
      }, 3000);

    } catch (error) {
      console.error('❌ ERREUR complète:', error);
      setError(error.message || 'Une erreur est survenue lors de la réinitialisation du mot de passe.');
    } finally {
      setIsLoading(false);
    }
  };

  // Si le lien a expiré, afficher un message et un bouton pour demander un nouveau lien
  if (error && error.includes('expiré')) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Lien expiré
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              {error}
            </p>
          </div>
          <div className="text-center">
            <Link 
              href="/Login/ResetPassword"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Demander un nouveau lien
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Mise à jour du mot de passe
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Entrez votre nouveau mot de passe
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="password" className="sr-only">Nouveau mot de passe</label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Nouveau mot de passe"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="confirm-password" className="sr-only">Confirmer le mot de passe</label>
              <input
                id="confirm-password"
                name="confirm-password"
                type="password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Confirmer le mot de passe"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          </div>

          {message && (
            <div className="rounded-md bg-green-50 p-4">
              <div className="flex">
                <div className="ml-3">
                  <p className="text-sm font-medium text-green-800">{message}</p>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="flex">
                <div className="ml-3">
                  <p className="text-sm font-medium text-red-800">{error}</p>
                </div>
              </div>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              {isLoading ? 'Mise à jour en cours...' : 'Mettre à jour le mot de passe'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function UpdatePasswordForm() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    }>
      <UpdatePasswordFormContent />
    </Suspense>
  );
} 