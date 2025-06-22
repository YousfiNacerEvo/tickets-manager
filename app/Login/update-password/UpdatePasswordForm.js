'use client';
import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createPagesBrowserClient } from '@supabase/auth-helpers-nextjs';

export default function UpdatePasswordForm() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createPagesBrowserClient();

  // 1️⃣ On gère d’abord l’échec via les query params
  useEffect(() => {
    const err = searchParams.get('error');
    const desc = searchParams.get('error_description');
    if (err) {
      // Exemple d’URL : ?error=access_denied&error_description=Email+link+is+invalid+or+has+expired
      setError(decodeURIComponent(desc || 'Lien invalide ou expiré.'));
      setLoading(false);
      return;
    }

    // 2️⃣ Si pas d’erreur, on écoute PASSWORD_RECOVERY
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, sess) => {
      if (event === 'PASSWORD_RECOVERY') {
        setSession(sess);
        setLoading(false);
      }
    });

    // Timeout si jamais l’event n’arrive pas
    const timer = setTimeout(() => {
      if (!session) {
        setError('Impossible de valider le lien. Il a peut-être expiré.');
        setLoading(false);
      }
    }, 10_000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timer);
    };
  // On ne dépend volontairement pas de `session` pour éviter de relancer l’effet
  }, [searchParams, supabase.auth]);

  // 3️⃣ Soumission du nouveau mot de passe
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }
    setLoading(true);
    try {
      const { error: updateErr } = await supabase.auth.updateUser({ password });
      if (updateErr) throw updateErr;
      setSuccess('Mot de passe mis à jour ! Redirection…');
      await supabase.auth.signOut();
      setTimeout(() => router.push('/Login'), 2500);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Erreur lors de la mise à jour du mot de passe.');
    } finally {
      setLoading(false);
    }
  };

  // 4️⃣ Affichage selon l’état
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
        <h2 className="text-2xl font-bold mb-4">Réinitialisation impossible</h2>
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

  // session est présente → on affiche le formulaire
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="w-full max-w-md space-y-8">
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
              onChange={e => setPassword(e.target.value)}
              className="block w-full px-3 py-2 border rounded-t-md focus:outline-none"
            />
            <input
              type="password"
              placeholder="Confirmer le mot de passe"
              required
              disabled={loading}
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
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
