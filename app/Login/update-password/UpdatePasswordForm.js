'use client';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function UpdatePasswordForm() {
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
        console.log('=== Début de l\'initialisation ===');
        console.log('URL complète:', window.location.href);
        console.log('Search params:', Object.fromEntries(searchParams.entries()));
        console.log('Hash:', window.location.hash);

        // Vérifier les paramètres d'erreur dans l'URL
        const errorParam = searchParams.get('error');
        const errorCode = searchParams.get('error_code');
        const errorDescription = searchParams.get('error_description');
        
        console.log('Paramètres d\'erreur:', {
          error: errorParam,
          errorCode,
          errorDescription
        });
        
        if (errorParam) {
          console.log('Erreur détectée dans l\'URL');
          setError(errorDescription || 'Le lien de réinitialisation a expiré. Veuillez demander un nouveau lien.');
          setTimeout(() => {
            console.log('Redirection vers ResetPassword');
            router.push('/Login/ResetPassword');
          }, 3000);
          return;
        }

        // Vérifier si nous avons un token dans l'URL
        const hash = window.location.hash;
        console.log('Hash URL:', hash);

        if (!hash) {
          console.log('Pas de hash dans l\'URL');
          setError('Lien de réinitialisation invalide. Veuillez demander un nouveau lien.');
          setTimeout(() => {
            router.push('/Login/ResetPassword');
          }, 3000);
          return;
        }

        const params = new URLSearchParams(hash.substring(1));
        console.log('Paramètres du hash:', Object.fromEntries(params.entries()));

        // Vérifier si le lien a expiré ou s'il y a une erreur
        if (params.has('error')) {
          console.log('Erreur détectée dans le hash');
          const errorDescription = params.get('error_description');
          setError(errorDescription || 'Le lien de réinitialisation a expiré. Veuillez demander un nouveau lien.');
          setTimeout(() => {
            router.push('/Login/ResetPassword');
          }, 3000);
          return;
        }

        // Récupérer les tokens
        const accessToken = params.get('access_token');
        const refreshToken = params.get('refresh_token');

        console.log('Tokens présents:', {
          hasAccessToken: !!accessToken,
          hasRefreshToken: !!refreshToken
        });

        if (!accessToken || !refreshToken) {
          console.log('Tokens manquants');
          setError('Lien de réinitialisation invalide. Veuillez demander un nouveau lien.');
          setTimeout(() => {
            router.push('/Login/ResetPassword');
          }, 3000);
          return;
        }

        // Définir la session avec les tokens
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken
        });

        if (sessionError) {
          console.error('Erreur lors de la définition de la session:', sessionError);
          setError('Le lien de réinitialisation a expiré. Veuillez demander un nouveau lien.');
          setTimeout(() => {
            router.push('/Login/ResetPassword');
          }, 3000);
          return;
        }

        console.log('Session définie avec succès');

      } catch (error) {
        console.error('Erreur lors de l\'initialisation:', error);
        setError('Une erreur est survenue. Veuillez demander un nouveau lien.');
        setTimeout(() => {
          router.push('/Login/ResetPassword');
        }, 3000);
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
      // Mettre à jour le mot de passe
      const { error: updateError } = await supabase.auth.updateUser({
        password: password
      });

      if (updateError) {
        console.error('Erreur Supabase:', updateError);
        throw updateError;
      }

      setMessage('Votre mot de passe a été réinitialisé avec succès.');
      // Rediriger l'utilisateur vers la page de connexion après un court délai
      setTimeout(() => {
        router.push('/Login');
      }, 3000);

    } catch (error) {
      console.error('Erreur complète:', error);
      setError(error.message || 'Une erreur est survenue lors de la réinitialisation du mot de passe.');
      if (error.message.includes('expiré') || error.message.includes('invalide')) {
        setTimeout(() => {
          router.push('/Login/ResetPassword');
        }, 3000);
      }
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