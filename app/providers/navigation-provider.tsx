"use client";

import { createContext, useContext, useState, useEffect, ReactNode, Suspense } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

interface NavigationContextType {
  isNavigating: boolean;
  previousPath: string | null;
  currentPath: string;
}

const NavigationContext = createContext<NavigationContextType>({
  isNavigating: false,
  previousPath: null,
  currentPath: '/',
});

export function useNavigation() {
  return useContext(NavigationContext);
}

// Create a component that uses the search params but is wrapped in Suspense
function NavigationProviderInner({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isNavigating, setIsNavigating] = useState(false);
  const [previousPath, setPreviousPath] = useState<string | null>(null);
  const [currentPath, setCurrentPath] = useState(pathname);

  // Track navigation changes
  useEffect(() => {
    if (pathname !== currentPath) {
      setPreviousPath(currentPath);
      setCurrentPath(pathname);
      
      // Brief navigation state to handle transitions
      setIsNavigating(true);
      const timer = setTimeout(() => {
        setIsNavigating(false);
      }, 300); // Short timeout to ensure proper transition
      
      return () => clearTimeout(timer);
    }
  }, [pathname, searchParams, currentPath]);

  return (
    <NavigationContext.Provider value={{ isNavigating, previousPath, currentPath }}>
      {children}
    </NavigationContext.Provider>
  );
}

// Export the provider with Suspense built in
export function NavigationProvider({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={null}>
      <NavigationProviderInner>
        {children}
      </NavigationProviderInner>
    </Suspense>
  );
}