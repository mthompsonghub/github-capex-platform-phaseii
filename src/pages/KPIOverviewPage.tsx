import React, { useEffect, useState } from 'react';
import { Box, Typography, Button, Paper, Grid, CircularProgress, Alert } from '@mui/material';
import { useCapExStore } from '../stores/capexStore';
import { ProjectModalV3 } from '../components/capex/ProjectModalV3';
import { ProjectCardV3 } from '../components/capex/ProjectCardV3';
import { ProjectTableView } from '../components/capex/ProjectTableView';
import { supabase } from '../lib/supabase';
import { User } from '@supabase/supabase-js';
import { BarChart2, Eye, EyeOff, Settings, AlertTriangle, Plus, Download } from 'lucide-react';
import { CapExRecord, AdminSettings, CapexProject } from '../types/capex-unified';
import { AdminConfig } from '../components/capex/admin/AdminConfig';
import { CapExErrorBoundary } from '../components/ErrorBoundary';
import { ExecutiveBanner } from '../components/capex/ExecutiveBanner';
import { ViewControls } from '../components/capex/ViewControls';

// Helper function to convert Project to CapexProject
const convertToCapexProject = (project: Project): CapexProject => {
  return {
    id: project.id,
    name: project.projectName,
    owner: project.projectOwner,
    type: project.type,
    status: project.status,
    budget: project.totalBudget,
    spent: project.totalActual,
    overallCompletion: project.phases.feasibility.completion,
    timeline: project.startDate.toISOString(),
    sesNumber: project.sesNumber,
    financialNotes: project.financialNotes,
    upcomingMilestone: project.upcomingMilestone,
    phases: {
      feasibility: {
        name: 'Feasibility',
        weight: 0.25,
        completion: project.phases.feasibility.completion,
        items: [
          {
            name: 'Business Case',
            value: project.phases.feasibility.completion,
            isNA: false
          },
          {
            name: 'Stakeholder Alignment',
            value: project.phases.feasibility.completion,
            isNA: false
          },
          {
            name: 'Risk Assessment',
            value: project.phases.feasibility.completion,
            isNA: false
          }
        ]
      },
      planning: {
        name: 'Planning',
        weight: 0.25,
        completion: project.phases.planning.completion,
        items: [
          {
            name: 'Project Charter',
            value: project.phases.planning.completion,
            isNA: false
          },
          {
            name: 'Resource Allocation',
            value: project.phases.planning.completion,
            isNA: false
          },
          {
            name: 'Timeline Development',
            value: project.phases.planning.completion,
            isNA: false
          }
        ]
      },
      execution: {
        name: 'Execution',
        weight: 0.25,
        completion: project.phases.execution.completion,
        items: [
          {
            name: 'Implementation',
            value: project.phases.execution.completion,
            isNA: false
          },
          {
            name: 'Quality Control',
            value: project.phases.execution.completion,
            isNA: false
          },
          {
            name: 'Progress Tracking',
            value: project.phases.execution.completion,
            isNA: false
          }
        ]
      },
      close: {
        name: 'Close',
        weight: 0.25,
        completion: project.phases.close.completion,
        items: [
          {
            name: 'Final Review',
            value: project.phases.close.completion,
            isNA: false
          },
          {
            name: 'Documentation',
            value: project.phases.close.completion,
            isNA: false
          },
          {
            name: 'Lessons Learned',
            value: project.phases.close.completion,
            isNA: false
          }
        ]
      }
    }
  };
};

const KPIOverviewPageContent: React.FC = () => {
  // Use individual selectors for each state and method
  const projects = useCapExStore((state) => state.projects);
  const loading = useCapExStore((state) => state.loading);
  const error = useCapExStore((state) => state.error);
  const fetchProjects = useCapExStore((state) => state.actions.fetchProjects);
  const fetchAdminSettings = useCapExStore((state) => state.actions.fetchAdminSettings);
  
  const [selectedProject, setSelectedProject] = useState<CapexProject | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showAdminConfig, setShowAdminConfig] = useState(false);
  const [viewMode, setViewMode] = useState<'card' | 'table'>('card');
  const [showFinancials, setShowFinancials] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  
  useEffect(() => {
    fetchProjects();
    fetchAdminSettings();
  }, [fetchProjects, fetchAdminSettings]);
  
  const handleProjectClick = (project: CapexProject) => {
    setSelectedProject(project);
    setIsModalOpen(true);
  };
  
  const handleCreateProject = () => {
    setIsCreateModalOpen(true);
    // TODO: Implement create project modal
  };
  
  const handleExport = () => {
    // TODO: Implement export functionality
    console.log('Export clicked');
  };

  const handleAnalytics = () => {
    // TODO: Implement analytics view
    console.log('Analytics clicked');
  };
  
  // Filter projects based on search query
  const filteredProjects = projects.filter(project => 
    project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    project.owner.toLowerCase().includes(searchQuery.toLowerCase()) ||
    project.type.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }
  
  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }
  
  return (
    <Box sx={{ p: 3, backgroundColor: '#F8FAFC', minHeight: '100vh' }}>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" fontWeight={600} color="#1F2937">
          CapEx Projects Overview
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<Settings size={18} />}
            onClick={() => setShowAdminConfig(true)}
            sx={{ borderColor: '#E5E7EB', color: '#6B7280' }}
          >
            Admin Settings
          </Button>
          <Button
            variant="contained"
            startIcon={<Plus size={18} />}
            onClick={handleCreateProject}
            sx={{ 
              backgroundColor: '#DC2626',
              '&:hover': { backgroundColor: '#B91C1C' }
            }}
          >
            Add Project
          </Button>
        </Box>
      </Box>
      
      {/* Executive Banner */}
      <ExecutiveBanner projects={projects} />
      
      {/* View Controls */}
      <ViewControls
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        searchTerm={searchQuery}
        onSearchChange={setSearchQuery}
        showFinancials={showFinancials}
        onToggleFinancials={() => setShowFinancials(!showFinancials)}
        onAnalytics={handleAnalytics}
        onExport={handleExport}
      />
      
      {/* Projects Display */}
      {filteredProjects.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No projects found
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            {searchQuery ? 'Try adjusting your search criteria' : 'Click "Add Project" to create your first project'}
          </Typography>
        </Box>
      ) : viewMode === 'card' ? (
        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))',
          gap: 3 
        }}>
          {filteredProjects.map((project) => (
            <ProjectCardV3 
              key={project.id}
              project={project}
              showFinancials={showFinancials}
            />
          ))}
        </Box>
      ) : (
        <ProjectTableView 
          projects={filteredProjects}
          onProjectClick={handleProjectClick}
          showFinancials={showFinancials}
        />
      )}
      
      {/* Modals */}
      {selectedProject && (
        <ProjectModalV3
          open={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          project={selectedProject}
        />
      )}
      
      <AdminConfig
        open={showAdminConfig}
        onClose={() => setShowAdminConfig(false)}
      />
      
      {/* TODO: Add Create Project Modal */}
    </Box>
  );
};

export const KPIOverviewPage: React.FC = () => (
  <CapExErrorBoundary>
    <KPIOverviewPageContent />
  </CapExErrorBoundary>
); 