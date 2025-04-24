"use client";

import React, { useState, createContext, useContext } from 'react';
import { Tabs as HeroTabs } from '@heroui/react';

type TabsContextValue = {
  selectedTab: string;
  setSelectedTab: (tab: string) => void;
};

const TabsContext = createContext<TabsContextValue | undefined>(undefined);

interface TabsProps {
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  className?: string;
  children?: React.ReactNode;
}

export function Tabs({ 
  defaultValue, 
  value, 
  onValueChange, 
  className, 
  children,
  ...props 
}: TabsProps & React.HTMLAttributes<HTMLDivElement>) {
  const [selectedTab, setSelectedTab] = useState(value || defaultValue || "");

  const handleValueChange = (tab: string) => {
    if (onValueChange) {
      onValueChange(tab);
    } else {
      setSelectedTab(tab);
    }
  };

  return (
    <TabsContext.Provider value={{ 
      selectedTab: value !== undefined ? value : selectedTab, 
      setSelectedTab: handleValueChange 
    }}>
      <div className={className} {...props}>
        {children}
      </div>
    </TabsContext.Provider>
  );
}

interface TabsListProps {
  className?: string;
  children?: React.ReactNode;
}

export function TabsList({ className, children, ...props }: TabsListProps & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <HeroTabs className={`flex space-x-1 ${className || ''}`} {...props}>
      {children}
    </HeroTabs>
  );
}

interface TabsTriggerProps {
  value: string;
  className?: string;
  children?: React.ReactNode;
}

export function TabsTrigger({ 
  value,
  className, 
  children, 
  ...props 
}: TabsTriggerProps & React.HTMLAttributes<HTMLButtonElement>) {
  const context = useContext(TabsContext);
  
  if (!context) {
    throw new Error("TabsTrigger must be used within a Tabs component");
  }
  
  const { selectedTab, setSelectedTab } = context;
  const isActive = selectedTab === value;
  
  return (
    <button
      type="button"
      role="tab"
      aria-selected={isActive}
      className={`px-4 py-2 rounded-t-lg ${isActive ? 'bg-white text-primary border-b-2 border-primary' : 'text-gray-500 hover:text-gray-700'} ${className || ''}`}
      onClick={() => setSelectedTab(value)}
      {...props}
    >
      {children}
    </button>
  );
}

interface TabsContentProps {
  value: string;
  className?: string;
  children?: React.ReactNode;
}

export function TabsContent({ 
  value, 
  className, 
  children, 
  ...props 
}: TabsContentProps & React.HTMLAttributes<HTMLDivElement>) {
  const context = useContext(TabsContext);
  
  if (!context) {
    throw new Error("TabsContent must be used within a Tabs component");
  }
  
  const { selectedTab } = context;
  
  if (selectedTab !== value) {
    return null;
  }

  return (
    <div
      role="tabpanel"
      className={className}
      {...props}
    >
      {children}
    </div>
  );
}