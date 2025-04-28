'use client';

import React from 'react';
import { useTheme } from 'next-themes';

export const ThemeToggle: React.FC = () => {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex items-center space-x-2">
      <select
        value={theme}
        onChange={(e) => setTheme(e.target.value)}
        className={`cursor-pointer ${
          theme === 'leet'
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

// Alternative version with buttons instead of dropdown
export const ThemeSwitcher: React.FC = () => {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex items-center space-x-2">
      <button
        onClick={() => setTheme('light')}
        className={`px-3 py-1 ${
          theme === 'light' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'
        } rounded-l-md`}
      >
        Light
      </button>
      <button
        onClick={() => setTheme('dark')}
        className={`px-3 py-1 ${
          theme === 'dark' ? 'bg-blue-500 text-white' : 'bg-gray-700 text-gray-200'
        }`}
      >
        Dark
      </button>
      <button
        onClick={() => setTheme('leet')}
        className={`px-3 py-1 ${
          theme === 'leet' 
            ? 'bg-green-400 text-black font-mono' 
            : 'bg-black text-green-400 font-mono'
        } rounded-r-md`}
      >
        L33T
      </button>
    </div>
  );
};

export default ThemeToggle;