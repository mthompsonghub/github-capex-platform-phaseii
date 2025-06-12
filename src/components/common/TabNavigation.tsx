import React from 'react';
import { twMerge } from 'tailwind-merge';

export interface Tab {
  id: string;
  label: string;
}

interface TabNavigationProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

export function TabNavigation({ tabs, activeTab, onTabChange }: TabNavigationProps) {
  return (
    <div className="border-t border-gray-200">
      <div className="flex">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={twMerge(
              'flex-1 py-2 px-4 text-sm font-medium border-t-2 border-r border-l border-b',
              'focus:outline-none transition-colors duration-200',
              activeTab === tab.id
                ? 'border-union-blue border-t-2 bg-white text-union-blue'
                : 'border-transparent hover:border-gray-300 bg-gray-100 text-gray-500 hover:text-gray-700'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
} 