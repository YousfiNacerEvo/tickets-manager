"use client";
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createPagesBrowserClient } from '@supabase/auth-helpers-nextjs';

export default function UpdatePasswordForm() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createPagesBrowserClient();

  // 1. Récupérer la session depuis l'URL de reset (fragment #access_token=...)
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      setError(null);
      // getSessionFromUrl lit le fragment et restaure la session
      const { data, error } = await supabase.auth.getSessionFromUrl({ storeSession: true });
      if (error || !data.session) {
        setError('The reset link is invalid or has expired. Please request a new one.');
        setSession(null);
      } else {
        setSession(data.session);
      }
      setLoading(false);
    };
    init();
    // eslint-disable-next-line
  }, []);

  // 2. Gestion de la soumission du formulaire
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    if (updateError) {
      setError(updateError.message || 'An error occurred while updating the password.');
      setLoading(false);
      return;
    }
    setSuccess('Your password has been updated. Redirecting to login...');
    await supabase.auth.signOut();
    setTimeout(() => router.push('/Login'), 2500);
    setLoading(false);
  };

  // 3. Affichage
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <div className="max-w-md w-full space-y-6">
          <h2 className="text-2xl font-bold text-center">Reset your password</h2>
          <div className="rounded bg-red-50 text-red-700 p-4 text-center">{error}</div>
          <a
            href="/Login/ResetPassword"
            className="block text-center text-indigo-600 hover:underline font-medium"
          >
            Request a new link
          </a>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <div className="max-w-md w-full space-y-6">
          <h2 className="text-2xl font-bold text-center">Password updated</h2>
          <div className="rounded bg-green-50 text-green-700 p-4 text-center">{success}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Update your password
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Enter your new password below.
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="password" className="sr-only">New password</label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="New password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                disabled={loading}
              />
            </div>
            <div>
              <label htmlFor="confirm-password" className="sr-only">Confirm password</label>
              <input
                id="confirm-password"
                name="confirm-password"
                type="password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Confirm password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>
          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <p className="text-sm font-medium text-red-800">{error}</p>
            </div>
          )}
          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400"
            >
              {loading ? 'Updating...' : 'Update password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 