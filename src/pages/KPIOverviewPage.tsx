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

const KPIOverviewPageContent: React.FC = () => {
  const projects = useCapExStore(state => state.projects);
  const adminSettings = useCapExStore(state => state.adminSettings);
  const modalState = useCapExStore(state => state.modalState);
  const fetchProjects = useCapExStore(state => state.actions.fetchProjects);
  const updateProject = useCapExStore(state => state.actions.updateProject);
  const updateAdminSettings = useCapExStore(state => state.actions.updateAdminSettings);
  // If you have loading/errors in your store, add selectors here
  // const loading = useCapExStore(state => state.loading);
  // const errors = useCapExStore(state => state.errors);

  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showFinancials, setShowFinancials] = useState(true);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

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

  const handleProjectUpdate = (projectId: string, updates: Partial<Project>) => {
    updateProject(projectId, updates);
  };

  const handleToggleFinancials = () => {
    setShowFinancials((prev) => !prev);
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

  // If you have loading/errors in your store, use them here
  // if (loading.projects) {
  //   return (
  //     <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
  //       <CircularProgress />
  //     </Box>
  //   );
  // }

  // if (errors.projects) {
  //   return (
  //     <Box sx={{ p: 3 }}>
  //       <Alert severity="error">{String(errors.projects)}</Alert>
  //     </Box>
  //   );
  // }

  if (projects.length === 0) {
    return (
      <Typography variant="h6" sx={{ textAlign: 'center', color: 'text.secondary', my: 4 }}>
        No projects found
      </Typography>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* If you have loading/errors, add them here */}
      {/* {loading.projects && (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
          <CircularProgress />
        </Box>
      )}
      {errors.projects && (
        <Alert severity="error" sx={{ mb: 2 }}>{String(errors.projects)}</Alert>
      )} */}
      {projects.length === 0 && (
        <Typography variant="h6" sx={{ textAlign: 'center', color: 'text.secondary', my: 4 }}>
          No projects found
        </Typography>
      )}

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
        </Box>
      </Box>

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

      {/* If you have modalState/adminConfig, update this as needed */}
      {/* <AdminConfig 
        open={modalState.adminConfig?.isOpen}
        onClose={() => {}}
        onUpdate={handleAdminConfigUpdate}
      /> */}

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