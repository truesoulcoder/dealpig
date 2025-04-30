'use client';

import { Navbar, NavbarContent } from "@heroui/react";
import React, { useEffect, useState, Suspense } from "react";
import { useTheme } from "next-themes";
import ThemeToggle from "./theme-toggle";
import { supabase } from "@/lib/supabase";
import { BurguerButton } from "./burguer-button";
import User from "../User";
import { User as SupabaseUser } from '@supabase/supabase-js';

interface Props {
  children: React.ReactNode;
}

function UserSection() {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
    
    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    }
    loadUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (!mounted) return null;

  return user ? <User userId={user.id} /> : null;
}

export const NavbarWrapper = ({ children }: Props) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  return (
    <div className="relative flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
      <Navbar
        isBordered
        className={`w-full sticky top-0 z-40 ${
          isLight
            ? 'bg-white border border-green-400 text-black font-mono'
            : 'bg-background/90 backdrop-blur-md'
        }`}
      >
        <NavbarContent justify="start" className="flex items-center gap-4 px-4">
          <BurguerButton />
        </NavbarContent>
        <NavbarContent justify="end" className="flex items-center gap-4 px-4">
          <ThemeToggle />
          <User size="sm" />
        </NavbarContent>
      </Navbar>
      {children}
    </div>
  );
};
