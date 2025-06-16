import React from 'react';
import {
  Card,
  CardContent,
  Box,
  Typography,
  LinearProgress,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Divider,
} from '@mui/material';
import {
  MoreVert as MoreVertIcon,
  TrendingUp as TrendingUpIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  CalendarToday as CalendarIcon,
  AttachMoney as MoneyIcon,
} from '@mui/icons-material';
import { CapexProject } from '../../types/capex';
import { useCapExStore } from '../../stores/capexStore';
import { convertToProject } from './utils/projectUtils';

interface ProjectCardV2Props {
  project: CapexProject;
  showFinancials: boolean;
}

// Default values for project properties
const DEFAULT_PROJECT: CapexProject = {
  id: '',
  name: 'Unnamed Project',
  type: 'project',
  owner: 'Unknown Owner',
  status: 'On Track',
  budget: 0,
  spent: 0,
  overallCompletion: 0,
  phases: {
    feasibility: {
      name: 'Feasibility',
      weight: 15,
      completion: 0,
      subItems: {
        riskAssessment: { name: 'Risk Assessment', value: 0, isNA: false },
        projectCharter: { name: 'Project Charter', value: 0, isNA: false }
      }
    },
    planning: {
      name: 'Planning',
      weight: 35,
      completion: 0,
      subItems: {
        rfqPackage: { name: 'RFQ Package', value: 0, isNA: false },
        validationStrategy: { name: 'Validation Strategy', value: 0, isNA: false },
        financialForecast: { name: 'Financial Forecast', value: 0, isNA: false },
        vendorSolicitation: { name: 'Vendor Solicitation', value: 0, isNA: false },
        ganttChart: { name: 'Gantt Chart', value: 0, isNA: false },
        sesAssetNumberApproval: { name: 'SES Asset Number Approval', value: 0, isNA: false }
      }
    },
    execution: {
      name: 'Execution',
      weight: 45,
      completion: 0,
      subItems: {
        poSubmission: { name: 'PO Submission', value: 0, isNA: false },
        equipmentDesign: { name: 'Equipment Design', value: 0, isNA: false },
        equipmentBuild: { name: 'Equipment Build', value: 0, isNA: false },
        projectDocumentation: { name: 'Project Documentation', value: 0, isNA: false },
        demoInstall: { name: 'Demo/Install', value: 0, isNA: false },
        validation: { name: 'Validation', value: 0, isNA: false },
        equipmentTurnover: { name: 'Equipment Turnover', value: 0, isNA: false },
        goLive: { name: 'Go-Live', value: 0, isNA: false }
      }
    },
    close: {
      name: 'Close',
      weight: 5,
      completion: 0,
      subItems: {
        poClosure: { name: 'PO Closure', value: 0, isNA: false },
        projectTurnover: { name: 'Project Turnover', value: 0, isNA: false }
      }
    }
  }
};

