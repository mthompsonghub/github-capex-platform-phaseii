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
import { useCapExStore } from '../../stores/capexStore';
import toast from 'react-hot-toast';

interface ProjectRowProps {
  project: Project | CapExRecord;
  showFinancials?: boolean;
}

function isProject(p: Project | CapExRecord): p is Project {
  return 'phases' in p;
}

export default function ProjectRow({ 
  project, 
  showFinancials = false 
}: ProjectRowProps) {
  const isProj = isProject(project);
  const projectName = isProj ? project.projectName : (project as CapExRecord).project_name || 'Unnamed Project';
  const projectOwner = isProj ? project.projectOwner : (project as CapExRecord).project_owner || 'Unassigned';
  const projectStatus = isProj ? project.projectStatus : (project as CapExRecord).project_status || 'Unknown';
  const budget = isProj ? project.totalBudget : (project as CapExRecord).total_budget || 0;
  const actual = isProj ? project.totalActual : (project as CapExRecord).total_actual || 0;

  console.log('ProjectRow rendering with project:', projectName);
  
  // Safety check for project data
  if (!project) {
    console.error('ProjectRow: project is null or undefined');
    return <div>Error: No project data</div>;
  }

  // Type guard check
  if (!isProj) {
    console.error('ProjectRow: project missing phases structure:', project);
    return <div>Error: Project data incomplete</div>;
  }

  const { actions } = useCapExStore();

  const handleClick = () => {
    console.log('ProjectRow handleClick fired for project:', projectName);
    try {
      actions.openProjectModal(project);
    } catch (error) {
      console.error('Error opening project modal:', error);
      toast.error('Failed to open project details');
    }
  };

  // Safe calculation with error handling
  let overallCompletion = 0;
  try {
    overallCompletion = Math.round(calculateOverallCompletionForBoth(project));
  } catch (error) {
    console.error('Error calculating completion for project:', projectName, error);
    overallCompletion = 0;
  }

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
                  Budget: ${budget.toLocaleString()}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Actual: ${actual.toLocaleString()}
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
} 