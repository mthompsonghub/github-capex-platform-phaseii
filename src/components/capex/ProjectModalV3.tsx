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
import { CapexProject } from '../../types/capex';
import { useCapExStore } from '../../stores/capexStore';
import { createEmptyFeasibilityPhase, createEmptyPlanningPhase, createEmptyExecutionPhase, createEmptyClosePhase, PHASE_SUB_ITEMS, FeasibilityPhase, PlanningPhase, ExecutionPhase, ClosePhase, Project, DetailedSubItem } from './data/capexData';

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
        status: project.status || 'on-track'
      });
    }
  }, [project]);

  if (!project || !editedProject) return null;

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleSave = async () => {
    if (editedProject) {
      // Convert CapexProject to Project
      const projectToUpdate: Project = {
        id: editedProject.id,
        projectName: editedProject.name,
        projectOwner: editedProject.owner,
        startDate: new Date(),
        endDate: new Date(),
        projectType: {
          id: editedProject.type === 'project' ? 'projects' : 'asset_purchases',
          name: editedProject.type === 'project' ? 'Projects' : 'Asset Purchases',
          phaseWeights: {
            feasibility: 15,
            planning: 35,
            execution: 45,
            close: 5
          }
        },
        totalBudget: editedProject.budget,
        totalActual: editedProject.spent,
        projectStatus: editedProject.status.charAt(0).toUpperCase() + editedProject.status.slice(1).replace('-', ' ') as 'On Track' | 'At Risk' | 'Impacted',
        phases: {
          feasibility: {
            id: 'feasibility',
            name: 'Feasibility',
            weight: 15,
            completion: editedProject.phases.feasibility?.completion || 0,
            subItems: {
              riskAssessment: {
                name: PHASE_SUB_ITEMS.feasibility[0].name,
                value: editedProject.phases.feasibility?.subItems?.riskAssessment?.value || 0,
                isNA: editedProject.phases.feasibility?.subItems?.riskAssessment?.isNA || false
              } as DetailedSubItem,
              projectCharter: {
                name: PHASE_SUB_ITEMS.feasibility[1].name,
                value: editedProject.phases.feasibility?.subItems?.projectCharter?.value || 0,
                isNA: editedProject.phases.feasibility?.subItems?.projectCharter?.isNA || false
              } as DetailedSubItem
            }
          } as FeasibilityPhase,
          planning: {
            id: 'planning',
            name: 'Planning',
            weight: 35,
            completion: editedProject.phases.planning?.completion || 0,
            subItems: {
              rfqPackage: {
                name: PHASE_SUB_ITEMS.planning[0].name,
                value: editedProject.phases.planning?.subItems?.rfqPackage?.value || 0,
                isNA: editedProject.phases.planning?.subItems?.rfqPackage?.isNA || false
              } as DetailedSubItem,
              validationStrategy: {
                name: PHASE_SUB_ITEMS.planning[1].name,
                value: editedProject.phases.planning?.subItems?.validationStrategy?.value || 0,
                isNA: editedProject.phases.planning?.subItems?.validationStrategy?.isNA || false
              } as DetailedSubItem,
              financialForecast: {
                name: PHASE_SUB_ITEMS.planning[2].name,
                value: editedProject.phases.planning?.subItems?.financialForecast?.value || 0,
                isNA: editedProject.phases.planning?.subItems?.financialForecast?.isNA || false
              } as DetailedSubItem,
              vendorSolicitation: {
                name: PHASE_SUB_ITEMS.planning[3].name,
                value: editedProject.phases.planning?.subItems?.vendorSolicitation?.value || 0,
                isNA: editedProject.phases.planning?.subItems?.vendorSolicitation?.isNA || false
              } as DetailedSubItem,
              ganttChart: {
                name: PHASE_SUB_ITEMS.planning[4].name,
                value: editedProject.phases.planning?.subItems?.ganttChart?.value || 0,
                isNA: editedProject.phases.planning?.subItems?.ganttChart?.isNA || false
              } as DetailedSubItem,
              sesAssetNumberApproval: {
                name: PHASE_SUB_ITEMS.planning[5].name,
                value: editedProject.phases.planning?.subItems?.sesAssetNumberApproval?.value || 0,
                isNA: editedProject.phases.planning?.subItems?.sesAssetNumberApproval?.isNA || false
              } as DetailedSubItem
            }
          } as PlanningPhase,
          execution: {
            id: 'execution',
            name: 'Execution',
            weight: 45,
            completion: editedProject.phases.execution?.completion || 0,
            subItems: {
              poSubmission: {
                name: PHASE_SUB_ITEMS.execution[0].name,
                value: editedProject.phases.execution?.subItems?.poSubmission?.value || 0,
                isNA: editedProject.phases.execution?.subItems?.poSubmission?.isNA || false
              } as DetailedSubItem,
              equipmentDesign: {
                name: PHASE_SUB_ITEMS.execution[1].name,
                value: editedProject.phases.execution?.subItems?.equipmentDesign?.value || 0,
                isNA: editedProject.phases.execution?.subItems?.equipmentDesign?.isNA || false
              } as DetailedSubItem,
              equipmentBuild: {
                name: PHASE_SUB_ITEMS.execution[2].name,
                value: editedProject.phases.execution?.subItems?.equipmentBuild?.value || 0,
                isNA: editedProject.phases.execution?.subItems?.equipmentBuild?.isNA || false
              } as DetailedSubItem,
              projectDocumentation: {
                name: PHASE_SUB_ITEMS.execution[3].name,
                value: editedProject.phases.execution?.subItems?.projectDocumentation?.value || 0,
                isNA: editedProject.phases.execution?.subItems?.projectDocumentation?.isNA || false
              } as DetailedSubItem,
              demoInstall: {
                name: PHASE_SUB_ITEMS.execution[4].name,
                value: editedProject.phases.execution?.subItems?.demoInstall?.value || 0,
                isNA: editedProject.phases.execution?.subItems?.demoInstall?.isNA || false
              } as DetailedSubItem,
              validation: {
                name: PHASE_SUB_ITEMS.execution[5].name,
                value: editedProject.phases.execution?.subItems?.validation?.value || 0,
                isNA: editedProject.phases.execution?.subItems?.validation?.isNA || false
              } as DetailedSubItem,
              equipmentTurnover: {
                name: PHASE_SUB_ITEMS.execution[6].name,
                value: editedProject.phases.execution?.subItems?.equipmentTurnover?.value || 0,
                isNA: editedProject.phases.execution?.subItems?.equipmentTurnover?.isNA || false
              } as DetailedSubItem,
              goLive: {
                name: PHASE_SUB_ITEMS.execution[7].name,
                value: editedProject.phases.execution?.subItems?.goLive?.value || 0,
                isNA: editedProject.phases.execution?.subItems?.goLive?.isNA || false
              } as DetailedSubItem
            }
          } as ExecutionPhase,
          close: {
            id: 'close',
            name: 'Close',
            weight: 5,
            completion: editedProject.phases.close?.completion || 0,
            subItems: {
              poClosure: {
                name: PHASE_SUB_ITEMS.close[0].name,
                value: editedProject.phases.close?.subItems?.poClosure?.value || 0,
                isNA: editedProject.phases.close?.subItems?.poClosure?.isNA || false
              } as DetailedSubItem,
              projectTurnover: {
                name: PHASE_SUB_ITEMS.close[1].name,
                value: editedProject.phases.close?.subItems?.projectTurnover?.value || 0,
                isNA: editedProject.phases.close?.subItems?.projectTurnover?.isNA || false
              } as DetailedSubItem
            }
          } as ClosePhase
        },
        comments: '',
        lastUpdated: new Date(),
        sesNumber: editedProject.sesNumber,
        upcomingMilestone: editedProject.milestones?.feasibility || '',
        financialNotes: editedProject.financialNotes,
        
        // Additional fields for CapexProject compatibility
        name: editedProject.name,
        owner: editedProject.owner,
        type: editedProject.type,
        status: editedProject.status,
        budget: editedProject.budget,
        spent: editedProject.spent,
        overallCompletion: editedProject.overallCompletion,
        timeline: editedProject.timeline,
        milestones: {
          feasibility: editedProject.milestones?.feasibility || '',
          planning: editedProject.milestones?.planning || '',
          execution: editedProject.milestones?.execution || '',
          close: editedProject.milestones?.close || ''
        }
      };
      
      await updateProject(projectToUpdate);
      onClose();
    }
  };

  const updateField = (field: keyof CapexProject, value: any) => {
    setEditedProject((prev: CapexProject | null) => prev ? { ...prev, [field]: value } : null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'on-track': return 'success.main';
      case 'at-risk': return 'warning.main';
      case 'impacted': return 'error.main';
      default: return 'text.primary';
    }
  };

  const getStatusIcon = (status: string): React.ReactElement => {
    switch (status) {
      case 'on-track': return <CheckCircleIcon />;
      case 'at-risk': return <WarningIcon />;
      case 'impacted': return <WarningIcon />;
      default: return <CheckCircleIcon />;
    }
  };

  const calculatePhaseCompletion = (phase: {
    subItems?: {
      [key: string]: {
        value: number;
        isNA: boolean;
      };
    };
  }) => {
    if (!phase?.subItems) return 0;
    const items = Object.values(phase.subItems);
    const activeItems = items.filter(item => !item.isNA);
    if (activeItems.length === 0) return 0;
    const sum = activeItems.reduce((acc, item) => acc + (item.value || 0), 0);
    return Math.round(sum / activeItems.length);
  };

  const recalculateCompletion = (phases: {
    [key: string]: {
      name: string;
      weight: number;
      completion: number;
      subItems: {
        [key: string]: {
          name: string;
          value: number;
          isNA: boolean;
        };
      };
    };
  }) => {
    const updatedPhases = { ...phases };
    Object.keys(updatedPhases).forEach(phaseKey => {
      const phase = updatedPhases[phaseKey];
      phase.completion = calculatePhaseCompletion(phase);
    });
    return updatedPhases;
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        },
      }}
    >
      {/* Header */}
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: 1,
          borderColor: 'divider',
          pb: 2,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            Edit Project
          </Typography>
          <Chip
            label={editedProject.name}
            color="primary"
            variant="outlined"
            sx={{ fontWeight: 500 }}
          />
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Chip
            icon={getStatusIcon(editedProject.status || 'on-track')}
            label={(editedProject.status || 'on-track').replace('-', ' ').toUpperCase()}
            sx={{
              backgroundColor: getStatusColor(editedProject.status || 'on-track'),
              color: 'white',
              fontWeight: 600,
              '& .MuiChip-icon': { color: 'white' },
            }}
          />
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 3 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          sx={{
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 500,
              fontSize: '0.95rem',
              minHeight: 48,
            },
          }}
        >
          <Tab label="Basic Information" />
          <Tab label="Status & Milestones" />
          <Tab label="Financial Details" />
        </Tabs>
      </Box>

      {/* Content */}
      <DialogContent sx={{ px: 3, py: 0, height: '60vh', overflowY: 'auto' }}>
        {/* Basic Information Tab */}
        <TabPanel value={tabValue} index={0}>
          <SectionCard title="Project Details" icon={<CategoryIcon />}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Project Name"
                  value={editedProject.name}
                  onChange={(e) => updateField('name', e.target.value)}
                  variant="outlined"
                  sx={{ mb: 2 }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Project Type</InputLabel>
                  <Select
                    value={editedProject.type}
                    label="Project Type"
                    onChange={(e) => updateField('type', e.target.value)}
                  >
                    <MenuItem value="Complex Project">Complex Project</MenuItem>
                    <MenuItem value="Asset Purchase">Asset Purchase</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Project Owner"
                  value={editedProject.owner}
                  onChange={(e) => updateField('owner', e.target.value)}
                  variant="outlined"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PersonIcon />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={editedProject.status}
                    label="Status"
                    onChange={(e) => updateField('status', e.target.value)}
                  >
                    <MenuItem value="on-track">On Track</MenuItem>
                    <MenuItem value="at-risk">At Risk</MenuItem>
                    <MenuItem value="impacted">Impacted</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </SectionCard>

          <SectionCard title="Project Overview" icon={<TrendingUpIcon />}>
            <Box sx={{ display: 'flex', gap: 4, mb: 3 }}>
              <MetricBox
                label="Overall Completion"
                value={`${editedProject.overallCompletion}%`}
                color={getStatusColor(editedProject.status)}
              />
              <MetricBox
                label="Budget Utilization"
                value={`${Math.round((editedProject.spent / editedProject.budget) * 100)}%`}
              />
              <MetricBox
                label="Time to Completion"
                value={editedProject.timeline || 'TBD'}
              />
            </Box>
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
          </SectionCard>
        </TabPanel>

        {/* Status & Milestones Tab */}
        <TabPanel value={tabValue} index={1}>
          {Object.entries(editedProject.phases).map(([phaseKey, phase]) => {
            const typedPhase = phase as {
              name: string;
              weight: number;
              completion: number;
              subItems: {
                [key: string]: {
                  name: string;
                  value: number;
                  isNA: boolean;
                };
              };
            };
            return (
              <SectionCard key={phaseKey} title={`${typedPhase.name} Phase (${typedPhase.weight}%)`}>
                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      Phase Completion
                    </Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {typedPhase.completion}%
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={typedPhase.completion}
                    sx={{
                      height: 6,
                      borderRadius: 3,
                      backgroundColor: 'grey.200',
                    }}
                  />
                </Box>

                <Divider sx={{ my: 2 }} />

                {typedPhase.subItems && Object.entries(typedPhase.subItems).map(([key, subItem]) => (
                  <Box key={key} sx={{ mb: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {subItem.name}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                          {subItem.value}%
                        </Typography>
                        <FormControlLabel
                          control={
                            <Switch
                              size="small"
                              checked={subItem.isNA}
                              onChange={(e) => {
                                const updatedPhases = {
                                  ...editedProject.phases,
                                  [phaseKey]: {
                                    ...typedPhase,
                                    subItems: {
                                      ...typedPhase.subItems,
                                      [key]: { ...subItem, isNA: e.target.checked, value: e.target.checked ? 0 : subItem.value }
                                    }
                                  }
                                };
                                const finalPhases = recalculateCompletion(updatedPhases);
                                updateField('phases', finalPhases);
                              }}
                            />
                          }
                          label="N/A"
                        />
                      </Box>
                    </Box>
                    <Slider
                      value={subItem.value}
                      onChange={(_, newValue) => {
                        const updatedPhases = {
                          ...editedProject.phases,
                          [phaseKey]: {
                            ...typedPhase,
                            subItems: {
                              ...typedPhase.subItems,
                              [key]: { ...subItem, value: newValue as number }
                            }
                          }
                        };
                        const finalPhases = recalculateCompletion(updatedPhases);
                        updateField('phases', finalPhases);
                      }}
                      disabled={subItem.isNA}
                      sx={{
                        '& .MuiSlider-thumb': {
                          width: 16,
                          height: 16,
                        },
                        '& .MuiSlider-rail': {
                          opacity: 0.3,
                        },
                      }}
                    />
                  </Box>
                ))}

                <Box sx={{ mt: 3, p: 2, backgroundColor: 'grey.100', borderRadius: 1 }}>
                  <TextField
                    fullWidth
                    label="Upcoming Milestone"
                    value={editedProject.milestones?.[phaseKey] || ''}
                    onChange={(e) => updateField('milestones', {
                      ...editedProject.milestones,
                      [phaseKey]: e.target.value
                    })}
                    variant="outlined"
                    size="small"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <CalendarIcon fontSize="small" />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Box>
              </SectionCard>
            );
          })}
        </TabPanel>

        {/* Financial Details Tab */}
        <TabPanel value={tabValue} index={2}>
          <SectionCard title="Budget Information" icon={<MoneyIcon />}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Total Budget"
                  type="number"
                  value={editedProject.budget}
                  onChange={(e) => updateField('budget', Number(e.target.value))}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">$</InputAdornment>,
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Amount Spent"
                  type="number"
                  value={editedProject.spent}
                  onChange={(e) => updateField('spent', Number(e.target.value))}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">$</InputAdornment>,
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <Box sx={{ p: 2, backgroundColor: 'primary.50', borderRadius: 1 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Budget Utilization
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 2 }}>
                    <Typography variant="h4" color="primary.main" fontWeight={600}>
                      {Math.round((editedProject.spent / editedProject.budget) * 100)}%
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      ${(editedProject.budget - editedProject.spent).toLocaleString()} remaining
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            </Grid>
          </SectionCard>

          <SectionCard title="Financial Details">
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="SES Number"
                  value={editedProject.sesNumber || ''}
                  onChange={(e) => updateField('sesNumber', e.target.value)}
                  variant="outlined"
                  helperText="System Entry Sheet number for tracking"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Cost Center"
                  value={editedProject.costCenter || ''}
                  onChange={(e) => updateField('costCenter', e.target.value)}
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Financial Notes"
                  value={editedProject.financialNotes || ''}
                  onChange={(e) => updateField('financialNotes', e.target.value)}
                  variant="outlined"
                  helperText="Additional financial information or comments"
                />
              </Grid>
            </Grid>
          </SectionCard>

          <SectionCard title="ROI & Approvals">
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Expected ROI"
                  value={editedProject.expectedROI || ''}
                  onChange={(e) => updateField('expectedROI', e.target.value)}
                  variant="outlined"
                  InputProps={{
                    endAdornment: <InputAdornment position="end">%</InputAdornment>,
                  }}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Payback Period"
                  value={editedProject.paybackPeriod || ''}
                  onChange={(e) => updateField('paybackPeriod', e.target.value)}
                  variant="outlined"
                  helperText="In months"
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>Approval Status</InputLabel>
                  <Select
                    value={editedProject.approvalStatus || 'pending'}
                    label="Approval Status"
                    onChange={(e) => updateField('approvalStatus', e.target.value)}
                  >
                    <MenuItem value="pending">Pending</MenuItem>
                    <MenuItem value="approved">Approved</MenuItem>
                    <MenuItem value="conditional">Conditional</MenuItem>
                    <MenuItem value="rejected">Rejected</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </SectionCard>
        </TabPanel>
      </DialogContent>

      {/* Actions */}
      <DialogActions
        sx={{
          px: 3,
          py: 2,
          borderTop: 1,
          borderColor: 'divider',
          gap: 2,
        }}
      >
        <Button
          onClick={onClose}
          variant="outlined"
          sx={{ minWidth: 100 }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          sx={{ minWidth: 100 }}
        >
          Save Changes
        </Button>
      </DialogActions>
    </Dialog>
  );
}