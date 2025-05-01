// File: app/(auth)/auth-code-error/page.tsx
'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { AuthLayoutWrapper } from '@/components/auth/authLayout'; // Use named import

export default function AuthCodeErrorPage() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');

  return (
    <AuthLayoutWrapper>
      <div className="text-center">
        <h1 className="text-2xl font-semibold text-red-600 mb-4">Authentication Error</h1>
        <p className="mb-2">There was a problem during the authentication process.</p>
        {error && (
          <p className="text-sm text-gray-600 mb-1">
            <strong>Error Code:</strong> <code className="bg-gray-100 px-1 rounded">{error}</code>
          </p>
        )}
        {errorDescription && (
          <p className="text-sm text-gray-600 mb-4">
            <strong>Details:</strong> {decodeURIComponent(errorDescription || '')}
          </p>
        )}
        <p>
          Please try{' '}
          <Link href="/login" className="text-blue-600 hover:underline">
            logging in
          </Link>{' '}
          again.
        </p>
      </div>
    </AuthLayoutWrapper>
  );
}
