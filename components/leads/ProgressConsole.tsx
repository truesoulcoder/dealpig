'use client';

import { useEffect, useRef } from 'react';
import { useTheme } from 'next-themes';

interface ProgressConsoleProps {
  logs: string[];
  progress: number;
  className?: string;
}

export default function ProgressConsole({ logs, progress, className = '' }: ProgressConsoleProps) {
  const { theme } = useTheme();
  const isLeetTheme = theme === 'leet';
  const consoleRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new logs are added
  useEffect(() => {
    if (consoleRef.current) {
      consoleRef.current.scrollTop = consoleRef.current.scrollHeight;
    }
  }, [logs]);

  // Get last 5 lines of logs
  const lastFiveLogs = logs.slice(-5);

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {/* Progress bar */}
      <div className="w-full bg-gray-700 rounded-full h-2.5 mb-2">
        <div 
          className={`h-2.5 rounded-full transition-all duration-500 ${
            isLeetTheme ? 'bg-green-400' : 'bg-blue-600'
          }`}
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Console window */}
      <div 
        ref={consoleRef}
        className={`
          h-[150px] 
          overflow-y-auto 
          font-mono 
          text-sm 
          p-3 
          rounded 
          ${isLeetTheme 
            ? 'bg-black text-green-400 border border-green-400' 
            : 'bg-gray-900 text-gray-100 border border-gray-700'
          }
        `}
      >
        {lastFiveLogs.map((log, index) => (
          <div 
            key={index} 
            className={`
              whitespace-pre-wrap 
              ${index === lastFiveLogs.length - 1 ? 'animate-pulse' : ''}
            `}
          >
            {`> ${log}`}
          </div>
        ))}
        {lastFiveLogs.length === 0 && (
          <div className="text-gray-500 italic">Waiting for upload...</div>
        )}
      </div>
    </div>
  );
} 