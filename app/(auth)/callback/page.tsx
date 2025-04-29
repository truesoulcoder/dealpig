'use client';

import { handleAuthCallback } from '@/actions/auth.action';
import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { supabase } from "@/lib/supabase";
import { MatrixBackground } from "@/components/ui/MatrixBackground";
import { Background } from "@/components/ui/Background";
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
      error: searchParams.get("error"),
      errorDescription: searchParams.get("error_description"),
      fullUrl: window.location.href
    });

    const processAuth = async () => {
      try {
        console.log('🔍 Checking for auth session...');
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('❌ Session error:', sessionError);
          throw sessionError;
        }

        if (session) {
          console.log('✅ Session found, redirecting to dashboard...');
          setMessage("Login successful! Redirecting...");
          router.push("/");
          return;
        }

        // If no session, try to exchange the URL hash for a session
        setMessage("Completing authentication...");
        const { data, error: exchangeError } = await supabase.auth.getUser();
        
        if (exchangeError) {
          console.error('❌ Auth exchange error:', exchangeError);
          throw exchangeError;
        }

        if (data.user) {
          console.log('✅ Authentication successful, redirecting to dashboard...');
          setMessage("Login successful! Redirecting...");
          router.push("/");
        } else {
          throw new Error('No user data received');
        }
      } catch (error) {
        console.error('❌ Callback handling error:', {
          name: error instanceof Error ? error.name : 'Unknown',
          message: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined
        });
        setError('Authentication failed. Please try logging in again.');
      }
    };
    
    if (!searchParams.get("error")) {
      processAuth();
    } else {
      setError(searchParams.get("error_description") || 'Authentication failed');
    }
  }, [searchParams, router]);

  return (
    <>
      <MatrixBackground />
      <Background
        mask={{
          cursor: true,
          radius: 300
        }}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'black',
          zIndex: 1
        }}
      />
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