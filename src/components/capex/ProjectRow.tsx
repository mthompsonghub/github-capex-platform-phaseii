import React from 'react';
import { 
  Box, 
  Card, 
  CardContent, 
  Typography, 
  Grid,
  Chip
} from '@mui/material';
import { 
  Project,
  calculateOverallCompletionForBoth
} from './data/capexData';
import { CapExRecord } from '../../types/capex';
import { useCapExStore } from './stores/capexStore';
import toast from 'react-hot-toast';

interface ProjectRowProps {
  project: Project | CapExRecord;
  showFinancials?: boolean;
}

const getStatusColor = (status: string | undefined): string => {
  if (!status) return '#6B7280'; // Gray (default)
  
  switch (status.toLowerCase()) {
    case 'on track':
      return '#10B981'; // Green
    case 'at risk':
      return '#F59E0B'; // Yellow
    case 'impacted':
      return '#EF4444'; // Red
    default:
      return '#6B7280'; // Gray
  }
};

const ProgressBar: React.FC<{ value: number; label?: string }> = ({ value, label }) => (
  <Box sx={{ width: '100%', mb: label ? 0.5 : 0 }}>
    {label && (
      <Typography variant="body2" color="#374151" sx={{ mb: 0.5 }}>
        {label}
      </Typography>
    )}
    <Box sx={{ 
      display: 'flex', 
      alignItems: 'center',
      backgroundColor: '#F3F4F6',
      borderRadius: '10px',
      padding: '3px',
      border: '1px solid #E5E7EB'
    }}>
      <Box sx={{ 
        width: '100%',
        mr: 1,
        position: 'relative',
        height: '8px',
        borderRadius: '6px',
        overflow: 'hidden',
        backgroundColor: '#E5E7EB'
      }}>
        <Box sx={{
          position: 'absolute',
          width: `${value}%`,
          height: '100%',
          backgroundColor: '#1e40af',
          transition: 'width 0.4s ease-in-out'
        }} />
      </Box>
      <Typography variant="body2" sx={{ 
        minWidth: '45px',
        textAlign: 'right',
        color: '#1e40af',
        fontWeight: 600
      }}>
        {Math.round(value)}%
      </Typography>
    </Box>
  </Box>
);

export const ProjectRow: React.FC<ProjectRowProps> = ({ project, showFinancials = false }) => {
  // Type guard for Project
  const isProject = (p: Project | CapExRecord): p is Project => {
    return 'phases' in p;
  };

  console.log('ProjectRow received project:', project);
  if (isProject(project)) {
    console.log('Project phases:', project.phases);
    console.log('Feasibility phase:', project.phases.feasibility);
  }

  if (!isProject(project)) {
    console.error('Project missing phases:', project);
    return <div>Error: Project data incomplete</div>;
  }

  const { openProjectModal } = useCapExStore();

  const handleClick = () => {
    console.log('Opening project modal for:', project);
    try {
      openProjectModal(project);
    } catch (error) {
      console.error('Error opening project modal:', error);
      toast.error('Failed to open project details');
    }
  };

  const overallCompletion = calculateOverallCompletionForBoth(project);

  const projectName = project.projectName;
  const projectOwner = project.projectOwner;
  const projectStatus = project.projectStatus;
  const budget = project.totalBudget;
  const actual = project.totalActual;

  return (
    <Card 
      sx={{ 
        mb: 2, 
        cursor: 'pointer',
        '&:hover': {
          boxShadow: 3
        }
      }}
      onClick={handleClick}
      data-testid="project-row"
    >
      <CardContent>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <Typography variant="h6" component="div">
              {projectName}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {projectOwner}
            </Typography>
            {showFinancials && (
              <Box sx={{ mt: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Budget: ${budget?.toLocaleString() || 'N/A'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Actual: ${actual?.toLocaleString() || 'N/A'}
                </Typography>
              </Box>
            )}
          </Grid>
          <Grid item xs={12} md={4}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Overall Progress:
              </Typography>
              <Typography variant="body2">
                {overallCompletion}%
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} md={4}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Chip 
                label={projectStatus} 
                color={
                  projectStatus === 'On Track' ? 'success' :
                  projectStatus === 'At Risk' ? 'warning' :
                  'error'
                }
              />
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
}; 