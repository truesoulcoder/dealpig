"use client";

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React from 'react';

interface NavLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  prefetch?: boolean;
}

/**
 * A consistent navigation component that handles both Next.js Link navigation
 * and proper client-side transitions. This helps prevent the issue where
 * clicking links sometimes shows raw code instead of rendered pages.
 */
export default function NavLink({ 
  href, 
  children, 
  className = "", 
  onClick,
  prefetch = true
}: NavLinkProps) {
  const router = useRouter();

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (onClick) {
      onClick();
    }
    
    // Check if it's a special click that should follow default behavior
    // like ctrl+click for new tab
    const isModifiedEvent = (e.metaKey || e.ctrlKey || e.shiftKey);
    const isLeftClick = e.button === 0;
    
    if (href && isLeftClick && !isModifiedEvent) {
      e.preventDefault();
      // Force a fresh navigation to prevent stale data issues
      router.push(href);
    }
  };

  return (
    <Link 
      href={href}
      className={className}
      onClick={handleClick}
      prefetch={prefetch}
    >
      {children}
    </Link>
  );
}