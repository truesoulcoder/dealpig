'use client';

import { handleAuthCallback } from '@/actions/auth.action';
import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { supabase } from "@/lib/supabase";
import { MatrixBackground } from "@/components/ui/MatrixBackground";
import { DealpigText as AnimatedDealpigText } from "@/components/icons/AnimatedDealpigText";
import { LetterFx } from "@/components/ui/LetterFx";

// Client component that uses searchParams
function CallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string>("Authenticating...");
  
  useEffect(() => {
    console.log('🔄 Auth callback page loaded');
    console.log('📋 URL parameters:', {
      code: searchParams.get("code"),
      state: searchParams.get("state"),
      error: searchParams.get("error"),
      errorDescription: searchParams.get("error_description"),
      fullUrl: window.location.href
    });

    // Validate domain
    const currentDomain = window.location.hostname;
    if (!currentDomain.includes('dealpig.vercel.app')) {
      console.error('❌ Invalid domain:', currentDomain);
      setError('Invalid domain. Please use dealpig.vercel.app');
      return;
    }

    const processAuth = async () => {
      try {
        // First check if we have an error
        if (searchParams.get("error")) {
          throw new Error(searchParams.get("error_description") || 'Authentication failed');
        }

        // Check if we have a code parameter (OAuth flow)
        if (searchParams.get("code")) {
          setMessage("Completing OAuth authentication...");
          const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(searchParams.get("code")!);
          
          if (exchangeError) {
            console.error('❌ OAuth exchange error:', exchangeError);
            throw exchangeError;
          }

          if (data.session) {
            console.log('✅ OAuth session established, redirecting...');
            setMessage("Login successful! Redirecting...");
            const redirectTo = searchParams.get("redirectTo") || "/";
            router.push(redirectTo);
            return;
          }
        }

        // If no code, check for existing session
        setMessage("Checking session...");
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('❌ Session error:', sessionError);
          throw sessionError;
        }

        if (session) {
          console.log('✅ Session found, redirecting...');
          setMessage("Login successful! Redirecting...");
          const redirectTo = searchParams.get("redirectTo") || "/";
          router.push(redirectTo);
          return;
        }

        throw new Error('No valid session found');
      } catch (error) {
        console.error('❌ Callback handling error:', {
          name: error instanceof Error ? error.name : 'Unknown',
          message: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined
        });
        setError('Authentication failed. Please try logging in again.');
      }
    };
    
    processAuth();
  }, [searchParams, router]);

  return (
    <>
      <MatrixBackground />
      <div className="relative z-10">
        {error ? (
          <div className="p-4 border border-red-500 bg-black/50 rounded-none mb-6">
            <h2 className="text-lg font-mono text-red-500 mb-2">Authentication Error</h2>
            <p className="text-red-400 font-mono">{error}</p>
            <button
              onClick={() => router.push('/login')}
              className="mt-4 px-4 py-2 bg-black border border-green-400 text-green-400 font-mono hover:bg-green-400 hover:text-black transition-colors rounded-none"
            >
              <LetterFx trigger="hover" speed="fast">
                Return to Login
              </LetterFx>
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center">
            <div className="w-16 h-16 border-4 border-black border-t-green-400 rounded-full animate-spin mb-6"></div>
            <h2 className="text-xl font-mono text-green-400 mb-2">
              <LetterFx trigger="instant" speed="fast">
                {message}
              </LetterFx>
            </h2>
          </div>
        )}
      </div>
    </>
  );
}

export default function AuthCallback() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="w-full max-w-md text-center">
        <AnimatedDealpigText width="316px" height="90px" className="mx-auto mb-8" />
        <Suspense fallback={
          <div className="flex flex-col items-center justify-center">
            <div className="w-16 h-16 border-4 border-black border-t-green-400 rounded-full animate-spin mb-6"></div>
            <h2 className="text-xl font-mono text-green-400 mb-2">
              <LetterFx trigger="instant" speed="fast">
                Loading...
              </LetterFx>
            </h2>
          </div>
        }>
          <CallbackHandler />
        </Suspense>
      </div>
    </div>
  );
}