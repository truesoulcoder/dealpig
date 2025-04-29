'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { MatrixBackground } from '@/components/ui/MatrixBackground';
import { DealpigText as AnimatedDealpigText } from '@/components/icons/AnimatedDealpigText';
import { LetterFx } from '@/components/ui/LetterFx';

export default function CallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(true);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    const processAuth = async () => {
      try {
        // Log URL parameters for debugging
        console.log('URL Parameters:', {
          code: searchParams.get('code'),
          error: searchParams.get('error'),
          error_description: searchParams.get('error_description'),
          state: searchParams.get('state'),
          redirectTo: searchParams.get('redirectTo')
        });

        // Check for OAuth errors first
        const oauthError = searchParams.get('error');
        if (oauthError) {
          const errorDescription = searchParams.get('error_description');
          throw new Error(`OAuth Error: ${oauthError}${errorDescription ? ` - ${errorDescription}` : ''}`);
        }

        // Get the authorization code
        const code = searchParams.get('code');
        if (!code) {
          throw new Error('No authorization code received');
        }

        // Exchange the code for session
        const response = await fetch('/api/auth/callback', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ code }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to authenticate');
        }

        // Get the redirect path
        const redirectTo = searchParams.get('redirectTo') || '/';
        
        // Set success state and redirect
        setIsSuccess(true);
        setTimeout(() => {
          router.push(redirectTo);
        }, 1500);

      } catch (err) {
        console.error('Auth callback error:', err);
        setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      } finally {
        setIsAuthenticating(false);
      }
    };

    processAuth();
  }, [router, searchParams]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden">
      <MatrixBackground />
      <div className="relative z-10 w-full max-w-md px-4 py-8 space-y-8">
        <div className="text-center">
          <AnimatedDealpigText />
        </div>

        {error ? (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-6 text-center">
            <LetterFx trigger="instant" speed="fast" className="text-red-500">
              {error}
            </LetterFx>
            <button
              onClick={() => router.push('/login')}
              className="mt-4 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-500 rounded-lg transition-colors"
            >
              Return to Login
            </button>
          </div>
        ) : isAuthenticating ? (
          <div className="text-center">
            <LetterFx trigger="instant" speed="fast" className="text-green-500">
              Authenticating...
            </LetterFx>
          </div>
        ) : isSuccess ? (
          <div className="text-center">
            <LetterFx trigger="instant" speed="fast" className="text-green-500">
              Login successful! Redirecting...
            </LetterFx>
          </div>
        ) : null}
      </div>
    </div>
  );
}