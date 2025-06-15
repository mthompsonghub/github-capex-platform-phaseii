import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  LinearProgress,
  Divider,
  Button
} from '@mui/material';
import { 
  Calendar,
  DollarSign,
  User,
  TrendingUp,
  Clock,
  ArrowRight,
  AlertTriangle
} from 'lucide-react';
import { useCapExStore } from '../../stores/capexStore';
import { Project, calculatePhaseCompletion } from './data/capexData';

interface DetailedSubItem {
  value: string;
  notes?: string;
}

interface Phase {
  subItems: DetailedSubItem[];
}

interface ProjectCardProps {
  project: Project;
  showFinancials: boolean;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({ 
  project, 
  showFinancials 
}) => {
  const openProjectModal = useCapExStore(state => state.actions.openProjectModal);

  const handleCardClick = () => {
    openProjectModal(project);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'On Track':
        return '#10B981';
      case 'At Risk':
        return '#F59E0B';
      case 'Impacted':
        return '#EF4444';
      default:
        return '#6B7280';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <Card 
      sx={{ 
        width: '100%',
        maxWidth: '380px',
        height: 'auto',
        cursor: 'pointer',
        border: '1px solid #E5E7EB',
        borderRadius: '12px',
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
          borderColor: '#DC2626'
        }
      }}
      onClick={handleCardClick}
    >
      <CardContent sx={{ p: 3 }}>
        {/* Header */}
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
            <Typography 
              variant="h6" 
              component="h3"
              sx={{ 
                fontWeight: 600, 
                color: '#1F2937',
                fontSize: '1.1rem',
                lineHeight: 1.3,
                maxWidth: '70%'
              }}
            >
              {project.projectName}
            </Typography>
            <Chip
              label={project.projectStatus}
              size="small"
              sx={{
                backgroundColor: `${getStatusColor(project.projectStatus)}15`,
                color: getStatusColor(project.projectStatus),
                fontWeight: 500,
                '& .MuiChip-label': { px: 1 }
              }}
            />
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', color: '#6B7280', mb: 2 }}>
            <User className="w-4 h-4 mr-1" />
            <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
              {project.projectOwner}
            </Typography>
          </Box>
        </Box>

        {/* Progress Section */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="body2" sx={{ color: '#6B7280', fontWeight: 500 }}>
              Overall Progress
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 600, color: '#1F2937' }}>
              {Math.round(calculatePhaseCompletion(project.phases.execution))}%
            </Typography>
          </Box>
          
          <LinearProgress
            variant="determinate"
            value={calculatePhaseCompletion(project.phases.execution)}
            sx={{
              height: 8,
              borderRadius: 4,
              backgroundColor: '#E5E7EB',
              '& .MuiLinearProgress-bar': {
                backgroundColor: '#3B82F6'
              },
            }}
          />
        </Box>

        {/* Phase Indicators */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="body2" sx={{ color: '#6B7280', fontWeight: 500, mb: 1 }}>
            Phase Progress
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            {Object.entries(project.phases).map(([phaseName, phase]) => {
              const phaseCompletion = calculatePhaseCompletion(phase);
              
              return (
                <Box 
                  key={phaseName}
                  sx={{ 
                    flex: 1, 
                    textAlign: 'center',
                    p: 1,
                    backgroundColor: '#F9FAFB',
                    borderRadius: '6px',
                    border: '1px solid #E5E7EB'
                  }}
                >
                  <Typography variant="caption" sx={{ color: '#6B7280', display: 'block', fontWeight: 500 }}>
                    {phaseName.charAt(0).toUpperCase() + phaseName.slice(1)}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#1F2937', fontWeight: 600 }}>
                    {phaseCompletion}%
                  </Typography>
                </Box>
              );
            })}
          </Box>
        </Box>

        {/* Financial Section */}
        {showFinancials && (
          <>
            <Divider sx={{ my: 2 }} />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Box sx={{ textAlign: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 0.5 }}>
                  <DollarSign className="w-4 h-4 mr-1" style={{ color: '#6B7280' }} />
                  <Typography variant="caption" sx={{ color: '#6B7280', fontWeight: 500 }}>
                    Budget
                  </Typography>
                </Box>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#1F2937' }}>
                  {formatCurrency(project.totalBudget)}
                </Typography>
              </Box>
              
              <Box sx={{ textAlign: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 0.5 }}>
                  <DollarSign className="w-4 h-4 mr-1" style={{ color: '#6B7280' }} />
                  <Typography variant="caption" sx={{ color: '#6B7280', fontWeight: 500 }}>
                    Spent
                  </Typography>
                </Box>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#1F2937' }}>
                  {formatCurrency(project.totalActual)}
                </Typography>
              </Box>
            </Box>
          </>
        )}

        {/* Timeline/Milestone */}
        <Box sx={{ display: 'flex', alignItems: 'center', color: '#6B7280' }}>
          <Clock className="w-4 h-4 mr-1" />
          <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
            {project.upcomingMilestone || 'No upcoming milestone'}
          </Typography>
        </Box>

        {/* Footer */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          mt: 'auto',
          pt: 2
        }}>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Calendar size={16} color="#6B7280" />
              <Typography variant="caption" sx={{ color: '#6B7280' }}>
                {new Date(project.endDate).toLocaleDateString()}
              </Typography>
            </Box>
            {project.projectStatus !== 'On Track' && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <AlertTriangle size={16} color={getStatusColor(project.projectStatus)} />
                <Typography variant="caption" sx={{ color: getStatusColor(project.projectStatus) }}>
                  {project.projectStatus}
                </Typography>
              </Box>
            )}
          </Box>
          <Button
            endIcon={<ArrowRight size={16} />}
            size="small"
            sx={{ 
              color: '#3B82F6',
              '&:hover': {
                backgroundColor: '#EBF5FF'
              }
            }}
          >
            View Details
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
}; 