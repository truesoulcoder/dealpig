import React from 'react';
import { ScrollShadow } from '@heroui/react';
import { Icon } from '@iconify/react';

interface ConsoleLogProps {
  messages: Array<{
    type: 'info' | 'error' | 'success';
    message: string;
  }>;
}

export const ConsoleLog: React.FC<ConsoleLogProps> = ({ messages }) => {
  const consoleRef = React.useRef<HTMLDivElement>(null);
  
  React.useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
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
        return <Icon icon="lucide:check-circle" className="text-success-500" />;
    }
  };
  
  const getClassForType = (type: 'info' | 'error' | 'success') => {
    switch (type) {
      case 'info':
        return 'text-blue-700';
      case 'error':
        return 'text-danger-700';
      case 'success':
        return 'text-success-700';
    }
  };
  
  const formatTimestamp = () => {
    const now = new Date();
    return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
  };
  
  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Console Log</h2>
      </div>
      
      <ScrollShadow 
        ref={consoleRef}
        className="flex-grow bg-gray-900 text-gray-100 p-4 font-mono text-sm rounded-md overflow-auto"
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
      </ScrollShadow>
    </div>
  );
};