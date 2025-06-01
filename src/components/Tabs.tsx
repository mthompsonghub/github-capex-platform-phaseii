import { useState } from 'react';

type Tab = 'matrix' | 'resources' | 'projects';

interface TabsProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
}

export function Tabs({ activeTab, onTabChange }: TabsProps) {
  const tabs = [
    { id: 'matrix' as const, name: 'Matrix View' },
    { id: 'resources' as const, name: 'Resource Summary' },
    { id: 'projects' as const, name: 'Project Summary' },
  ];

  return (
    <div className="border-b border-gray-200">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`
                ${activeTab === tab.id
                  ? 'border-[#C4161C] text-[#C4161C]'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
                whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
              `}
            >
              {tab.name}
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}