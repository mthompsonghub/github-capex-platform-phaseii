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
        id: project.type === 'Complex Project' ? 'projects' : 'asset_purchases',
        name: project.type,
        phaseWeights: {
          feasibility: project.type === 'Complex Project' ? 15 : 0,
          planning: project.type === 'Complex Project' ? 35 : 45,
          execution: project.type === 'Complex Project' ? 45 : 50,
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
          weight: project.type === 'Complex Project' ? 15 : 0,
          completion: project.phases?.feasibility?.completion || 0,
          subItems: {
            riskAssessment: {
              name: 'Risk Assessment',
              value: Number(project.phases?.feasibility?.items?.find(item => item.name === 'Risk Assessment')?.value || 0),
              isNA: project.phases?.feasibility?.items?.find(item => item.name === 'Risk Assessment')?.isNA || false
            },
            projectCharter: {
              name: 'Project Charter',
              value: Number(project.phases?.feasibility?.items?.find(item => item.name === 'Project Charter')?.value || 0),
              isNA: project.phases?.feasibility?.items?.find(item => item.name === 'Project Charter')?.isNA || false
            }
          }
        },
        planning: {
          id: 'planning',
          name: 'Planning',
          weight: project.type === 'Complex Project' ? 35 : 45,
          completion: project.phases?.planning?.completion || 0,
          subItems: {
            rfqPackage: {
              name: 'RFQ Package',
              value: Number(project.phases?.planning?.items?.find(item => item.name === 'RFQ Package')?.value || 0),
              isNA: project.phases?.planning?.items?.find(item => item.name === 'RFQ Package')?.isNA || false
            },
            validationStrategy: {
              name: 'Validation Strategy',
              value: Number(project.phases?.planning?.items?.find(item => item.name === 'Validation Strategy')?.value || 0),
              isNA: project.phases?.planning?.items?.find(item => item.name === 'Validation Strategy')?.isNA || false
            },
            financialForecast: {
              name: 'Financial Forecast',
              value: Number(project.phases?.planning?.items?.find(item => item.name === 'Financial Forecast')?.value || 0),
              isNA: project.phases?.planning?.items?.find(item => item.name === 'Financial Forecast')?.isNA || false
            },
            vendorSolicitation: {
              name: 'Vendor Solicitation',
              value: Number(project.phases?.planning?.items?.find(item => item.name === 'Vendor Solicitation')?.value || 0),
              isNA: project.phases?.planning?.items?.find(item => item.name === 'Vendor Solicitation')?.isNA || false
            },
            ganttChart: {
              name: 'Gantt Chart',
              value: Number(project.phases?.planning?.items?.find(item => item.name === 'Gantt Chart')?.value || 0),
              isNA: project.phases?.planning?.items?.find(item => item.name === 'Gantt Chart')?.isNA || false
            },
            sesAssetNumberApproval: {
              name: 'SES Asset Number Approval',
              value: Number(project.phases?.planning?.items?.find(item => item.name === 'SES Asset Number Approval')?.value || 0),
              isNA: project.phases?.planning?.items?.find(item => item.name === 'SES Asset Number Approval')?.isNA || false
            }
          }
        },
        execution: {
          id: 'execution',
          name: 'Execution',
          weight: project.type === 'Complex Project' ? 45 : 50,
          completion: project.phases?.execution?.completion || 0,
          subItems: {
            poSubmission: {
              name: 'PO Submission',
              value: Number(project.phases?.execution?.items?.find(item => item.name === 'PO Submission')?.value || 0),
              isNA: project.phases?.execution?.items?.find(item => item.name === 'PO Submission')?.isNA || false
            },
            equipmentDesign: {
              name: 'Equipment Design',
              value: Number(project.phases?.execution?.items?.find(item => item.name === 'Equipment Design')?.value || 0),
              isNA: project.phases?.execution?.items?.find(item => item.name === 'Equipment Design')?.isNA || false
            },
            equipmentBuild: {
              name: 'Equipment Build',
              value: Number(project.phases?.execution?.items?.find(item => item.name === 'Equipment Build')?.value || 0),
              isNA: project.phases?.execution?.items?.find(item => item.name === 'Equipment Build')?.isNA || false
            },
            projectDocumentation: {
              name: 'Project Documentation',
              value: Number(project.phases?.execution?.items?.find(item => item.name === 'Project Documentation')?.value || 0),
              isNA: project.phases?.execution?.items?.find(item => item.name === 'Project Documentation')?.isNA || false
            },
            demoInstall: {
              name: 'Demo Install',
              value: Number(project.phases?.execution?.items?.find(item => item.name === 'Demo Install')?.value || 0),
              isNA: project.phases?.execution?.items?.find(item => item.name === 'Demo Install')?.isNA || false
            },
            validation: {
              name: 'Validation',
              value: Number(project.phases?.execution?.items?.find(item => item.name === 'Validation')?.value || 0),
              isNA: project.phases?.execution?.items?.find(item => item.name === 'Validation')?.isNA || false
            },
            equipmentTurnover: {
              name: 'Equipment Turnover',
              value: Number(project.phases?.execution?.items?.find(item => item.name === 'Equipment Turnover')?.value || 0),
              isNA: project.phases?.execution?.items?.find(item => item.name === 'Equipment Turnover')?.isNA || false
            },
            goLive: {
              name: 'Go Live',
              value: Number(project.phases?.execution?.items?.find(item => item.name === 'Go Live')?.value || 0),
              isNA: project.phases?.execution?.items?.find(item => item.name === 'Go Live')?.isNA || false
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
              value: Number(project.phases?.close?.items?.find(item => item.name === 'PO Closure')?.value || 0),
              isNA: project.phases?.close?.items?.find(item => item.name === 'PO Closure')?.isNA || false
            },
            projectTurnover: {
              name: 'Project Turnover',
              value: Number(project.phases?.close?.items?.find(item => item.name === 'Project Turnover')?.value || 0),
              isNA: project.phases?.close?.items?.find(item => item.name === 'Project Turnover')?.isNA || false
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
      upcomingMilestone: project.upcomingMilestone
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
              label={project.type === 'Complex Project' ? 'Project' : 'Asset'}
              color={project.type === 'Complex Project' ? 'primary' : 'secondary'}
              size="small"
              sx={{ mr: 1 }}
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
              Milestone: {project.upcomingMilestone || 'Not set'}
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
