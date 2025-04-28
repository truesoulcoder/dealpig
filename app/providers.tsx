"use client";
import * as React from "react";
import { createContext, useEffect } from "react";
import { createMachine } from 'xstate';
import { useMachine } from '@xstate/react';
import { useTheme as useNextTheme } from "next-themes";
import { HeroUIProvider } from "@heroui/system";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ThemeProviderProps } from "next-themes";
import { NavigationProvider } from "./providers/navigation-provider";

export interface ProvidersProps {
  children: React.ReactNode;
  themeProps?: ThemeProviderProps;
}

// Theme machine: light -> dark -> leet
const themeMachine = createMachine({
  id: 'theme', initial: 'light', states: {
    light: { on: { TOGGLE: 'dark' } },
    dark: { on: { TOGGLE: 'leet' } },
    leet: { on: { TOGGLE: 'light' } }
  }
});
// Provide theme service via context
export const ThemeMachineContext = createContext<any>(null);

// Sync machine state with next-themes
function ThemeMachineProvider({ children }: { children: React.ReactNode }) {
  const [state, send, service] = useMachine(themeMachine);
  const { setTheme } = useNextTheme();
  useEffect(() => {
    setTheme(state.value.toString());
  }, [state.value, setTheme]);
  return (
    <ThemeMachineContext.Provider value={service}>
      {children}
    </ThemeMachineContext.Provider>
  );
}

export function Providers({ children, themeProps }: ProvidersProps) {
  // No XState here; machine lives in ThemeMachineProvider

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
      defaultTheme="dark"
      attribute="data-theme"
      value={{ light: "light", dark: "dark", leet: "leet" }}
      themes={["light", "dark", "leet"]}
      enableSystem={true}
      enableColorScheme={true}
      disableTransitionOnChange
      {...themeProps}>
      <ThemeMachineProvider>
        <HeroUIProvider>
          <NavigationProvider>
            {children}
          </NavigationProvider>
        </HeroUIProvider>
      </ThemeMachineProvider>
    </NextThemesProvider>
  );
}
