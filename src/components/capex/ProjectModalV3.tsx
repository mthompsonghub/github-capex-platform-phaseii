import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  TextField,
  Button,
  Tabs,
  Tab,
  Slider,
  Switch,
  FormControlLabel,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Paper,
  IconButton,
  Chip,
  LinearProgress,
  Divider,
  Grid,
  InputAdornment,
} from '@mui/material';
import {
  Close as CloseIcon,
  TrendingUp as TrendingUpIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  AttachMoney as MoneyIcon,
  CalendarToday as CalendarIcon,
  Person as PersonIcon,
  Category as CategoryIcon,
} from '@mui/icons-material';
import { CapexProject, ProjectStatus } from '../../types/capex-unified';
import { useCapExStore } from '../../stores/capexStore';

interface ProjectModalV3Props {
  open: boolean;
  onClose: () => void;
  project: CapexProject | null;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`project-tabpanel-${index}`}
      aria-labelledby={`project-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

// Custom styled components for professional look
const SectionCard = ({ title, children, icon }: { title: string; children: React.ReactNode; icon?: React.ReactNode }) => (
  <Paper
    elevation={0}
    sx={{
      p: 3,
      mb: 3,
      border: '1px solid',
      borderColor: 'divider',
      borderRadius: 2,
      backgroundColor: 'grey.50',
    }}
  >
    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
      {icon && <Box sx={{ mr: 1, color: 'primary.main' }}>{icon}</Box>}
      <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.1rem' }}>
        {title}
      </Typography>
    </Box>
    {children}
  </Paper>
);

const MetricBox = ({ label, value, color = 'text.primary' }: { label: string; value: string | number; color?: string }) => (
  <Box>
    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
      {label}
    </Typography>
    <Typography variant="h6" sx={{ color, fontWeight: 600, fontSize: '1.25rem' }}>
      {value}
    </Typography>
  </Box>
);

export function ProjectModalV3({ open, onClose, project }: ProjectModalV3Props) {
  const [tabValue, setTabValue] = useState(0);
  const [editedProject, setEditedProject] = useState<CapexProject | null>(null);
  const { actions } = useCapExStore();
  const { updateProject } = actions;

  useEffect(() => {
    if (project) {
      setEditedProject({ 
        ...project,
        // Ensure status has a default value
        status: project.status || 'On Track'
      });
    }
  }, [project]);

  if (!project || !editedProject) return null;

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleSave = async () => {
    if (editedProject) {
      await updateProject(editedProject);
      onClose();
    }
  };

  const updateField = (field: keyof CapexProject, value: any) => {
    setEditedProject(prev => {
      if (!prev) return null;
      return { ...prev, [field]: value };
    });
  };

  const getStatusColor = (status: ProjectStatus) => {
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

  const getStatusIcon = (status: ProjectStatus): React.ReactElement => {
    switch (status) {
      case 'On Track':
        return <CheckCircleIcon sx={{ color: getStatusColor(status) }} />;
      case 'At Risk':
        return <WarningIcon sx={{ color: getStatusColor(status) }} />;
      case 'Impacted':
        return <TrendingUpIcon sx={{ color: getStatusColor(status) }} />;
      default:
        return <CheckCircleIcon sx={{ color: getStatusColor(status) }} />;
    }
  };

  const calculatePhaseCompletion = (phase: {
    items?: {
      value: number | string;
      isNA?: boolean;
    }[];
  }) => {
    if (!phase.items || phase.items.length === 0) return 0;
    const validItems = phase.items.filter(item => !item.isNA);
    if (validItems.length === 0) return 0;
    const sum = validItems.reduce((acc, item) => acc + Number(item.value), 0);
    return Math.round(sum / validItems.length);
  };

  const recalculateCompletion = (phases: CapexProject['phases']) => {
    let totalWeight = 0;
    let weightedSum = 0;

    Object.entries(phases).forEach(([key, phase]) => {
      if (phase) {
        const completion = calculatePhaseCompletion(phase);
        weightedSum += completion * phase.weight;
        totalWeight += phase.weight;
      }
    });

    return totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0;
  };

  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    }
    return `$${(value / 1000).toFixed(0)}K`;
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          minHeight: '80vh',
        },
      }}
    >
      <DialogTitle sx={{ p: 3, pb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            {editedProject.name}
          </Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab label="Overview" />
            <Tab label="Phases" />
            <Tab label="Financials" />
            <Tab label="Timeline" />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <SectionCard title="Project Details" icon={<CategoryIcon />}>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Project Name"
                      value={editedProject.name}
                      onChange={(e) => updateField('name', e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Project Type"
                      value={editedProject.type}
                      disabled
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Project Owner"
                      value={editedProject.owner}
                      onChange={(e) => updateField('owner', e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <FormControl fullWidth>
                      <InputLabel>Status</InputLabel>
                      <Select
                        value={editedProject.status}
                        label="Status"
                        onChange={(e) => updateField('status', e.target.value)}
                      >
                        <MenuItem value="On Track">On Track</MenuItem>
                        <MenuItem value="At Risk">At Risk</MenuItem>
                        <MenuItem value="Impacted">Impacted</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
              </SectionCard>
            </Grid>

            <Grid item xs={12} md={6}>
              <SectionCard title="Progress" icon={<TrendingUpIcon />}>
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Overall Progress
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{ flex: 1 }}>
                      <LinearProgress
                        variant="determinate"
                        value={editedProject.overallCompletion}
                        sx={{
                          height: 8,
                          borderRadius: 4,
                          backgroundColor: 'grey.200',
                          '& .MuiLinearProgress-bar': {
                            backgroundColor: getStatusColor(editedProject.status),
                          },
                        }}
                      />
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      {editedProject.overallCompletion}%
                    </Typography>
                  </Box>
                </Box>

                <Box>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Phase Progress
                  </Typography>
                  <Grid container spacing={2}>
                    {Object.entries(editedProject.phases).map(([key, phase]) => {
                      if (!phase) return null;
                      return (
                        <Grid item xs={12} key={key}>
                          <Box sx={{ mb: 1 }}>
                            <Typography variant="body2" sx={{ mb: 0.5 }}>
                              {phase.name}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                              <Box sx={{ flex: 1 }}>
                                <LinearProgress
                                  variant="determinate"
                                  value={phase.completion}
                                  sx={{
                                    height: 6,
                                    borderRadius: 3,
                                    backgroundColor: 'grey.200',
                                    '& .MuiLinearProgress-bar': {
                                      backgroundColor: phase.completion >= 90 ? '#10B981' :
                                        phase.completion >= 70 ? '#F59E0B' : '#EF4444',
                                    },
                                  }}
                                />
                              </Box>
                              <Typography variant="body2" sx={{ minWidth: 45 }}>
                                {phase.completion}%
                              </Typography>
                            </Box>
                          </Box>
                        </Grid>
                      );
                    })}
                  </Grid>
                </Box>
              </SectionCard>
            </Grid>

            <Grid item xs={12}>
              <SectionCard title="Financial Information" icon={<MoneyIcon />}>
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Budget"
                      type="number"
                      value={editedProject.budget}
                      onChange={(e) => updateField('budget', Number(e.target.value))}
                      InputProps={{
                        startAdornment: <InputAdornment position="start">$</InputAdornment>,
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Spent"
                      type="number"
                      value={editedProject.spent}
                      onChange={(e) => updateField('spent', Number(e.target.value))}
                      InputProps={{
                        startAdornment: <InputAdornment position="start">$</InputAdornment>,
                      }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Financial Notes"
                      multiline
                      rows={3}
                      value={editedProject.financialNotes || ''}
                      onChange={(e) => updateField('financialNotes', e.target.value)}
                    />
                  </Grid>
                </Grid>
              </SectionCard>
            </Grid>
          </Grid>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Grid container spacing={3}>
            {Object.entries(editedProject.phases).map(([key, phase]) => {
              if (!phase) return null;
              return (
                <Grid item xs={12} key={key}>
                  <SectionCard title={phase.name} icon={<CategoryIcon />}>
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Phase Progress
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Box sx={{ flex: 1 }}>
                          <LinearProgress
                            variant="determinate"
                            value={phase.completion}
                            sx={{
                              height: 8,
                              borderRadius: 4,
                              backgroundColor: 'grey.200',
                              '& .MuiLinearProgress-bar': {
                                backgroundColor: phase.completion >= 90 ? '#10B981' :
                                  phase.completion >= 70 ? '#F59E0B' : '#EF4444',
                              },
                            }}
                          />
                        </Box>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                          {phase.completion}%
                        </Typography>
                      </Box>
                    </Box>

                    <Grid container spacing={2}>
                      {phase.items.map((item, index) => (
                        <Grid item xs={12} sm={6} key={index}>
                          <Box sx={{ mb: 2 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                              <Typography variant="body2">{item.name}</Typography>
                              <FormControlLabel
                                control={
                                  <Switch
                                    checked={item.isNA || false}
                                    onChange={(e) => {
                                      const newItems = [...phase.items];
                                      newItems[index] = { ...item, isNA: e.target.checked };
                                      updateField('phases', {
                                        ...editedProject.phases,
                                        [key]: { ...phase, items: newItems }
                                      });
                                    }}
                                    size="small"
                                  />
                                }
                                label="N/A"
                              />
                            </Box>
                            {!(item.isNA || false) && (
                              <Slider
                                value={Number(item.value)}
                                onChange={(_, value) => {
                                  const newItems = [...phase.items];
                                  newItems[index] = { ...item, value: value as number };
                                  updateField('phases', {
                                    ...editedProject.phases,
                                    [key]: { ...phase, items: newItems }
                                  });
                                }}
                                min={0}
                                max={100}
                                step={5}
                                marks
                                valueLabelDisplay="auto"
                              />
                            )}
                          </Box>
                        </Grid>
                      ))}
                    </Grid>
                  </SectionCard>
                </Grid>
              );
            })}
          </Grid>
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <SectionCard title="Budget Overview" icon={<MoneyIcon />}>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <MetricBox
                      label="Total Budget"
                      value={formatCurrency(editedProject.budget)}
                      color="primary.main"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <MetricBox
                      label="Total Spent"
                      value={formatCurrency(editedProject.spent)}
                      color={editedProject.spent > editedProject.budget ? 'error.main' : 'success.main'}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <MetricBox
                      label="Remaining Budget"
                      value={formatCurrency(editedProject.budget - editedProject.spent)}
                      color={editedProject.spent > editedProject.budget ? 'error.main' : 'success.main'}
                    />
                  </Grid>
                </Grid>
              </SectionCard>
            </Grid>

            <Grid item xs={12} md={6}>
              <SectionCard title="Financial Notes" icon={<MoneyIcon />}>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  value={editedProject.financialNotes || ''}
                  onChange={(e) => updateField('financialNotes', e.target.value)}
                  placeholder="Add financial notes here..."
                />
              </SectionCard>
            </Grid>
          </Grid>
        </TabPanel>

        <TabPanel value={tabValue} index={3}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <SectionCard title="Project Timeline" icon={<CalendarIcon />}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Start Date"
                      type="date"
                      value={editedProject.startDate || ''}
                      onChange={(e) => updateField('startDate', e.target.value)}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="End Date"
                      type="date"
                      value={editedProject.endDate || ''}
                      onChange={(e) => updateField('endDate', e.target.value)}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Timeline"
                      value={editedProject.timeline || ''}
                      onChange={(e) => updateField('timeline', e.target.value)}
                    />
                  </Grid>
                </Grid>
              </SectionCard>
            </Grid>

            <Grid item xs={12} md={6}>
              <SectionCard title="Phase Dates" icon={<CalendarIcon />}>
                <Grid container spacing={2}>
                  {Object.entries(editedProject.phases).map(([key, phase]) => {
                    if (!phase) return null;
                    const startDateKey = `${key}StartDate` as keyof CapexProject;
                    const endDateKey = `${key}EndDate` as keyof CapexProject;
                    return (
                      <React.Fragment key={key}>
                        <Grid item xs={12}>
                          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                            {phase.name}
                          </Typography>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth
                            label="Start Date"
                            type="date"
                            value={editedProject[startDateKey] || ''}
                            onChange={(e) => updateField(startDateKey, e.target.value)}
                            InputLabelProps={{ shrink: true }}
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth
                            label="End Date"
                            type="date"
                            value={editedProject[endDateKey] || ''}
                            onChange={(e) => updateField(endDateKey, e.target.value)}
                            InputLabelProps={{ shrink: true }}
                          />
                        </Grid>
                      </React.Fragment>
                    );
                  })}
                </Grid>
              </SectionCard>
            </Grid>

            <Grid item xs={12}>
              <SectionCard title="Upcoming Milestone" icon={<CalendarIcon />}>
                <TextField
                  fullWidth
                  label="Next Milestone"
                  value={editedProject.upcomingMilestone || ''}
                  onChange={(e) => updateField('upcomingMilestone', e.target.value)}
                />
              </SectionCard>
            </Grid>
          </Grid>
        </TabPanel>
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 0 }}>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          onClick={handleSave}
          sx={{ ml: 1 }}
        >
          Save Changes
        </Button>
      </DialogActions>
    </Dialog>
  );
}