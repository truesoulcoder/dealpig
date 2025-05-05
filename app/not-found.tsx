'use client';

import { Suspense } from 'react';
// import { Button } from '@heroui/react';
import Link from 'next/link';

// Create a client component that uses useSearchParams
function NotFoundContent() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] bg-[#181c20] px-4">
      <div className="bg-[#23272f] rounded-3xl shadow-2xl p-10 flex flex-col items-center max-w-lg w-full">
        <svg width="56" height="56" fill="none" viewBox="0 0 56 56" className="mb-6">
          <circle cx="28" cy="28" r="28" fill="#90e0a4" fillOpacity="0.08"/>
          <path d="M28 18v12m0 4h.02" stroke="#90e0a4" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <h1 className="text-5xl font-bold mb-4 text-[#90e0a4] tracking-tight">404</h1>
        <p className="text-2xl mb-8 text-[#e0e6ed] font-semibold">Page Not Found</p>
        <p className="mb-8 text-[#b8c4ce] text-lg">Sorry, the page you’re looking for doesn’t exist or has been moved. Let’s get you back on track.</p>
        <a
          href="/"
          className="inline-block px-8 py-3 text-lg font-bold rounded-full shadow-lg bg-gradient-to-r from-[#90e0a4] to-[#3ecf8e] text-[#181c20] hover:from-[#6fd6a6] hover:to-[#3ecf8e] transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#90e0a4] focus:ring-offset-2"
        >
          Return to Dashboard
        </a>
      </div>
    </div>
  );
}

// Export the client 404 page directly
export default NotFoundContent;