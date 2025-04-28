'use client';

import React from 'react';
import { useTheme } from 'next-themes';
import { Switch } from "@heroui/react";

export const ThemeToggle: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const current = theme;
  const nextTheme = current === 'light' ? 'dark' : current === 'dark' ? 'leet' : 'light';

  return (
    <Switch
      isSelected={current === 'leet'}
      onValueChange={() => setTheme(nextTheme)}
      classNames={{
        base: current === 'leet' ? 'bg-black border-green-400' : '',
        wrapper: current === 'leet' ? 'border-green-400' : '',
        thumb: current === 'leet' ? 'bg-green-400 border-green-400' : '',
      }}
      aria-label="Cycle theme: light, dark, leet"
    />
  );
};
export default ThemeToggle;