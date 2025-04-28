'use client';

import React, { createContext, useContext, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import MatrixRain from "@/components/ui/MatrixRain"; // Import the rain effect

 interface NavigationContextProps {
   currentPath: string;
 }

 const NavigationContext = createContext<NavigationContextProps | undefined>(
   undefined
 );

 export const NavigationProvider = ({ children }: { children: React.ReactNode }) => {
   const pathname = usePathname();
   const [isNavigating, setIsNavigating] = useState(false);
   let navigationTimer: NodeJS.Timeout | null = null;

   // Track route changes to trigger the effect
   useEffect(() => {
     const handleStart = () => {
       setIsNavigating(true);
       // Clear any existing timer
       if (navigationTimer) clearTimeout(navigationTimer);
       // Set timer to hide rain after 0.5 seconds (reduced from 2s)
       navigationTimer = setTimeout(() => {
         setIsNavigating(false);
         navigationTimer = null;
       }, 500); // Changed from 2000 to 500
     };

     // For Next.js App Router, usePathname change is a good indicator
     // We trigger on pathname change, assuming it means navigation started
     handleStart();

     // Cleanup timer on unmount
     return () => {
       if (navigationTimer) clearTimeout(navigationTimer);
     };
   }, [pathname]); // Rerun whenever the pathname changes

   return (
     <NavigationContext.Provider value={{ currentPath: pathname }}>
      <MatrixRain isVisible={isNavigating} />
       {children}
     </NavigationContext.Provider>
   );
 };

 export const useNavigation = () => {
   const context = useContext(NavigationContext);
   if (context === undefined) {
     throw new Error("useNavigation must be used within a NavigationProvider");
   }
   return context;
 };