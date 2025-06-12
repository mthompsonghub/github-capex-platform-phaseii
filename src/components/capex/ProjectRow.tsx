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
  calculateOverallCompletion
} from '../capex/data/capexData';
import { CapExRecord } from '../../types/capex';

interface ProjectRowProps {
  project: Project | CapExRecord;
  onEdit: (project: Project | CapExRecord) => void;
  showFinancials: boolean;
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

export const ProjectRow: React.FC<ProjectRowProps> = ({ project, onEdit, showFinancials }) => {
  // Calculate completion based on project type
  const completion = 'actual_project_completion' in project 
    ? project.actual_project_completion 
    : calculateOverallCompletion(project as Project);

  // Ensure completion is a valid number
  const displayCompletion = isNaN(completion) ? 0 : Math.round(completion);

  const projectName = 'projectName' in project ? project.projectName : project.project_name;
  const projectOwner = 'projectOwner' in project ? project.projectOwner : project.project_owner;
  const startDate = 'startDate' in project ? project.startDate : new Date(project.start_date);
  const endDate = 'endDate' in project ? project.endDate : new Date(project.end_date);
  const totalBudget = 'totalBudget' in project ? project.totalBudget : project.total_budget;
  const totalActual = 'totalActual' in project ? project.totalActual : project.total_actual;
  const projectStatus = 'projectStatus' in project ? project.projectStatus : project.project_status;

  return (
    <Card 
      elevation={0}
      sx={{ 
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: '8px',
        '&:hover': {
          borderColor: 'primary.main',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
        }
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={showFinancials ? 6 : 8}>
            <Box>
              <Typography variant="h6" sx={{ color: '#111827', mb: 0.5 }}>
                {projectName}
              </Typography>
              <Typography variant="body2" sx={{ color: '#6B7280' }}>
                {projectOwner}
              </Typography>
              <Typography variant="caption" sx={{ color: '#6B7280', display: 'block', mt: 1 }}>
                {new Date(startDate).toLocaleDateString()} - {new Date(endDate).toLocaleDateString()}
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={showFinancials ? 3 : 4}>
            <Box>
              <Typography variant="body2" sx={{ color: '#374151', mb: 1 }}>
                Target Progress
              </Typography>
              <Box sx={{ mb: 1 }}>
                <ProgressBar 
                  value={displayCompletion} 
                  label={`${displayCompletion}%`}
                />
              </Box>
              <Box sx={{ mt: 1 }}>
                <Chip
                  label={projectStatus}
                  size="small"
                  sx={{
                    height: '24px',
                    backgroundColor: `${getStatusColor(projectStatus)}15`,
                    color: getStatusColor(projectStatus),
                    fontWeight: 500,
                    fontSize: '0.75rem',
                    borderRadius: '12px'
                  }}
                />
              </Box>
            </Box>
          </Grid>

          {showFinancials && (
            <Grid item xs={3}>
              <Typography variant="body2" sx={{ 
                color: '#374151',
                mb: 0.5,
                display: 'flex',
                justifyContent: 'space-between'
              }}>
                <span>Budget:</span>
                <span style={{ fontWeight: 500 }}>${(totalBudget / 1000).toLocaleString()}K</span>
              </Typography>
              <Typography variant="body2" sx={{ 
                color: '#374151',
                display: 'flex',
                justifyContent: 'space-between'
              }}>
                <span>Actual:</span>
                <span style={{ fontWeight: 500 }}>${(totalActual / 1000).toLocaleString()}K</span>
              </Typography>
            </Grid>
          )}
        </Grid>
      </CardContent>
    </Card>
  );
}; 