'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createPagesBrowserClient } from '@supabase/auth-helpers-nextjs';

export default function UpdatePasswordForm() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const router = useRouter();
  const supabase = createPagesBrowserClient();

  // 1) Récupération manuelle de access_token & refresh_token depuis le fragment d'URL
  useEffect(() => {
    async function init() {
      try {
        const hash = window.location.hash; // "#access_token=...&refresh_token=..."
        if (!hash) {
          throw new Error('Lien invalide ou expiré.');
        }
        const params = new URLSearchParams(hash.slice(1));
        const access_token = params.get('access_token');
        const refresh_token = params.get('refresh_token');
        console.log('Reset params:', Object.fromEntries(params.entries())); // debug

        if (!access_token || !refresh_token) {
          throw new Error('Tokens manquants dans l’URL.');
        }

        // 2) Création de la session côté client
        const { error: sessionError } = await supabase.auth.setSession({
          access_token,
          refresh_token
        });
        if (sessionError) {
          throw sessionError;
        }

        // 3) Nettoyage de l’URL
        window.history.replaceState({}, document.title, window.location.pathname);
      } catch (err) {
        console.error('[Reset] setSession error', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [supabase.auth]);

  // 4) Soumission du formulaire de nouveau mot de passe
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }

    setLoading(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) {
        throw updateError;
      }
      setSuccess('Mot de passe mis à jour ! Redirection vers la page de login…');
      await supabase.auth.signOut();
      setTimeout(() => {
        router.push('/Login');
      }, 2500);
    } catch (err) {
      console.error('[Reset] updateUser error', err);
      setError(err.message || 'Erreur lors de la mise à jour du mot de passe.');
    } finally {
      setLoading(false);
    }
  };

  // 5) Rendu selon l’état
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4">
        <h2 className="text-2xl font-bold mb-4">Réinitialisation impossible</h2>
        <div className="rounded bg-red-50 text-red-700 p-4 text-center">{error}</div>
        <a
          href="/Login/ResetPassword"
          className="mt-4 text-indigo-600 hover:underline"
        >
          Demander un nouveau lien
        </a>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4">
        <h2 className="text-2xl font-bold mb-4">Succès</h2>
        <div className="rounded bg-green-50 text-green-700 p-4 text-center">{success}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="max-w-md w-full space-y-8">
        <h2 className="text-center text-3xl font-extrabold text-gray-900">
          Mettre à jour le mot de passe
        </h2>
        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div className="rounded-md shadow-sm -space-y-px">
            <input
              type="password"
              placeholder="Nouveau mot de passe"
              required
              disabled={loading}
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 rounded-t-md focus:outline-none"
            />
            <input
              type="password"
              placeholder="Confirmer le mot de passe"
              required
              disabled={loading}
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 rounded-b-md focus:outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 bg-indigo-600 text-white rounded disabled:opacity-50"
          >
            {loading ? 'Patiente…' : 'Mettre à jour'}
          </button>
        </form>
      </div>
    </div>
  );
}
