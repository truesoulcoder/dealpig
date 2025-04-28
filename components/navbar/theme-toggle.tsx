'use client';

import React from 'react';
import { useTheme } from 'next-themes';
import { Switch } from "@heroui/react";

export const ThemeToggle: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const isLeetTheme = theme === 'leet';

  return (
    <Switch
      isSelected={isLeetTheme}
      onValueChange={(value) => setTheme(value ? 'leet' : 'normie')}
      classNames={{
        base: isLeetTheme ? 'bg-black border-green-400 font-mono text-green-400' : '',
        wrapper: isLeetTheme ? 'border-green-400' : '',
        thumb: isLeetTheme ? 'bg-green-400 border-green-400' : '',
      }}
      aria-label="Toggle Leet Theme"
    />
  );
};


export default ThemeToggle;