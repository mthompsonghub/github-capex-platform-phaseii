import React, { useState } from 'react';
import { Button } from '@mui/material';
import { CapExSummaryCards } from '../components/capex/CapExSummaryCards';
import { ProjectRow } from '../components/capex/ProjectRow';
import { ProjectEditModal } from '../components/capex/ProjectEditModal';
import { useCapExData } from '../hooks/useCapExData';
import { BarChart2, Eye, EyeOff, Settings, AlertTriangle } from 'lucide-react';
import { CapExRecord } from '../types/capex';
import { Project } from '../components/capex/data/capexData';
import { AdminConfig } from '../components/capex/admin/AdminConfig';
import { convertProjectToCapExRecord, convertCapExRecordToProject } from '../utils/projectUtils';
import { CapExErrorBoundary } from '../components/ErrorBoundary';

const KPIOverviewPageContent: React.FC = () => {
  const { data: projects, isLoading, error, updateProject } = useCapExData();
  const [showFinancials, setShowFinancials] = useState(true);
  const [showAdminConfig, setShowAdminConfig] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | CapExRecord | null>(null);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600" role="status" aria-label="Loading"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-red-600">
        Error loading data: {error.message}
      </div>
    );
  }

  const handleEditProject = (project: Project | CapExRecord) => {
    setSelectedProject(project);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedProject(null);
  };

  const handleSaveProject = (updatedProject: Project | CapExRecord) => {
    handleProjectUpdate(updatedProject);
    setIsModalOpen(false);
    setSelectedProject(null);
  };

  const handleProjectUpdate = (updatedProject: Project | CapExRecord) => {
    if ('project_name' in updatedProject) {
      updateProject(convertCapExRecordToProject(updatedProject));
    } else {
      updateProject(updatedProject);
    }
  };

  const handleAdminConfigUpdate = () => {
    // Refresh data to update project statuses with new thresholds
    window.location.reload();
  };

  const handleAnalyticsClick = () => {
    alert("Analytics functionality coming in Phase 3");
  };

  const handleTestError = () => {
    throw new Error('Test Component Error');
  };

  const capExRecords: CapExRecord[] = projects.map(convertProjectToCapExRecord);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900">CapEx Scorecard</h1>
        <div className="flex gap-4">
          <Button
            onClick={() => setShowFinancials(!showFinancials)}
            variant="outlined"
            color="primary"
            startIcon={showFinancials ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            sx={{ 
              borderColor: '#1e40af',
              color: '#1e40af',
              '&:hover': {
                borderColor: '#1e40af',
                backgroundColor: '#EFF6FF'
              }
            }}
          >
            {showFinancials ? 'Hide Financials' : 'Show Financials'}
          </Button>
          <Button
            onClick={() => setShowAdminConfig(true)}
            variant="outlined"
            color="primary"
            startIcon={<Settings className="w-4 h-4" />}
            sx={{ 
              borderColor: '#1e40af',
              color: '#1e40af',
              '&:hover': {
                borderColor: '#1e40af',
                backgroundColor: '#EFF6FF'
              }
            }}
          >
            Admin Settings
          </Button>
          <Button
            onClick={handleAnalyticsClick}
            variant="contained"
            startIcon={<BarChart2 className="w-4 h-4" />}
            sx={{ 
              backgroundColor: '#1e40af',
              '&:hover': {
                backgroundColor: '#1e3a8a'
              }
            }}
          >
            Analytics
          </Button>
          {process.env.NODE_ENV === 'development' && (
            <Button
              onClick={handleTestError}
              variant="outlined"
              color="error"
              startIcon={<AlertTriangle className="w-4 h-4" />}
              sx={{ 
                borderColor: '#dc2626',
                color: '#dc2626',
                '&:hover': {
                  borderColor: '#dc2626',
                  backgroundColor: '#FEF2F2'
                }
              }}
            >
              Test Error
            </Button>
          )}
        </div>
      </div>

      <CapExSummaryCards data={capExRecords} />

      <div className="space-y-4">
        {capExRecords.map((project) => (
          <ProjectRow
            key={project.id}
            project={project}
            onEdit={() => handleEditProject(project)}
            showFinancials={showFinancials}
          />
        ))}
      </div>

      <AdminConfig 
        open={showAdminConfig}
        onClose={() => setShowAdminConfig(false)}
        onUpdate={handleAdminConfigUpdate}
      />

      {selectedProject && (
        <ProjectEditModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          project={selectedProject}
          onSave={handleSaveProject}
        />
      )}
    </div>
  );
};

export const KPIOverviewPage: React.FC = () => {
  return (
    <CapExErrorBoundary>
      <KPIOverviewPageContent />
    </CapExErrorBoundary>
  );
}; 