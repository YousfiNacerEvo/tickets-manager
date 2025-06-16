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
    // Vérifier si nous avons un token dans l'URL
    const hash = window.location.hash;
    console.log('Hash URL:', hash); // Debug log

    if (!hash) {
      setError('Lien de réinitialisation invalide. Veuillez demander un nouveau lien.');
      setTimeout(() => {
        router.push('/Login/ResetPassword');
      }, 3000);
      return;
    }

    const params = new URLSearchParams(hash.substring(1));
    console.log('Params:', Object.fromEntries(params.entries())); // Debug log

    // Vérifier si le lien a expiré ou s'il y a une erreur
    if (params.has('error')) {
      const errorDescription = params.get('error_description');
      setError(errorDescription || 'Le lien de réinitialisation a expiré. Veuillez demander un nouveau lien.');
      setTimeout(() => {
        router.push('/Login/ResetPassword');
      }, 3000);
      return;
    }

    // Vérifier la présence des tokens requis
    const accessToken = params.get('access_token');
    const refreshToken = params.get('refresh_token');
    const type = params.get('type');

    if (!accessToken || !refreshToken) {
      setError('Lien de réinitialisation invalide. Veuillez demander un nouveau lien.');
      setTimeout(() => {
        router.push('/Login/ResetPassword');
      }, 3000);
      return;
    }

    // Vérifier si le token est valide
    const checkToken = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser(accessToken);
        if (error || !user) {
          setError('Le lien de réinitialisation a expiré. Veuillez demander un nouveau lien.');
          setTimeout(() => {
            router.push('/Login/ResetPassword');
          }, 3000);
        }
      } catch (error) {
        console.error('Erreur lors de la vérification du token:', error);
        setError('Le lien de réinitialisation a expiré. Veuillez demander un nouveau lien.');
        setTimeout(() => {
          router.push('/Login/ResetPassword');
        }, 3000);
      }
    };

    checkToken();
  }, [router, supabase.auth]);

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
      // Récupérer le token de réinitialisation depuis l'URL
      const hash = window.location.hash;
      console.log('Hash dans handleSubmit:', hash); // Debug log

      if (!hash) {
        throw new Error('Lien de réinitialisation invalide');
      }

      const params = new URLSearchParams(hash.substring(1));
      console.log('Params dans handleSubmit:', Object.fromEntries(params.entries())); // Debug log

      // Vérifier si le lien a expiré
      if (params.has('error')) {
        throw new Error('Le lien de réinitialisation a expiré. Veuillez demander un nouveau lien.');
      }

      // Récupérer les tokens
      const accessToken = params.get('access_token');
      const refreshToken = params.get('refresh_token');

      if (!accessToken || !refreshToken) {
        throw new Error('Lien de réinitialisation invalide ou expiré');
      }

      // Mettre à jour le mot de passe avec le token de réinitialisation
      const { error: updateError } = await supabase.auth.updateUser(
        { password: password },
        {
          auth: {
            access_token: accessToken,
            refresh_token: refreshToken
          }
        }
      );

      if (updateError) {
        console.error('Erreur Supabase:', updateError); // Debug log
        throw updateError;
      }

      setMessage('Votre mot de passe a été réinitialisé avec succès.');
      // Rediriger l'utilisateur vers la page de connexion après un court délai
      setTimeout(() => {
        router.push('/Login');
      }, 3000);

    } catch (error) {
      console.error('Erreur complète:', error); // Debug log
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
            Définir un nouveau mot de passe
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Entrez et confirmez votre nouveau mot de passe
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="password" className="sr-only">
                Nouveau mot de passe
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Nouveau mot de passe"
              />
            </div>
            <div>
              <label htmlFor="confirm-password" className="sr-only">
                Confirmer le mot de passe
              </label>
              <input
                id="confirm-password"
                name="confirm-password"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Confirmer le mot de passe"
              />
            </div>
          </div>

          {message && (
            <div className="rounded-md bg-green-50 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-green-800">{message}</p>
                </div>
              </div>
            </div>
          )}

          {error && !error.includes('expiré') && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
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
              className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white ${
                isLoading ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'
              } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
            >
              {isLoading ? (
                <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </span>
              ) : null}
              {isLoading ? 'Mise à jour...' : 'Mettre à jour le mot de passe'}
            </button>
          </div>

          <div className="text-sm text-center">
            <Link href="/Login" className="font-medium text-blue-600 hover:text-blue-500">
              Retour à la connexion
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
} 