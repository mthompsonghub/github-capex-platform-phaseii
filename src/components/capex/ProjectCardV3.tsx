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
  Person as PersonIcon,
} from '@mui/icons-material';
import { CapexProject } from '../../types/capex-unified';
import { useCapExStore } from '../../stores/capexStore';

interface ProjectCardV3Props {
  project: CapexProject;
  showFinancials: boolean;
}

export function ProjectCardV3({ project, showFinancials }: ProjectCardV3Props) {
  const { actions } = useCapExStore();
  const { openProjectModal } = actions;
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  const handleCardClick = () => {
    openProjectModal(project);
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
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
        />
      </svg>
    );
  };

  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        cursor: 'pointer',
        '&:hover': {
          boxShadow: 3,
        },
      }}
      onClick={handleCardClick}
    >
      <CardContent sx={{ flexGrow: 1, p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
              {project.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {project.type}
            </Typography>
          </Box>
          <IconButton
            size="small"
            onClick={handleMenuOpen}
            sx={{ mt: -1, mr: -1 }}
          >
            <MoreVertIcon />
          </IconButton>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Box sx={{ mr: 2 }}>
            {createDoughnutChart(project.overallCompletion)}
          </Box>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 600, color: getStatusColor(project.status) }}>
              {project.overallCompletion}%
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Overall Progress
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <PersonIcon sx={{ mr: 1, color: 'text.secondary', fontSize: 20 }} />
            <Typography variant="body2" color="text.secondary">
              {project.owner}
            </Typography>
          </Box>
          <Chip
            label={project.status}
            size="small"
            sx={{
              backgroundColor: getStatusColor(project.status) + '20',
              color: getStatusColor(project.status),
              fontWeight: 500,
            }}
          />
        </Box>

        {showFinancials && (
          <Box sx={{ mt: 2 }}>
            <Divider sx={{ my: 2 }} />
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Budget
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {formatCurrency(project.budget)}
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Spent
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {formatCurrency(project.spent)}
                </Typography>
              </Box>
            </Box>
          </Box>
        )}

        {project.upcomingMilestone && (
          <Box sx={{ mt: 2 }}>
            <Divider sx={{ my: 2 }} />
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <CalendarIcon sx={{ mr: 1, color: 'text.secondary', fontSize: 20 }} />
              <Typography variant="body2" color="text.secondary">
                Next: {project.upcomingMilestone}
              </Typography>
            </Box>
          </Box>
        )}
      </CardContent>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        onClick={(e) => e.stopPropagation()}
      >
        <MenuItem onClick={handleMenuClose}>Edit Project</MenuItem>
        <MenuItem onClick={handleMenuClose}>View Details</MenuItem>
        <MenuItem onClick={handleMenuClose}>Delete Project</MenuItem>
      </Menu>
    </Card>
  );
}
