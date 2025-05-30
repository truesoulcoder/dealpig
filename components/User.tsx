'use client';

import { useEffect, useState } from 'react';
import supabase from '@/lib/supabase';
import Image from 'next/image';
import { Database } from '@/helpers/types';

interface UserProps {
  userId?: string;
  showAvatar?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function User({ userId, showAvatar = true, size = 'md', className = '' }: UserProps) {
  const [user, setUser] = useState<{
    id: string;
    email?: string;
    full_name?: string;
    avatar_url?: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUser() {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (currentUser) {
        setUser({
          id: currentUser.id,
          email: currentUser.email,
          full_name: currentUser.user_metadata?.full_name,
          avatar_url: currentUser.user_metadata?.avatar_url,
        });
      }
      setLoading(false);
    }

    fetchUser();
  }, []);

  if (loading) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className={`
          ${size === 'sm' ? 'w-6 h-6' : size === 'md' ? 'w-8 h-8' : 'w-12 h-12'}
          rounded-full bg-gray-200 animate-pulse
        `} />
        <div className="h-4 bg-gray-200 rounded animate-pulse w-24" />
      </div>
    );
  }

  if (!user) {
    // Always render a fallback avatar and label if user is missing
    const avatarSize = size === 'sm' ? 24 : size === 'md' ? 32 : 48;
    const textSize = size === 'sm' ? 'text-sm' : size === 'md' ? 'text-base' : 'text-lg';
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        {showAvatar && (
          <div className={`
            ${size === 'sm' ? 'w-6 h-6' : size === 'md' ? 'w-8 h-8' : 'w-12 h-12'}
            rounded-full bg-gray-400 flex items-center justify-center text-white font-medium
            ${size === 'sm' ? 'text-xs' : size === 'md' ? 'text-sm' : 'text-base'}
          `}>
            ?
          </div>
        )}
        <span className={`font-medium ${textSize}`}>Not signed in</span>
      </div>
    );
  }

  const avatarSize = size === 'sm' ? 24 : size === 'md' ? 32 : 48;
  const textSize = size === 'sm' ? 'text-sm' : size === 'md' ? 'text-base' : 'text-lg';

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {showAvatar && (
        user.avatar_url ? (
          <Image
            src={user.avatar_url}
            alt={user.full_name || user.email || ''}
            width={avatarSize}
            height={avatarSize}
            className="rounded-full"
          />
        ) : (
          <div className={`
            ${size === 'sm' ? 'w-6 h-6' : size === 'md' ? 'w-8 h-8' : 'w-12 h-12'}
            rounded-full bg-blue-500 flex items-center justify-center text-white font-medium
            ${size === 'sm' ? 'text-xs' : size === 'md' ? 'text-sm' : 'text-base'}
          `}>
            {(user.full_name || user.email || '?').charAt(0).toUpperCase()}
          </div>
        )
      )}
      <span className={`font-medium ${textSize}`}>
        {user.full_name || user.email?.split('@')[0] || ''}
      </span>
    </div>
  );
} 