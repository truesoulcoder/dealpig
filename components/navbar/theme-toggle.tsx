'use client';

import React from 'react';
import { useTheme } from 'next-themes';

export const ThemeToggle: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const isLeetTheme = theme === 'leet';

  return (
    <div className="flex items-center">
      <button
        onClick={() => setTheme(isLeetTheme ? 'dark' : 'leet')}
        className={`px-3 py-1 ${
          isLeetTheme 
            ? 'bg-green-400 text-black font-mono border border-green-400 rounded-none' 
            : 'bg-gray-700 text-gray-200 rounded-md'
        } transition-all duration-200`}
      >
        {isLeetTheme ? '[NORMAL]' : '[L33T]'}
      </button>
    </div>
  );
};

// Alternative version with dropdown if needed
export const ThemeToggleDropdown: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const isLeetTheme = theme === 'leet';

  return (
    <div className="flex items-center space-x-2">
      <select
        value={theme}
        onChange={(e) => setTheme(e.target.value)}
        className={`cursor-pointer ${
          isLeetTheme
            ? 'bg-black text-green-400 font-mono border border-green-400 rounded-none'
            : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-md'
        } px-2 py-1`}
      >
        <option value="light">Light</option>
        <option value="dark">Dark</option>
        <option value="leet">L33T</option>
      </select>
    </div>
  );
};

export default ThemeToggle;