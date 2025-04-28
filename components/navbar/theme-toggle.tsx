'use client';

import React, { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { Switch } from "@heroui/react";

export const ThemeToggle: React.FC = () => {
  // Always call hooks in same order
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) {
    return <div className="w-10 h-6" />;
  }
  const current = resolvedTheme;
  const nextTheme = current === 'light' ? 'dark' : current === 'dark' ? 'leet' : 'light';
  return (
    <Switch
      isSelected={current === 'leet'}
      onValueChange={() => setTheme(nextTheme)}
      classNames={{
        base: current === 'leet' ? 'bg-black border-green-400' : '',
        thumb: current === 'leet' ? 'bg-green-400 border-green-400 shadow-[0_0_0_1px_rgba(0,255,0,1)]' : '',
        wrapper: current === 'leet' ? 'border-green-400' : '',
      }}
      aria-label="Cycle theme: light, dark, leet"
    />
  );
};
export default ThemeToggle;