'use client';

import React from 'react';
import { useTheme } from '@/components/ui/theme-context';
import { Switch } from "@heroui/react";

export const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  // Only two states: 'heroui' (dark) and 'leet'
  return (
    <Switch
      isSelected={theme === 'leet'}
      onValueChange={toggleTheme}
      classNames={{
        base: theme === 'leet' ? 'bg-black border-green-400' : '',
        thumb: theme === 'leet' ? 'bg-green-400 border-green-400 shadow-[0_0_0_1px_rgba(0,255,0,1)]' : '',
        wrapper: theme === 'leet' ? 'border-green-400' : '',
      }}
      aria-label="Switch theme between dark and leet"
    />
  );
};
export default ThemeToggle;