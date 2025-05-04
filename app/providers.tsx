"use client";
import * as React from "react";

import { HeroUIProvider } from "@heroui/system";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ThemeProviderProps } from "next-themes";
import { ThemeProvider as CustomThemeProvider } from "../components/ui/theme-context";
import MatrixRain from "../components/ui/MatrixRain";

export interface ProvidersProps {
  children: React.ReactNode;
  themeProps?: ThemeProviderProps;
}

// No XState integration; use next-themes directly

export function Providers({ children, themeProps }: ProvidersProps) {
  // Use next-themes for global theme management

  // Create a theme object for HeroUI
  const theme = {
    extend: {
      colors: {
        // Add any custom colors your app uses
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
      },
      fonts: {
        sans: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif',
      },
    },
  };

  return (
    <NextThemesProvider
      defaultTheme="leet"
      attribute="data-theme"
      value={{ leet: "leet", dark: "dark" }}
      themes={["leet", "dark"]}
      enableSystem={true}
      enableColorScheme={true}
      disableTransitionOnChange
      {...themeProps}>
      <CustomThemeProvider>
        <HeroUIProvider>
          {/* Render MatrixRain behind everything */}
          <MatrixRain /> 
          {/* Render the rest of the application on top */}
          {children}
        </HeroUIProvider>
      </CustomThemeProvider>
    </NextThemesProvider>
  );
}