export function ProjectCardV2({ project, showFinancials }: ProjectCardV2Props) {
  const { actions } = useCapExStore();
  const { openProjectModal } = actions;
  
  // Merge project with defaults to ensure all properties exist
  const safeProject = { ...DEFAULT_PROJECT, ...project };
  
  const handleCardClick = () => {
    openProjectModal(convertToProject(safeProject));
  };
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const getStatusColor = (status: string | undefined) => {
    const normalizedStatus = status?.toLowerCase() || 'on-track';
    switch (normalizedStatus) {
      case 'on-track': return '#10B981';
      case 'at-risk': return '#F59E0B';
      case 'impacted': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const getStatusIcon = (status: string | undefined) => {
    const normalizedStatus = status?.toLowerCase() || 'on-track';
    switch (normalizedStatus) {
      case 'on-track': return <CheckCircleIcon sx={{ fontSize: 16 }} />;
      case 'at-risk': return <WarningIcon sx={{ fontSize: 16 }} />;
      case 'impacted': return <WarningIcon sx={{ fontSize: 16 }} />;
      default: return <TrendingUpIcon sx={{ fontSize: 16 }} />;
    }
  };

  const formatCurrency = (value: number | undefined) => {
    const safeValue = value || 0;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(safeValue);
  };

  const getPhaseColor = (completion: number | undefined) => {
    const safeCompletion = completion || 0;
    if (safeCompletion >= 90) return '#10B981';
    if (safeCompletion >= 70) return '#F59E0B';
    return '#EF4444';
  };

  const formatDate = (date: Date | string | undefined) => {
    if (!date) return 'N/A';
    const dateObj = date instanceof Date ? date : new Date(date);
    return dateObj.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <Card
      onClick={handleCardClick}
      sx={{
        cursor: 'pointer',
        borderRadius: 3,
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
        border: '1px solid',
        borderColor: 'grey.200',
        borderLeftWidth: 4,
        borderLeftColor: getStatusColor(safeProject.status),
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
          borderColor: 'grey.300',
        },
      }}
    >
      <CardContent sx={{ p: 3 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box sx={{ flex: 1 }}>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 600,
                fontSize: '1.125rem',
                color: 'grey.900',
                mb: 0.5,
              }}
            >
              {safeProject.name}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="body2" color="text.secondary">
                {safeProject.owner}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                •
              </Typography>
              <Chip
                label={safeProject.type}
                size="small"
                sx={{
                  height: 20,
                  fontSize: '0.75rem',
                  backgroundColor: safeProject.type === 'project' ? 'primary.50' : 'secondary.50',
                  color: safeProject.type === 'project' ? 'primary.main' : 'secondary.main',
                  '& .MuiChip-label': { px: 1 },
                }}
              />
            </Box>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              {getStatusIcon(safeProject.status)}
              <Chip
                label={safeProject.status}
                size="small"
                sx={{
                  backgroundColor: getStatusColor(safeProject.status),
                  color: 'white',
                  fontWeight: 600,
                  fontSize: '0.75rem',
                }}
              />
            </Box>
            <IconButton
              size="small"
              onClick={handleMenuOpen}
              sx={{ ml: -0.5 }}
            >
              <MoreVertIcon fontSize="small" />
            </IconButton>
          </Box>
        </Box>

        {/* Progress Section */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
              Overall Progress
            </Typography>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                color: getStatusColor(safeProject.status),
              }}
            >
              {safeProject.overallCompletion}%
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={safeProject.overallCompletion}
            sx={{
              height: 8,
              borderRadius: 4,
              backgroundColor: 'grey.200',
              '& .MuiLinearProgress-bar': {
                backgroundColor: getStatusColor(safeProject.status),
                borderRadius: 4,
              },
            }}
          />
        </Box>

        {/* Phase Progress */}
        {safeProject.phases && Object.keys(safeProject.phases).length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500, mb: 1.5 }}>
              Phase Progress
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              {Object.entries(safeProject.phases).map(([key, phase]) => (
                <Box
                  key={key}
                  sx={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 0.5,
                  }}
                >
                  <Typography variant="caption" color="text.secondary">
                    {phase.name || key}
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={phase.completion || 0}
                    sx={{
                      height: 4,
                      borderRadius: 2,
                      backgroundColor: 'grey.200',
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: getPhaseColor(phase.completion),
                        borderRadius: 2,
                      },
                    }}
                  />
                </Box>
              ))}
            </Box>
          </Box>
        )}

        {/* Financials Section */}
        {showFinancials && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500, mb: 1.5 }}>
              Financial Overview
            </Typography>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Box sx={{ flex: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  Budget
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {formatCurrency(safeProject.budget)}
                </Typography>
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  Actual
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {formatCurrency(safeProject.spent)}
                </Typography>
              </Box>
            </Box>
          </Box>
        )}

        {/* Timeline Section */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CalendarIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
            <Typography variant="caption" color="text.secondary">
              {safeProject.timeline || 'No timeline set'}
            </Typography>
          </Box>
          {safeProject.milestones && Object.keys(safeProject.milestones).length > 0 && (
            <Typography variant="caption" color="text.secondary">
              Next: {Object.values(safeProject.milestones)[0]}
            </Typography>
          )}
        </Box>
      </CardContent>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        onClick={(e) => e.stopPropagation()}
      >
        <MenuItem onClick={handleMenuClose}>Edit Project</MenuItem>
        <MenuItem onClick={handleMenuClose}>View Details</MenuItem>
        <Divider />
        <MenuItem onClick={handleMenuClose} sx={{ color: 'error.main' }}>
          Delete Project
        </MenuItem>
      </Menu>
    </Card>
  );
}
