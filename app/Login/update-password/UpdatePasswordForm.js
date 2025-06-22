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
  const [session, setSession] = useState(null);

  const router = useRouter();
  const supabase = createPagesBrowserClient();

  // 1️⃣ Au montage, on récupère la session depuis le cookie
  useEffect(() => {
    const init = async () => {
      try {
        // GoTrue validated the recovery token in the cookie during /verify
        const {
          data: { session: sess },
          error: sessErr,
        } = await supabase.auth.getSession();
        if (sessErr || !sess) {
          throw new Error(
            'The reset link is invalid or has expired. Please request a new one.'
          );
        }
        setSession(sess);
      } catch (err) {
        console.error('[Reset] getSession error', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [supabase.auth]);

  // 2️⃣ Soumission du formulaire
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      const { error: updateErr } = await supabase.auth.updateUser({ password });
      if (updateErr) throw updateErr;
      setSuccess('Password updated! You will be redirected.');
      await supabase.auth.signOut();
      setTimeout(() => router.push('/Login'), 2500);
    } catch (err) {
      console.error('[Reset] updateUser error', err);
      setError(err.message || 'An error occurred while updating the password.');
    } finally {
      setLoading(false);
    }
  };

  // 3️⃣ UI selon l'état
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
        <h2 className="text-2xl font-bold mb-4">Password reset failed</h2>
        <div className="bg-red-50 text-red-700 p-4 rounded text-center">{error}</div>
        <a
          href="/Login/ResetPassword"
          className="mt-4 text-indigo-600 hover:underline"
        >
          Request a new link
        </a>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4">
        <h2 className="text-2xl font-bold mb-4">Success</h2>
        <div className="bg-green-50 text-green-700 p-4 rounded text-center">{success}</div>
      </div>
    );
  }

  // session valide → afficher le formulaire
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="max-w-md w-full space-y-8">
        <h2 className="text-center text-3xl font-extrabold text-gray-900">
          Update your password
        </h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="rounded-md shadow-sm -space-y-px">
            <input
              type="password"
              placeholder="New password"
              required
              disabled={loading}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="block w-full px-3 py-2 border rounded-t-md focus:outline-none text-black"
            />
            <input
              type="password"
              placeholder="Confirm password"
              required
              disabled={loading}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="block w-full px-3 py-2 border rounded-b-md focus:outline-none text-black"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 bg-indigo-600 text-white rounded disabled:opacity-50"
          >
            {loading ? 'Please wait…' : 'Update password'}
          </button>
        </form>
      </div>
    </div>
  );
}
