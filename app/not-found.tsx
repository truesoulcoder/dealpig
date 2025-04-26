'use client';

import { Suspense } from 'react';
import { Button } from '@heroui/react';
import Link from 'next/link';

// Create a client component that uses useSearchParams
function NotFoundContent() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4">
      <h1 className="text-4xl font-bold mb-4">404 - Page Not Found</h1>
      <p className="text-xl mb-8">The page you're looking for doesn't exist or has been moved.</p>
      <Button as={Link} href="/" color="primary" size="lg">
        Return to Dashboard
      </Button>
    </div>
  );
}

// Export a component that wraps the content in Suspense
export default function NotFound() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-[70vh]">Loading...</div>}>
      <NotFoundContent />
    </Suspense>
  );
}