'use client';

import { handleAuthCallback } from '@/actions/auth.action';
import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';

// Client component that uses searchParams
function CallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    // Extract the code from the URL
    const code = searchParams.get('code');
    
    if (!code) {
      setError('No authorization code found');
      return;
    }
    
    const processAuth = async () => {
      try {
        const result = await handleAuthCallback(code);
        
        if (result.error) {
          setError(result.error);
        } else {
          // Redirect to the dashboard after successful authentication
          router.replace('/');
        }
      } catch (err) {
        console.error('Error processing authentication:', err);
        setError('Failed to process authentication. Please try again.');
      }
    };
    
    processAuth();
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