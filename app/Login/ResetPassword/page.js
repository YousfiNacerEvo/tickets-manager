'use client';
import { useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Link from 'next/link';

export default function ResetPassword() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const supabase = createClientComponentClient();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');
    setError('');

    try {
      const siteUrl = 'https://tickets-manager-kappa.vercel.app';
      console.log('=== DÉBUT DE LA RÉINITIALISATION ===');
      console.log('Site URL:', siteUrl);
      console.log('Email:', email);
      
      // Encoder l'email pour l'URL
      const encodedEmail = encodeURIComponent(email);
      const redirectTo = `${siteUrl}/Login/update-password?email=${encodedEmail}`;
      console.log('Redirect URL complète:', redirectTo);

      console.log('Tentative d\'envoi de l\'email de réinitialisation...');
      console.log('Paramètres envoyés à resetPasswordForEmail:', {
        email: email,
        redirectTo: redirectTo,
        shouldCreateUser: false
      });

      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectTo,
        shouldCreateUser: false
      });

      if (resetError) {
        console.error('❌ ERREUR lors de l\'envoi:', resetError);
        console.error('Détails de l\'erreur:', {
          message: resetError.message,
          status: resetError.status,
          name: resetError.name
        });
        throw resetError;
      }

      console.log('✅ Email envoyé avec succès');
      setMessage('Un email de réinitialisation a été envoyé à votre adresse email.');
    } catch (error) {
      console.error('❌ ERREUR complète:', error);
      console.error('Détails de l\'erreur:', {
        message: error.message,
        status: error.status,
        name: error.name
      });
      setError(error.message || 'Une erreur est survenue lors de l\'envoi de l\'email.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Réinitialisation du mot de passe
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Entrez votre adresse email pour recevoir un lien de réinitialisation
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="sr-only">Adresse email</label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
              placeholder="Adresse email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
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
              {isLoading ? 'Envoi en cours...' : 'Envoyer le lien de réinitialisation'}
            </button>
          </div>

          <div className="text-center">
            <Link 
              href="/Login"
              className="font-medium text-indigo-600 hover:text-indigo-500"
            >
              Retour à la connexion
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
} 