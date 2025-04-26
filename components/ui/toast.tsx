"use client";

import React, { createContext, useContext } from 'react';

// Define types for toast functionality
export type ToastVariant = 'default' | 'destructive' | 'success' | 'warning' | 'info';

export interface ToastOptions {
  title: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;
}

export interface Toast {
  id: string | number;
  options: ToastOptions;
}

export interface ToastContextType {
  addToast: (options: ToastOptions) => { id: string | number };
  removeToast?: (id: string | number) => void;
}

// Toast context to provide toast functionality throughout the app
const ToastContext = createContext<ToastContextType | null>(null);

// Toast provider component
export function ToastProvider({ children }: { children: React.ReactNode }): React.ReactElement {
  // Simple toast implementation that logs to console
  // In a real implementation, this would render actual toast UI components
  const addToast = (options: ToastOptions) => {
    const { title, description, variant = 'default' } = options;
    
    if (variant === 'destructive') {
      console.error(`TOAST ERROR: ${title} - ${description}`);
    } else {
      console.log(`TOAST ${variant.toUpperCase()}: ${title} - ${description}`);
    }
    
    return { id: Date.now() }; // Return a mock toast id
  };
  
  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
    </ToastContext.Provider>
  );
}

// Hook to use toast in components
export function useToast() {
  const context = useContext(ToastContext);
  
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  
  return {
    toast: (options: ToastOptions) => context.addToast(options),
  };
}

// Interface for the direct toast object API
interface ToastAPI {
  success: (message: string) => void;
  error: (message: string) => void;
  default: (options: ToastOptions | string) => void;
  destructive: (options: ToastOptions | string) => void;
  [key: string]: any; // Allow additional toast types
}

// Legacy support for direct toast calls
export const toast: ToastAPI = {
  success: (message: string) => console.log(`SUCCESS: ${message}`),
  error: (message: string) => console.error(`ERROR: ${message}`),
  
  // Add support for the object-style calls used in our components
  default: (options: ToastOptions | string) => {
    if (typeof options === 'string') {
      console.log(`INFO: ${options}`);
    } else {
      console.log(`INFO: ${options.title} - ${options.description || ''}`);
    }
  },
  
  destructive: (options: ToastOptions | string) => {
    if (typeof options === 'string') {
      console.error(`ERROR: ${options}`);
    } else {
      console.error(`ERROR: ${options.title} - ${options.description || ''}`);
    }
  }
};

export default toast;