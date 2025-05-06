'use client';

import React from 'react';
import { Icon } from '@iconify/react';

interface ConsoleLogProps {
  messages: Array<{
    type: 'info' | 'error' | 'success';
    message: string;
  }>;
}

const ConsoleLog: React.FC<ConsoleLogProps> = ({ messages }) => {
  const consoleRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (consoleRef.current) {
      consoleRef.current.scrollTop = consoleRef.current.scrollHeight;
    }
  }, [messages]);

  const getIconForType = (type: 'info' | 'error' | 'success') => {
    switch (type) {
      case 'info':
        return <Icon icon="lucide:info" className="text-blue-500" />;
      case 'error':
        return <Icon icon="lucide:alert-circle" className="text-danger-500" />;
      case 'success':
        return <Icon icon="lucide:check-circle" className="text-green-500" />;
      default:
        return null;
    }
  };

  const getClassForType = (type: 'info' | 'error' | 'success') => {
    switch (type) {
      case 'info':
        return 'text-blue-400';
      case 'error':
        return 'text-red-400';
      case 'success':
        return 'text-green-400';
      default:
        return '';
    }
  };

  const formatTimestamp = () => {
    const now = new Date();
    return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
  };

  return (
    <div style={{ border: '2px solid #0f0', borderRadius: 8, background: '#101010' }}>
      <div style={{ borderBottom: '2px solid #0f0', background: '#011', color: '#0f0', padding: '8px 16px', fontWeight: 'bold', fontSize: 16 }}>
        Upload Progress Console
      </div>
      <div
        ref={consoleRef}
        className="overflow-y-auto font-mono text-sm leading-tight"
        style={{ fontFamily: "Consolas, 'Courier New', monospace", height: '191px', lineHeight: '1.25' }}
      >
        {messages.map((msg, index) => (
          <div key={index} className="mb-2 flex items-start">
            <span className="text-gray-400 mr-2">[{formatTimestamp()}]</span>
            <span className="mr-2">{getIconForType(msg.type)}</span>
            <span className={getClassForType(msg.type)}>{msg.message}</span>
          </div>
        ))}
        {messages.length === 0 && (
          <div className="text-gray-500 italic">No messages yet</div>
        )}
      </div>
    </div>
  );
};

export default ConsoleLog;
