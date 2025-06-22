'use client';
import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createPagesBrowserClient } from '@supabase/auth-helpers-nextjs';

export default function UpdatePasswordForm() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createPagesBrowserClient();

  useEffect(() => {
    async function init() {
      try {
        // 1) Récupère access & refresh token soit dans le hash (#), soit dans la query (?)
        const hashParams = new URLSearchParams(window.location.hash.slice(1));
        const queryParams = new URLSearchParams(window.location.search);

        const access_token =
          hashParams.get('access_token') ||
          queryParams.get('access_token');
        const refresh_token =
          hashParams.get('refresh_token') ||
          queryParams.get('refresh_token');

        console.log('→ access_token:', access_token);
        console.log('→ refresh_token:', refresh_token);

        if (!access_token || !refresh_token) {
          // si Supabase a mis un ?error=… on le gère ici
          const err = searchParams.get('error_description');
          throw new Error(err ? decodeURIComponent(err) : 'Lien invalide ou expiré.');
        }

        // 2) Initialise la session
        const { error: sessionError } = await supabase.auth.setSession({
          access_token,
          refresh_token,
        });
        if (sessionError) throw sessionError;

        // 3) Nettoie l’URL pour ne plus voir tokens ni erreurs
        window.history.replaceState(
          {},
          document.title,
          window.location.pathname
        );
      } catch (err) {
        console.error('[Reset] setSession error', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [searchParams, supabase.auth]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }
    setLoading(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;
      setSuccess('Mot de passe mis à jour ! Redirection…');
      await supabase.auth.signOut();
      setTimeout(() => router.push('/Login'), 2500);
    } catch (err) {
      console.error('[Reset] updateUser error', err);
      setError(err.message || 'Erreur lors de la mise à jour du mot de passe.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-12 w-12 rounded-full border-b-2 border-indigo-600" />
      </div>
    );
  }
  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4">
        <h2 className="text-2xl font-bold mb-4">Impossible de réinitialiser</h2>
        <div className="bg-red-50 text-red-700 p-4 rounded text-center">{error}</div>
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
        <div className="bg-green-50 text-green-700 p-4 rounded text-center">{success}</div>
      </div>
    );
  }
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="max-w-md w-full space-y-8">
        <h2 className="text-center text-3xl font-extrabold text-gray-900">
          Mettre à jour le mot de passe
        </h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="rounded-md shadow-sm -space-y-px">
            <input
              type="password"
              placeholder="Nouveau mot de passe"
              required
              disabled={loading}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="block w-full px-3 py-2 border rounded-t-md focus:outline-none"
            />
            <input
              type="password"
              placeholder="Confirmer le mot de passe"
              required
              disabled={loading}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="block w-full px-3 py-2 border rounded-b-md focus:outline-none"
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
