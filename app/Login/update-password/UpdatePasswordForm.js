"use client";
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createPagesBrowserClient } from '@supabase/auth-helpers-nextjs';

function UpdatePasswordFormContent() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isCodeVerified, setIsCodeVerified] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createPagesBrowserClient();

  useEffect(() => {
    const initializeReset = async () => {
      const code = searchParams.get('code');
      console.log('[PKCE] code from URL:', code);
      if (!code) {
        setError('Invalid reset link: code is missing.');
        return;
      }

      // Log localStorage content
      if (typeof window !== 'undefined') {
        try {
          const allKeys = Object.keys(localStorage);
          const allValues = allKeys.reduce((acc, key) => {
            acc[key] = localStorage.getItem(key);
            return acc;
          }, {});
          console.log('[PKCE] localStorage content:', allValues);
        } catch (e) {
          console.log('[PKCE] Error reading localStorage:', e);
        }
      }

      // Check PKCE codeVerifier in localStorage
      const codeVerifier = typeof window !== 'undefined'
        ? localStorage.getItem('supabase.auth.code_verifier')
        : null;
      console.log('[PKCE] codeVerifier from localStorage:', codeVerifier);

      if (!codeVerifier) {
        setError('The PKCE verification code is missing. Please request a new password reset link and make sure to open it in the same browser and tab where you requested it.');
        return;
      }

      try {
        const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        if (exchangeError) {
          console.error('[PKCE] exchangeCodeForSession error:', exchangeError);
          throw exchangeError;
        }
        if (!data.session) {
          console.error('[PKCE] No session after code exchange:', data);
          throw new Error('Session was not created after code exchange.');
        }
        setIsCodeVerified(true);
      } catch (error) {
        console.error('[PKCE] Error during code verification:', error);
        if (error.message?.toLowerCase().includes('expired') || error.message?.toLowerCase().includes('invalid')) {
          setError('The reset link has expired or is invalid. Please request a new link.');
        } else if (error.message?.includes('AuthApiError')) {
          setError('Authentication error. Please request a new reset link.');
        } else {
          setError('An error occurred while verifying the code. Please request a new link.');
        }
      }
    };
    initializeReset();
  }, [searchParams, supabase.auth]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setIsLoading(true);

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      setIsLoading(false);
      return;
    }
    if (!isCodeVerified) {
      setError('Please wait for the reset code to be verified.');
      setIsLoading(false);
      return;
    }
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) {
        console.error('[PKCE] updateUser error:', updateError);
        throw updateError;
      }
      setMessage('Your password has been reset successfully. You will be redirected to the login page.');
      await supabase.auth.signOut();
      setTimeout(() => {
        router.push('/Login');
      }, 3000);
    } catch (error) {
      console.error('[PKCE] Error during password update:', error);
      setError(error.message || 'An error occurred while resetting the password.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Update your password
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Enter your new password below.<br />
            <span className="text-xs text-blue-700 block mt-2 font-semibold">
              <b>Important:</b> For security reasons, please open the reset link in the <u>same browser and tab</u> where you requested the password reset.<br />
              If the link opens in a new tab or device, copy and paste it into the original tab.<br />
              If you have issues, request a new reset link.
            </span>
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
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
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
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isLoading}
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
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400"
            >
              {isLoading ? 'Updating...' : 'Update password'}
            </button>
          </div>

          {error && (error.toLowerCase().includes('expired') || error.toLowerCase().includes('invalid')) && (
            <div className="text-center mt-2">
              <Link 
                href="/Login/ResetPassword"
                className="font-medium text-indigo-600 hover:text-indigo-500"
              >
                Request a new link
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