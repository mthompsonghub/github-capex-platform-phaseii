import React from 'react';
import {
  Card,
  CardContent,
  Box,
  Typography,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Divider,
} from '@mui/material';
import {
  MoreVert as MoreVertIcon,
  CalendarToday as CalendarIcon,
  AttachMoney as MoneyIcon,
} from '@mui/icons-material';
import { CapexProject } from '../../types/capex';
import { useCapExStore } from '../../stores/capexStore';
import { Project } from './data/capexData';

interface ProjectCardV3Props {
  project: CapexProject;
  showFinancials: boolean;
}

export function ProjectCardV3({ project, showFinancials }: ProjectCardV3Props) {
  const { actions } = useCapExStore();
  const { openProjectModal } = actions;
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  const handleCardClick = () => {
    // Convert CapexProject to Project
    const projectData: Project = {
      id: project.id,
      projectName: project.name,
      projectOwner: project.owner,
      projectType: {
        id: project.type === 'project' ? 'projects' : 'asset_purchases',
        name: project.type === 'project' ? 'Complex Project' : 'Asset Purchase',
        phaseWeights: {
          feasibility: project.type === 'project' ? 15 : 0,
          planning: project.type === 'project' ? 35 : 45,
          execution: project.type === 'project' ? 45 : 50,
          close: 5
        }
      },
      startDate: new Date(),
      endDate: new Date(),
      lastUpdated: new Date(),
      totalBudget: project.budget || 0,
      totalActual: project.spent || 0,
      projectStatus: (project.status || 'on-track').replace('-', ' ').split(' ').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' ') as 'On Track' | 'At Risk' | 'Impacted',
      phases: {
        feasibility: {
          id: 'feasibility',
          name: 'Feasibility',
          weight: project.type === 'project' ? 15 : 0,
          completion: project.phases?.feasibility?.completion || 0,
          subItems: {
            riskAssessment: {
              name: 'Risk Assessment',
              value: project.phases?.feasibility?.subItems?.riskAssessment?.value || 0,
              isNA: project.phases?.feasibility?.subItems?.riskAssessment?.isNA || false
            },
            projectCharter: {
              name: 'Project Charter',
              value: project.phases?.feasibility?.subItems?.projectCharter?.value || 0,
              isNA: project.phases?.feasibility?.subItems?.projectCharter?.isNA || false
            }
          }
        },
        planning: {
          id: 'planning',
          name: 'Planning',
          weight: project.type === 'project' ? 35 : 45,
          completion: project.phases?.planning?.completion || 0,
          subItems: {
            rfqPackage: {
              name: 'RFQ Package',
              value: project.phases?.planning?.subItems?.rfqPackage?.value || 0,
              isNA: project.phases?.planning?.subItems?.rfqPackage?.isNA || false
            },
            validationStrategy: {
              name: 'Validation Strategy',
              value: project.phases?.planning?.subItems?.validationStrategy?.value || 0,
              isNA: project.phases?.planning?.subItems?.validationStrategy?.isNA || false
            },
            financialForecast: {
              name: 'Financial Forecast',
              value: project.phases?.planning?.subItems?.financialForecast?.value || 0,
              isNA: project.phases?.planning?.subItems?.financialForecast?.isNA || false
            },
            vendorSolicitation: {
              name: 'Vendor Solicitation',
              value: project.phases?.planning?.subItems?.vendorSolicitation?.value || 0,
              isNA: project.phases?.planning?.subItems?.vendorSolicitation?.isNA || false
            },
            ganttChart: {
              name: 'Gantt Chart',
              value: project.phases?.planning?.subItems?.ganttChart?.value || 0,
              isNA: project.phases?.planning?.subItems?.ganttChart?.isNA || false
            },
            sesAssetNumberApproval: {
              name: 'SES Asset Number Approval',
              value: project.phases?.planning?.subItems?.sesAssetNumberApproval?.value || 0,
              isNA: project.phases?.planning?.subItems?.sesAssetNumberApproval?.isNA || false
            }
          }
        },
        execution: {
          id: 'execution',
          name: 'Execution',
          weight: project.type === 'project' ? 45 : 50,
          completion: project.phases?.execution?.completion || 0,
          subItems: {
            poSubmission: {
              name: 'PO Submission',
              value: project.phases?.execution?.subItems?.poSubmission?.value || 0,
              isNA: project.phases?.execution?.subItems?.poSubmission?.isNA || false
            },
            equipmentDesign: {
              name: 'Equipment Design',
              value: project.phases?.execution?.subItems?.equipmentDesign?.value || 0,
              isNA: project.phases?.execution?.subItems?.equipmentDesign?.isNA || false
            },
            equipmentBuild: {
              name: 'Equipment Build',
              value: project.phases?.execution?.subItems?.equipmentBuild?.value || 0,
              isNA: project.phases?.execution?.subItems?.equipmentBuild?.isNA || false
            },
            projectDocumentation: {
              name: 'Project Documentation',
              value: project.phases?.execution?.subItems?.projectDocumentation?.value || 0,
              isNA: project.phases?.execution?.subItems?.projectDocumentation?.isNA || false
            },
            demoInstall: {
              name: 'Demo Install',
              value: project.phases?.execution?.subItems?.demoInstall?.value || 0,
              isNA: project.phases?.execution?.subItems?.demoInstall?.isNA || false
            },
            validation: {
              name: 'Validation',
              value: project.phases?.execution?.subItems?.validation?.value || 0,
              isNA: project.phases?.execution?.subItems?.validation?.isNA || false
            },
            equipmentTurnover: {
              name: 'Equipment Turnover',
              value: project.phases?.execution?.subItems?.equipmentTurnover?.value || 0,
              isNA: project.phases?.execution?.subItems?.equipmentTurnover?.isNA || false
            },
            goLive: {
              name: 'Go Live',
              value: project.phases?.execution?.subItems?.goLive?.value || 0,
              isNA: project.phases?.execution?.subItems?.goLive?.isNA || false
            }
          }
        },
        close: {
          id: 'close',
          name: 'Close',
          weight: 5,
          completion: project.phases?.close?.completion || 0,
          subItems: {
            poClosure: {
              name: 'PO Closure',
              value: project.phases?.close?.subItems?.poClosure?.value || 0,
              isNA: project.phases?.close?.subItems?.poClosure?.isNA || false
            },
            projectTurnover: {
              name: 'Project Turnover',
              value: project.phases?.close?.subItems?.projectTurnover?.value || 0,
              isNA: project.phases?.close?.subItems?.projectTurnover?.isNA || false
            }
          }
        }
      },
      
      // Additional fields that might exist
      name: project.name,
      owner: project.owner,
      type: project.type,
      status: project.status || 'on-track',
      budget: project.budget || 0,
      spent: project.spent || 0,
      overallCompletion: project.overallCompletion || 0,
      timeline: project.timeline,
      sesNumber: project.sesNumber,
      financialNotes: project.financialNotes,
      milestones: {
        feasibility: project.milestones?.feasibility || '',
        planning: project.milestones?.planning || '',
        execution: project.milestones?.execution || '',
        close: project.milestones?.close || ''
      }
    };
    
    openProjectModal(projectData);
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'on-track':
      case 'on track':
        return '#10B981';
      case 'at-risk':
      case 'at risk':
        return '#F59E0B';
      case 'impacted':
        return '#EF4444';
      default:
        return '#6B7280';
    }
  };

  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    }
    return `$${(value / 1000).toFixed(0)}K`;
  };

  // Create SVG doughnut chart
  const createDoughnutChart = (percentage: number) => {
    const size = 120;
    const strokeWidth = 12;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;
    const color = getStatusColor(project.status);

    return (
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#E5E7EB"
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          style={{ transition: 'stroke-dashoffset 0.5s ease' }}
        />
      </svg>
    );
  };

  return (
    <Card
      onClick={handleCardClick}
      sx={{
        cursor: 'pointer',
        borderRadius: 3,
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
        border: '1px solid',
        borderColor: 'grey.200',
        borderLeftWidth: 4,
        borderLeftColor: getStatusColor(project.status),
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 12px 24px rgba(0, 0, 0, 0.1)',
        },
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <CardContent sx={{ p: 3, flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
          <Box sx={{ flex: 1, pr: 2 }}>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 600,
                fontSize: '1.125rem',
                color: 'grey.900',
                mb: 0.5,
                lineHeight: 1.3,
              }}
            >
              {project.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {project.owner}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1 }}>
            <Chip
              label={project.type === 'project' ? 'Project' : 'Asset'}
              size="small"
              sx={{
                height: 22,
                fontSize: '0.7rem',
                backgroundColor: project.type === 'project' ? 'primary.100' : 'secondary.100',
                color: project.type === 'project' ? 'primary.main' : 'secondary.main',
                fontWeight: 600,
              }}
            />
            <IconButton
              size="small"
              onClick={handleMenuOpen}
              sx={{ ml: -0.5 }}
            >
              <MoreVertIcon fontSize="small" />
            </IconButton>
          </Box>
        </Box>

        {/* Progress Section with Doughnut */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 3, flex: 1 }}>
          {/* Doughnut Chart */}
          <Box sx={{ position: 'relative' }}>
            {createDoughnutChart(project.overallCompletion || 0)}
            <Box
              sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                textAlign: 'center',
              }}
            >
              <Typography variant="h5" sx={{ fontWeight: 700, color: getStatusColor(project.status) }}>
                {project.overallCompletion || 0}%
              </Typography>
            </Box>
          </Box>

          {/* Phase Progress Bars */}
          <Box sx={{ flex: 1 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, fontWeight: 500 }}>
              Phase Progress
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {project.phases && Object.entries(project.phases).map(([key, phase]) => {
                const phaseColor = phase.completion >= 90 ? '#10B981' : 
                                 phase.completion >= 70 ? '#F59E0B' : '#EF4444';
                return (
                  <Box key={key}>
                    <Box
                      sx={{
                        height: 6,
                        backgroundColor: 'grey.200',
                        borderRadius: 3,
                        overflow: 'hidden',
                        position: 'relative',
                      }}
                    >
                      <Box
                        sx={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          height: '100%',
                          width: `${phase.completion || 0}%`,
                          backgroundColor: phaseColor,
                          transition: 'width 0.3s ease',
                        }}
                      />
                    </Box>
                  </Box>
                );
              })}
            </Box>
          </Box>
        </Box>

        <Divider sx={{ mb: 2 }} />

        {/* Metrics */}
        <Box sx={{ display: 'grid', gridTemplateColumns: showFinancials ? '1fr 1fr' : '1fr', gap: 2 }}>
          {showFinancials && (
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                <MoneyIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                <Typography variant="caption" color="text.secondary">
                  Budget
                </Typography>
              </Box>
              <Typography variant="body2" fontWeight={600}>
                {formatCurrency(project.budget || 0)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Spent: {formatCurrency(project.spent || 0)} ({Math.round((project.spent / project.budget) * 100)}%)
              </Typography>
            </Box>
          )}
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
              <CalendarIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
              <Typography variant="caption" color="text.secondary">
                Timeline
              </Typography>
            </Box>
            <Typography variant="body2" fontWeight={600}>
              {project.timeline || 'TBD'}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Milestone: {project.milestones?.execution || project.milestones?.planning || 'Not set'}
            </Typography>
          </Box>
        </Box>

        {/* Status Badge */}
        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
          <Chip
            label={project.status?.replace('-', ' ').toUpperCase() || 'UNKNOWN'}
            size="small"
            sx={{
              backgroundColor: getStatusColor(project.status),
              color: 'white',
              fontWeight: 700,
              fontSize: '0.75rem',
              px: 2,
            }}
          />
        </Box>

        {/* Action Menu */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
          onClick={(e) => e.stopPropagation()}
        >
          <MenuItem onClick={() => { handleMenuClose(); handleCardClick(); }}>
            View Details
          </MenuItem>
          <MenuItem onClick={handleMenuClose}>Export Data</MenuItem>
          <Divider />
          <MenuItem onClick={handleMenuClose} sx={{ color: 'error.main' }}>
            Archive Project
          </MenuItem>
        </Menu>
      </CardContent>
    </Card>
  );
}
