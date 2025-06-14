import React, { useEffect, useState } from 'react';
import { Box, Typography, Button, Paper, Grid, CircularProgress, Alert } from '@mui/material';
import { useCapExStore } from '../stores/capexStore';
import { ProjectEditModalV2 } from '../components/capex/ProjectModalV2';
import ProjectRow from '../components/capex/ProjectRow';
import { supabase } from '../lib/supabase';
import { User } from '@supabase/supabase-js';
import { BarChart2, Eye, EyeOff, Settings, AlertTriangle, Plus } from 'lucide-react';
import { CapExRecord, AdminSettings } from '../types/capex';
import { Project } from '../components/capex/data/capexData';
import { AdminConfig } from '../components/capex/admin/AdminConfig';
import { convertProjectToCapExRecord, convertCapExRecordToProject } from '../utils/projectUtils';
import { CapExErrorBoundary } from '../components/ErrorBoundary';
import { ExtendedThresholdSettings } from '../components/capex/admin/AdminConfig';
import { ExecutiveBanner } from '../components/capex/ExecutiveBanner';
import { ViewControls } from '../components/capex/ViewControls';
import { ProjectCard } from '../components/capex/ProjectCard';

const KPIOverviewPageContent: React.FC = () => {
  const projects = useCapExStore(state => state.projects);
  const adminSettings = useCapExStore(state => state.adminSettings);
  const modalState = useCapExStore(state => state.modalState);
  const fetchProjects = useCapExStore(state => state.actions.fetchProjects);
  const updateProject = useCapExStore(state => state.actions.updateProject);
  const updateAdminSettings = useCapExStore(state => state.actions.updateAdminSettings);
  const closeProjectModal = useCapExStore(state => state.actions.closeProjectModal);
  const fetchPhaseWeights = useCapExStore(state => state.actions.fetchPhaseWeights);
  const fetchAdminSettings = useCapExStore(state => state.actions.fetchAdminSettings);
  const fetchUserRole = useCapExStore(state => state.actions.fetchUserRole);

  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'card' | 'table'>('card');
  const [searchTerm, setSearchTerm] = useState('');
  const [showFinancials, setShowFinancials] = useState(true);

  // Handle admin modal state
  const isAdminModalOpen = modalState.isOpen && modalState.data === 'admin';
  const handleCloseAdminModal = () => {
    console.log('Closing admin modal');
    closeProjectModal();
  };

  const handleAdminConfigUpdate = async (settings: ExtendedThresholdSettings) => {
    console.log('Updating admin settings:', settings);
    await updateAdminSettings(settings);
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // Load phase weights first (needed for calculations)
        await fetchPhaseWeights();
        
        // Then load other data
        await fetchProjects();
        await fetchAdminSettings();
        await fetchUserRole();
        
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [fetchProjects, fetchAdminSettings, fetchUserRole, fetchPhaseWeights]);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      // Fetch role from user_roles table
      if (user) {
        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .single();
        if (!error && data) {
          setIsAdmin(data.role === 'admin');
        }
      }
    };
    getUser();
  }, []);

  const handleProjectUpdate = (project: Project) => {
    updateProject(project);
  };

  const handleToggleFinancials = () => {
    setShowFinancials((prev) => !prev);
  };

  const handleAnalytics = () => {
    console.log('Analytics clicked');
    // TODO: Open analytics modal
  };

  const handleExport = () => {
    console.log('Export clicked');
    // TODO: Implement export functionality
  };

  const handleTestError = () => {
    throw new Error('Test Component Error');
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (projects.length === 0) {
    return (
      <Typography variant="h6" sx={{ textAlign: 'center', color: 'text.secondary', my: 4 }}>
        No projects found
      </Typography>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 600 }}>
          CapEx Projects Overview
        </Typography>
        <Box sx={{ display: 'flex', gap: 4 }}>
          {isAdmin && (
            <Button
              variant="outlined"
              onClick={handleToggleFinancials}
              sx={{ 
                borderColor: 'gray.300',
                color: 'gray.700',
                '&:hover': { borderColor: 'gray.400' }
              }}
            >
              {showFinancials ? 'Hide Financials' : 'Show Financials'}
            </Button>
          )}
          <Button
            onClick={handleAnalytics}
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
        </Box>
      </Box>

      <ExecutiveBanner projects={projects} />

      <ViewControls
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        showFinancials={showFinancials}
        onToggleFinancials={handleToggleFinancials}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onAnalytics={handleAnalytics}
        onExport={handleExport}
      />

      {viewMode === 'card' ? (
        // Card View - Responsive Grid
        <Box sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, 1fr)', 
            lg: 'repeat(3, 1fr)',
            xl: 'repeat(auto-fit, minmax(380px, 1fr))'
          },
          gap: 3,
          mb: 3
        }}>
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              showFinancials={showFinancials}
            />
          ))}
        </Box>
      ) : (
        // Table View - Your existing layout
        <Paper sx={{ p: 2, mb: 3 }}>
          <Grid container spacing={2}>
            {projects.map((project) => (
              <Grid item xs={12} key={project.id}>
                <ProjectRow
                  project={project}
                  showFinancials={showFinancials}
                />
              </Grid>
            ))}
          </Grid>
        </Paper>
      )}

      <AdminConfig 
        open={isAdminModalOpen}
        onClose={handleCloseAdminModal}
        onUpdate={handleAdminConfigUpdate}
      />

      <ProjectEditModalV2 />
    </Box>
  );
};

export const KPIOverviewPage: React.FC = () => {
  return (
    <CapExErrorBoundary>
      <KPIOverviewPageContent />
    </CapExErrorBoundary>
  );
}; 