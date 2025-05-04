'use client';

import { Suspense } from 'react';
// import { Button } from '@heroui/react';
import Link from 'next/link';

// Create a client component that uses useSearchParams
function NotFoundContent() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4">
      <h1 className="text-4xl font-bold mb-4">404 - Page Not Found</h1>
      <p className="text-xl mb-8">The page you're looking for doesn't exist or has been moved.</p>
      <a
        href="/"
        className="inline-block px-6 py-3 text-lg font-semibold text-white bg-green-600 rounded shadow hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2"
      >
        Return to Dashboard
      </a>
    </div>
  );
}

// Export the client 404 page directly
export default NotFoundContent;