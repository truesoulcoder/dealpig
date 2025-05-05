'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { LetterFx } from './LetterFx';


interface ProfileMenuProps {
  user: {
    email: string;
    full_name: string;
  };
}

export function ProfileMenu({ user }: ProfileMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 text-green-400 hover:text-green-300 transition-colors"
      >
        <div className="w-8 h-8 rounded-full bg-green-400 flex items-center justify-center text-black font-bold">
          {user.full_name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase()}
        </div>
        <span className="font-mono">{user.full_name || user.email}</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-black border border-green-400 rounded-none shadow-lg z-50">

          <div className="relative z-10">
            <div className="py-1">
              <div className="px-4 py-2 text-sm text-green-400 border-b border-green-400">
                <div className="font-mono">{user.email}</div>
              </div>
              <button
                onClick={() => router.push('/profile')}
                className="w-full text-left px-4 py-2 text-sm text-green-400 hover:bg-green-400 hover:text-black transition-colors"
              >
                <LetterFx trigger="hover" speed="fast">
                  Profile Settings
                </LetterFx>
              </button>
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-2 text-sm text-green-400 hover:bg-green-400 hover:text-black transition-colors"
              >
                <LetterFx trigger="hover" speed="fast">
                  Logout
                </LetterFx>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 