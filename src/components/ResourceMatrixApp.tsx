import { useState } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Tabs } from './Tabs';
import { MatrixView } from './matrix/MatrixView';
import { ResourceSummary } from './resources/ResourceSummary';
import { ProjectSummary } from './projects/ProjectSummary';

type Tab = 'matrix' | 'resources' | 'projects';

export function ResourceMatrixApp() {
  const [activeTab, setActiveTab] = useState<Tab>('matrix');
  const location = useLocation();

  // Handle tab changes through routing
  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Tabs activeTab={activeTab} onTabChange={handleTabChange} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Routes>
          <Route path="/" element={<MatrixView />} />
          <Route path="/resources" element={<ResourceSummary />} />
          <Route path="/projects" element={<ProjectSummary />} />
          <Route path="*" element={<Navigate to="." replace />} />
        </Routes>
      </main>
    </div>
  );
}