'use client';

import { handleAuthCallback } from '@/actions/auth.action';
import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { supabase } from "@/lib/supabase";

// Client component that uses searchParams
function CallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  
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
        
        console.log('📥 Session check result:', {
          hasSession: !!session,
          hasError: !!sessionError,
          errorMessage: sessionError?.message
        });

        if (sessionError) {
          console.error('❌ Session error:', sessionError);
          throw sessionError;
        }

        if (!session) {
          console.log('⚠️ No session found, checking URL hash...');
          // If no session, try to exchange the URL hash for a session
          const { data, error: hashError } = await supabase.auth.getUser();
          
          console.log('📥 Hash exchange result:', {
            hasData: !!data,
            hasError: !!hashError,
            errorMessage: hashError?.message
          });

          if (hashError) {
            console.error('❌ Hash exchange error:', hashError);
            throw hashError;
          }
        }

        console.log('✅ Authentication successful, redirecting to dashboard...');
        router.push("/");
      } catch (error) {
        console.error('❌ Callback handling error:', {
          name: error instanceof Error ? error.name : 'Unknown',
          message: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined
        });
        router.push("/login?error=Authentication failed");
      }
    };
    
    if (!searchParams.get("error")) {
      processAuth();
    }
  }, [searchParams, router]);

  return (
    <>
      {error ? (
        <div className="p-4 border border-red-300 bg-red-50 rounded-md mb-6">
          <h2 className="text-lg font-semibold text-red-700 mb-2">Authentication Error</h2>
          <p className="text-red-600">{error}</p>
          <button
            onClick={() => router.push('/login')}
            className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
          >
            Return to Login
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center">
          <div className="w-16 h-16 border-4 border-gray-200 border-t-primary-600 rounded-full animate-spin mb-6"></div>
          <h2 className="text-xl font-semibold mb-2">Completing authentication...</h2>
          <p className="text-gray-500">You'll be redirected shortly</p>
        </div>
      )}
    </>
  );
}

export default function AuthCallback() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="w-full max-w-md text-center">
        <Image
          src="/dealpig.svg"
          alt="DealPig Logo"
          width={250}
          height={70}
          className="mx-auto mb-8"
          priority
        />

        <Suspense fallback={<div className="flex flex-col items-center justify-center">
            <div className="w-16 h-16 border-4 border-gray-200 border-t-primary-600 rounded-full animate-spin mb-6"></div>
            <h2 className="text-xl font-semibold mb-2">Loading...</h2>
          </div>
        }>
          <CallbackHandler />
        </Suspense>
      </div>
    </div>
  );
}