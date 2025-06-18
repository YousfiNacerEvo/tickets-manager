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
  const [isCodeVerified, setIsCodeVerified] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClientComponentClient();

  useEffect(() => {
    const initializeReset = async () => {
      console.log('=== DÉBUT DE L\'INITIALISATION ===');
      const code = searchParams.get('code');
      
      console.log('URL complète:', window.location.href);
      console.log('Search params:', Object.fromEntries(searchParams.entries()));
      console.log('Code de réinitialisation:', code);

      if (!code) {
        setError('Lien de réinitialisation invalide : code manquant');
        return;
      }

      try {
        console.log('Tentative d\'échange du code...');
        const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

        if (exchangeError) {
          console.error('Erreur lors de l\'échange:', exchangeError);
          throw exchangeError;
        }

        if (!data.session) {
          throw new Error('Session non créée après l\'échange du code');
        }

        console.log('Code échangé avec succès, session créée');
        setIsCodeVerified(true);
      } catch (error) {
        console.error('Erreur détaillée:', error);
        
        // Gestion spécifique des erreurs courantes
        if (error.message?.includes('expired') || error.message?.includes('invalid')) {
          setError('Le lien de réinitialisation a expiré ou est invalide. Veuillez demander un nouveau lien.');
        } else if (error.message?.includes('AuthApiError')) {
          setError('Erreur d\'authentification. Veuillez demander un nouveau lien de réinitialisation.');
        } else {
          setError('Une erreur est survenue lors de la vérification du code. Veuillez demander un nouveau lien.');
        }
      }
    };

    initializeReset();
  }, [searchParams, supabase.auth]);

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

    if (!isCodeVerified) {
      setError('Veuillez attendre la vérification du code de réinitialisation.');
      setIsLoading(false);
      return;
    }

    try {
      console.log('Tentative de mise à jour du mot de passe');
      const { error: updateError } = await supabase.auth.updateUser({
        password: password
      });

      if (updateError) {
        console.error('Erreur lors de la mise à jour:', updateError);
        throw updateError;
      }

      console.log('Mot de passe mis à jour avec succès');
      setMessage('Votre mot de passe a été réinitialisé avec succès.');
      
      // Déconnexion après la mise à jour réussie
      await supabase.auth.signOut();
      
      setTimeout(() => {
        router.push('/Login');
      }, 3000);

    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
      setError(error.message || 'Une erreur est survenue lors de la réinitialisation du mot de passe.');
    } finally {
      setIsLoading(false);
    }
  };

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
                disabled={!isCodeVerified}
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
                disabled={!isCodeVerified}
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
              disabled={isLoading || !isCodeVerified}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400"
            >
              {isLoading ? 'Mise à jour en cours...' : 'Mettre à jour le mot de passe'}
            </button>
          </div>

          {error && (error.includes('expiré') || error.includes('invalide')) && (
            <div className="text-center">
              <Link 
                href="/Login/ResetPassword"
                className="font-medium text-indigo-600 hover:text-indigo-500"
              >
                Demander un nouveau lien
              </Link>
            </div>
          )}
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