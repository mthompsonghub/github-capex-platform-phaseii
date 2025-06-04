import { Link, useLocation } from 'react-router-dom';

interface TabsProps {
  activeTab: 'matrix' | 'resources' | 'projects';
  onTabChange: (tab: 'matrix' | 'resources' | 'projects') => void;
}

export function Tabs({ activeTab, onTabChange }: TabsProps) {
  const location = useLocation();
  
  const tabs = [
    { id: 'matrix' as const, name: 'Matrix View', path: '.' },
    { id: 'resources' as const, name: 'Resource Summary', path: 'resources' },
    { id: 'projects' as const, name: 'Project Summary', path: 'projects' },
  ];

  return (
    <div className="border-b border-gray-200">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex space-x-8">
          {tabs.map((tab) => (
            <Link
              key={tab.id}
              to={tab.path}
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
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}