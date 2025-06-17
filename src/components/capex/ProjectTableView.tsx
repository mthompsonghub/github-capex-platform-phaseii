import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Box,
  Chip,
  LinearProgress,
  IconButton,
  Collapse,
  Button,
} from '@mui/material';
import {
  KeyboardArrowDown as ExpandIcon,
  KeyboardArrowUp as CollapseIcon,
  MoreVert as MoreIcon,
} from '@mui/icons-material';
import { CapexProject } from '../../types/capex';

interface ProjectTableViewProps {
  projects: CapexProject[];
  showFinancials: boolean;
  onProjectClick: (project: CapexProject) => void;
}

interface GroupedProjects {
  complexProjects: CapexProject[];
  assetPurchases: CapexProject[];
}

export function ProjectTableView({ projects, showFinancials, onProjectClick }: ProjectTableViewProps) {
  const [expandedGroups, setExpandedGroups] = React.useState<{ [key: string]: boolean }>({
    complexProjects: true,
    assetPurchases: true,
  });

  // Group projects by type
  const groupedProjects: GroupedProjects = projects.reduce(
    (acc, project) => {
      if (project.type === 'project' || project.type === 'Complex Project') {
        acc.complexProjects.push(project);
      } else {
        acc.assetPurchases.push(project);
      }
      return acc;
    },
    { complexProjects: [], assetPurchases: [] } as GroupedProjects
  );

  const toggleGroup = (group: string) => {
    setExpandedGroups((prev) => ({ ...prev, [group]: !prev[group] }));
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
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (date: string | Date | undefined) => {
    if (!date) return 'TBD';
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  const renderProjectGroup = (title: string, projects: CapexProject[], groupKey: string) => {
    const isExpanded = expandedGroups[groupKey];

    return (
      <Box key={groupKey} sx={{ mb: 4 }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            mb: 2,
            cursor: 'pointer',
          }}
          onClick={() => toggleGroup(groupKey)}
        >
          <IconButton size="small">
            {isExpanded ? <CollapseIcon /> : <ExpandIcon />}
          </IconButton>
          <Typography variant="h6" sx={{ fontWeight: 600, ml: 1 }}>
            {title}
          </Typography>
          <Chip
            label={projects.length}
            size="small"
            sx={{ ml: 2, backgroundColor: 'primary.100', color: 'primary.main' }}
          />
        </Box>

        <Collapse in={isExpanded}>
          <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ backgroundColor: 'grey.50' }}>
                  <TableCell sx={{ fontWeight: 600, width: '25%' }}>Project Name</TableCell>
                  <TableCell sx={{ fontWeight: 600, width: '15%' }}>Owner</TableCell>
                  <TableCell sx={{ fontWeight: 600, width: '10%' }} align="center">Status</TableCell>
                  <TableCell sx={{ fontWeight: 600, width: '10%' }} align="center">Overall %</TableCell>
                  <TableCell sx={{ fontWeight: 600, width: '20%' }}>Phase Progress</TableCell>
                  {showFinancials && (
                    <>
                      <TableCell sx={{ fontWeight: 600, width: '10%' }} align="right">Budget</TableCell>
                      <TableCell sx={{ fontWeight: 600, width: '10%' }} align="right">Spent</TableCell>
                    </>
                  )}
                  <TableCell sx={{ fontWeight: 600, width: '10%' }}>Timeline</TableCell>
                  <TableCell sx={{ fontWeight: 600, width: '5%' }} align="center"></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {projects.map((project) => (
                  <TableRow
                    key={project.id}
                    hover
                    onClick={() => onProjectClick(project)}
                    sx={{
                      cursor: 'pointer',
                      '&:hover': {
                        backgroundColor: 'grey.50',
                      },
                    }}
                  >
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {project.name}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {project.owner}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={project.status?.replace('-', ' ') || 'Unknown'}
                        size="small"
                        sx={{
                          backgroundColor: getStatusColor(project.status),
                          color: 'white',
                          fontWeight: 600,
                          fontSize: '0.7rem',
                        }}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <LinearProgress
                          variant="determinate"
                          value={project.overallCompletion || 0}
                          sx={{
                            width: '60px',
                            height: 6,
                            borderRadius: 3,
                            backgroundColor: 'grey.200',
                            '& .MuiLinearProgress-bar': {
                              backgroundColor: getStatusColor(project.status),
                            },
                          }}
                        />
                        <Typography variant="body2" sx={{ fontWeight: 600, minWidth: '35px' }}>
                          {project.overallCompletion || 0}%
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        {project.phases && Object.entries(project.phases).map(([key, phase]) => (
                          <Box
                            key={key}
                            sx={{
                              flex: 1,
                              height: 4,
                              backgroundColor: 'grey.200',
                              borderRadius: 2,
                              overflow: 'hidden',
                              position: 'relative',
                            }}
                            title={`${phase.name}: ${phase.completion || 0}%`}
                          >
                            <Box
                              sx={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                height: '100%',
                                width: `${phase.completion || 0}%`,
                                backgroundColor: phase.completion >= 90 ? '#10B981' : 
                                               phase.completion >= 70 ? '#F59E0B' : '#EF4444',
                              }}
                            />
                          </Box>
                        ))}
                      </Box>
                    </TableCell>
                    {showFinancials && (
                      <>
                        <TableCell align="right">
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {formatCurrency(project.budget || 0)}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" color="text.secondary">
                            {formatCurrency(project.spent || 0)}
                          </Typography>
                        </TableCell>
                      </>
                    )}
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {project.timeline || formatDate(project.endDate)}
                      </Typography>
                    </TableCell>
                    <TableCell align="center" onClick={(e) => e.stopPropagation()}>
                      <IconButton size="small">
                        <MoreIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Collapse>
      </Box>
    );
  };

  return (
    <Box>
      {renderProjectGroup('Complex Projects', groupedProjects.complexProjects, 'complexProjects')}
      {renderProjectGroup('Asset Purchases', groupedProjects.assetPurchases, 'assetPurchases')}
      
      {/* Summary Row */}
      <Box sx={{ mt: 3, p: 2, backgroundColor: 'grey.50', borderRadius: 1 }}>
        <Typography variant="body2" color="text.secondary">
          Total Projects: {projects.length} | 
          Complex Projects: {groupedProjects.complexProjects.length} | 
          Asset Purchases: {groupedProjects.assetPurchases.length}
        </Typography>
      </Box>
    </Box>
  );
}
