'use client';

import React, { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { Switch } from "@heroui/react";

export const ThemeToggle: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return null;
  // Only two states: 'dark' and 'leet'
  return (
    <Switch
      isSelected={theme === 'leet'}
      onValueChange={(value) => setTheme(value ? 'leet' : 'dark')}
      classNames={{
        base: theme === 'leet' ? 'bg-green-400 border-green-400' : '',
        thumb: theme === 'leet' ? 'bg-black border-green-400 shadow-[0_0_0_1px_rgba(0,255,0,1)]' : '',
        wrapper: theme === 'leet' ? 'border-green-400' : '',
      }}
      aria-label="Switch theme between dark and leet"
    />
  );
};
export default ThemeToggle;