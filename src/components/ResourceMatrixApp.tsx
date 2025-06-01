import { useState } from 'react';
import { Tabs } from './Tabs';
import { MatrixView } from './matrix/MatrixView';
import { ResourceSummary } from './resources/ResourceSummary';
import { ProjectSummary } from './projects/ProjectSummary';

type Tab = 'matrix' | 'resources' | 'projects';

export function ResourceMatrixApp() {
  const [activeTab, setActiveTab] = useState<Tab>('matrix');

  const renderContent = () => {
    switch (activeTab) {
      case 'matrix':
        return <MatrixView />;
      case 'resources':
        return <ResourceSummary />;
      case 'projects':
        return <ProjectSummary />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Tabs activeTab={activeTab} onTabChange={setActiveTab} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderContent()}
      </main>
    </div>
  );
}