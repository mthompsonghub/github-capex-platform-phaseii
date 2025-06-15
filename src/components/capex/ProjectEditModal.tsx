import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Tabs,
  Tab,
  Box,
  TextField,
  Grid,
  Button,
  Typography,
  Alert,
  Snackbar,
  Paper,
  Slider,
  FormControlLabel,
  Switch,
  Divider,
  CircularProgress,
  DialogActions,
  DialogContentText,
  Tooltip,
  Fade,
  MenuItem,
  Select,
  InputAdornment,
  FormControl,
  InputLabel,
  Chip
} from '@mui/material';
import { X as CloseIcon, Lock as LockIcon, AlertTriangle } from 'lucide-react';
import { Project, PhaseProgress, calculatePhaseCompletion, calculateOverallCompletion, determineProjectStatus } from './data/capexData';
import { CapExRecord, Phase } from '../../types/capex';
import { convertProjectToCapExRecord, convertCapExRecordToProject } from '../../utils/projectUtils';
import { roles } from '../../lib/supabase';
import toast from 'react-hot-toast';
import { useCapExStore } from '../../stores/capexStore';

type ProjectStatus = 'On Track' | 'At Risk' | 'Impacted';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => (
  <div
    role="tabpanel"
    hidden={value !== index}
    id={`project-edit-tabpanel-${index}`}
    aria-labelledby={`project-edit-tab-${index}`}
    style={{ height: '100%' }}
  >
    {value === index && (
      <Box sx={{ p: 3, height: '100%', overflowY: 'auto' }}>
        {children}
      </Box>
    )}
  </div>
);

const a11yProps = (index: number) => ({
  id: `project-edit-tab-${index}`,
  'aria-controls': `project-edit-tabpanel-${index}`,
});

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

const formatDate = (date: Date | string): string => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

export const ProjectEditModal: React.FC = () => {
  const modalState = useCapExStore(state => state.modalState);
  const actions = useCapExStore(state => state.actions);
  const adminSettings = useCapExStore(state => state.adminSettings);
  const { isOpen, data: initialProject } = modalState;
  
  const [activeTab, setActiveTab] = useState(0);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showUnsavedWarning, setShowUnsavedWarning] = useState(false);
  const [editedProject, setEditedProject] = useState<Project | CapExRecord | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [overallCompletion, setOverallCompletion] = useState(0);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [calculatedStatus, setCalculatedStatus] = useState<ProjectStatus | null>(null);
  const [statusChanged, setStatusChanged] = useState(false);

  const canEditPercentages = isAdmin;
  const canEditDates = isAdmin;
  const canEditBudgets = isAdmin;

  // Check permissions when modal opens
  useEffect(() => {
    const checkPermissions = async () => {
      try {
        setIsLoading(true);
        const isAdminUser = await roles.isAdmin();
        setIsAdmin(isAdminUser);
      } catch (error) {
        console.error('Error checking permissions:', error);
        toast.error('Failed to verify permissions');
      } finally {
        setIsLoading(false);
      }
    };
    
    if (isOpen) {
      checkPermissions();
    }
  }, [isOpen]);

  useEffect(() => {
    if (initialProject) {
      setEditedProject(initialProject);
      setHasUnsavedChanges(false);
      setActiveTab(0);
      calculateAndSetOverallCompletion(initialProject);
      // Add logging for debugging project type
      console.log('Modal opened for project:', {
        name: initialProject?.projectName || initialProject?.project_name,
        type: initialProject?.projectType || initialProject?.project_type,
        owner: initialProject?.projectOwner || initialProject?.project_owner
      });
    }
  }, [initialProject]);

  // Calculate status whenever completion changes
  useEffect(() => {
    if (editedProject) {
      // Convert CapExRecord to Project if needed
      const projectData = 'phases' in editedProject 
        ? editedProject 
        : convertCapExRecordToProject(editedProject);
      
      const completion = calculateOverallCompletion(projectData);
      const newStatus = determineProjectStatus(
        completion,
        100,
        adminSettings.atRiskThreshold,
        adminSettings.impactedThreshold
      );
      setCalculatedStatus(newStatus);
      
      // Check if status has changed
      const currentStatus = 'phases' in editedProject 
        ? editedProject.projectStatus 
        : editedProject.project_status;
        
      if (newStatus !== currentStatus) {
        setStatusChanged(true);
        // Auto-update project status
        if ('phases' in editedProject) {
          setEditedProject({
            ...editedProject,
            projectStatus: newStatus
          });
        } else {
          setEditedProject({
            ...editedProject,
            project_status: newStatus
          });
        }
        setHasUnsavedChanges(true);
        
        // Clear status change indicator after delay
        setTimeout(() => setStatusChanged(false), 2000);
      }
    }
  }, [editedProject, overallCompletion, adminSettings]);

  const calculatePhaseCompletionExcludingNA = (subItems: any[]): number => {
    const validItems = subItems.filter(item => !item.isNA);
    if (validItems.length === 0) return 0;
    
    const sum = validItems.reduce((acc, item) => {
      const value = 'value' in item ? item.value : item.actual;
      return acc + value;
    }, 0);
    
    // Ensure we round to nearest integer
    return Math.round(sum / validItems.length);
  };

  const calculateAndSetOverallCompletion = (project: Project | CapExRecord) => {
    if ('phases' in project) {
      // Handle Project type
      const { feasibility, planning, execution, close } = project.phases;
      const weights = project.projectType.phaseWeights;
      
      // Calculate weighted sum using exact weights
      const weightedSum = 
        (feasibility.completion * weights.feasibility / 100) +
        (planning.completion * weights.planning / 100) +
        (execution.completion * weights.execution / 100) +
        (close.completion * weights.close / 100);
      
      // Round to nearest integer
      setOverallCompletion(Math.round(weightedSum));
    } else {
      // Handle CapExRecord type
      const phases = ['feasibility', 'planning', 'execution', 'close'] as const;
      const weightedSum = phases.reduce((acc, phase) => {
        const weight = project.projectType.phaseWeights[phase];
        // Divide weight by 100 to get proper percentage
        return acc + (project[phase].status.actual * weight / 100);
      }, 0);
      
      // Round to nearest integer
      setOverallCompletion(Math.round(weightedSum));
    }
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleClose = () => {
    if (hasUnsavedChanges) {
      setShowUnsavedWarning(true);
    } else {
      closeModal();
    }
  };

  const handleConfirmClose = () => {
    setShowUnsavedWarning(false);
    closeModal();
  };

  const closeModal = () => {
    actions.closeProjectModal();
    setEditedProject(null);
    setHasUnsavedChanges(false);
    setActiveTab(0);
  };

  const handleSave = async () => {
    if (!editedProject) return;

    try {
      setIsSaving(true);
      // Convert CapExRecord to Project if needed
      const projectToSave = 'phases' in editedProject 
        ? editedProject 
        : convertCapExRecordToProject(editedProject);
      
      await actions.updateProject(projectToSave);
      toast.success('Project updated successfully');
      closeModal();
    } catch (error) {
      console.error('Error saving project:', error);
      toast.error('Failed to save project');
    } finally {
      setIsSaving(false);
    }
  };

  const updatePhaseValue = (
    phaseKey: 'feasibility' | 'planning' | 'execution' | 'close',
    subItemId: string,
    value: number
  ) => {
    if (!editedProject) return;

    if ('phases' in editedProject) {
      const updatedPhases = {
        ...editedProject.phases,
        [phaseKey]: {
          ...editedProject.phases[phaseKey],
          subItems: editedProject.phases[phaseKey].subItems.map(item =>
            item.id === subItemId ? { ...item, value } : item
          )
        }
      };

      setEditedProject({
        ...editedProject,
        phases: updatedPhases
      });
    } else {
      // Handle CapExRecord case
      const updatedProject = {
        ...editedProject,
        [`${phaseKey}_${subItemId}`]: value
      };
      setEditedProject(updatedProject);
    }

    setHasUnsavedChanges(true);
  };

  const getDisplayWeight = (phaseName: string) => {
    const projectType = editedProject?.projectType || editedProject?.project_type;
    const store = useCapExStore.getState();
    const weights = store.actions.getPhaseWeights(projectType);
    return weights[phaseName] || 0;
  };

  const renderPhaseSection = (
    phaseKey: 'feasibility' | 'planning' | 'execution' | 'close',
    phaseTitle: string
  ) => {
    if (!editedProject) return null;

    const phaseImpact = () => {
      if ('phases' in editedProject) {
        const phase = editedProject.phases[phaseKey];
        const completion = calculatePhaseCompletionExcludingNA(phase.subItems);
        return (
          <Typography variant="body2" color="text.secondary">
            Overall Impact: {completion}%
          </Typography>
        );
      }
      return null;
    };

    return (
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          {phaseTitle} Phase ({getDisplayWeight(phaseKey)}% weight)
        </Typography>
        {phaseImpact()}
        <Box sx={{ mt: 2 }}>
          {('phases' in editedProject ? editedProject.phases[phaseKey].subItems : []).map((item) => (
            <Box key={item.id} sx={{ mb: 2 }}>
              <Typography variant="body2" sx={{ mb: 1 }}>
                {item.name}
              </Typography>
              <Slider
                value={item.value}
                onChange={(_e, value) => updatePhaseValue(phaseKey, item.id, value as number)}
                disabled={!canEditPercentages}
                marks
                min={0}
                max={100}
                valueLabelDisplay="auto"
                valueLabelFormat={(value) => `${value}%`}
              />
            </Box>
          ))}
        </Box>
      </Box>
    );
  };

  const renderBasicInfoTab = () => {
    if (!editedProject) return null;

    const fieldMappings = {
      projectName: {
        projectField: 'projectName',
        recordField: 'project_name',
        type: 'string' as const
      },
      projectType: {
        projectField: 'projectType',
        recordField: 'project_type',
        type: 'select' as const,
        options: ['Project', 'Asset Purchase']
      },
      projectOwner: {
        projectField: 'projectOwner',
        recordField: 'project_owner',
        type: 'string' as const
      },
      projectStatus: {
        projectField: 'projectStatus',
        recordField: 'project_status',
        type: 'select' as const,
        options: ['On Track', 'At Risk', 'Impacted'],
        readOnly: true
      },
      priority: {
        projectField: 'priority',
        recordField: 'priority',
        type: 'select' as const,
        options: ['High', 'Medium', 'Low']
      },
      description: {
        projectField: 'description',
        recordField: 'description',
        type: 'textarea' as const
      }
    };

    const getValue = (field: keyof typeof fieldMappings) => {
      if ('phases' in editedProject) {
        return editedProject[fieldMappings[field].projectField as keyof Project];
      }
      return editedProject[fieldMappings[field].recordField as keyof CapExRecord];
    };

    const setValue = (field: keyof typeof fieldMappings, value: any) => {
      if ('phases' in editedProject) {
        setEditedProject({
          ...editedProject,
          [fieldMappings[field].projectField]: value
        });
      } else {
        setEditedProject({
          ...editedProject,
          [fieldMappings[field].recordField]: value
        });
      }
      setHasUnsavedChanges(true);
    };

    return (
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Project Name"
            value={getValue('projectName')}
            onChange={(e) => setValue('projectName', e.target.value)}
            disabled={!canEditDates}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <InputLabel>Project Type</InputLabel>
            <Select
              value={getValue('projectType')}
              onChange={(e) => setValue('projectType', e.target.value)}
              label="Project Type"
              disabled={!canEditDates}
            >
              {fieldMappings.projectType.options.map((option) => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Project Owner"
            value={getValue('projectOwner')}
            onChange={(e) => setValue('projectOwner', e.target.value)}
            disabled={!canEditDates}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <InputLabel>Priority</InputLabel>
            <Select
              value={getValue('priority')}
              onChange={(e) => setValue('priority', e.target.value)}
              label="Priority"
              disabled={!canEditDates}
            >
              {fieldMappings.priority.options.map((option) => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <InputLabel>Status</InputLabel>
            <Select
              value={getValue('projectStatus')}
              onChange={(e) => setValue('projectStatus', e.target.value)}
              label="Status"
              disabled={true}
              sx={{
                '& .MuiSelect-select': {
                  color: (theme) => {
                    const status = getValue('projectStatus') as ProjectStatus;
                    switch (status) {
                      case 'On Track':
                        return theme.palette.success.main;
                      case 'At Risk':
                        return theme.palette.warning.main;
                      case 'Impacted':
                        return theme.palette.error.main;
                      default:
                        return theme.palette.text.primary;
                    }
                  }
                }
              }}
            >
              {fieldMappings.projectStatus.options.map((option) => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Description"
            value={getValue('description')}
            onChange={(e) => setValue('description', e.target.value)}
            disabled={!canEditDates}
            multiline
            rows={4}
          />
        </Grid>
      </Grid>
    );
  };

  const renderStatusAndMilestonesTab = () => {
    if (!editedProject) return null;

    const isProject = 'phases' in editedProject;
    const status = isProject ? editedProject.projectStatus : editedProject.project_status;
    const milestone = isProject ? editedProject.comments : editedProject.upcoming_milestone;
    const comments = isProject ? editedProject.comments : editedProject.comments_risk;
    const lastUpdated = isProject ? editedProject.lastUpdated : new Date();

    // Get status color based on current status
    const getStatusColor = (status: ProjectStatus) => {
      switch (status) {
        case 'On Track':
          return 'success';
        case 'At Risk':
          return 'warning';
        case 'Impacted':
          return 'error';
        default:
          return 'default';
      }
    };

    const handleDateChange = (field: 'startDate' | 'endDate', value: string) => {
      if (!editedProject) return;
      
      const date = new Date(value);
      if (isProject) {
        setEditedProject({
          ...editedProject,
          [field]: date.toISOString()
        });
      } else {
        setEditedProject({
          ...editedProject,
          [field === 'startDate' ? 'start_date' : 'end_date']: date.toISOString()
        });
      }
      setHasUnsavedChanges(true);
    };

    const handlePhaseChange = (phase: string, value: number) => {
      if (!editedProject) return;

      if (isProject) {
        const newPhases = {
          ...editedProject.phases,
          [phase]: { ...editedProject.phases[phase as keyof typeof editedProject.phases], completion: value }
        };
        setEditedProject({
          ...editedProject,
          phases: newPhases
        });
      } else {
        const phaseData = editedProject[phase as keyof CapExRecord] as Phase;
        setEditedProject({
          ...editedProject,
          [phase]: {
            ...phaseData,
            status: { ...phaseData.status, actual: value }
          }
        });
      }
      setHasUnsavedChanges(true);
    };

    return (
      <Grid container spacing={3}>
        {/* Status Section */}
        <Grid item xs={12}>
          <Paper elevation={0} sx={{ p: 3, bgcolor: 'background.default' }}>
            <Typography variant="h6" gutterBottom>
              Project Status
            </Typography>
            
            {/* Current Status */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                Current Status
              </Typography>
              <Box display="flex" alignItems="center" gap={2}>
                <Chip
                  label={status}
                  color={getStatusColor(status as ProjectStatus)}
                  sx={{ fontWeight: 500 }}
                />
                {statusChanged && (
                  <Chip
                    label="Auto-updated"
                    color="info"
                    size="small"
                    icon={<AlertTriangle size={14} />}
                  />
                )}
              </Box>
            </Box>

            {/* Status Calculation */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                Status Calculation
              </Typography>
              <Box sx={{ 
                p: 2, 
                bgcolor: 'background.paper', 
                borderRadius: 1,
                border: '1px solid',
                borderColor: 'divider'
              }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="textSecondary">
                      Current Completion
                    </Typography>
                    <Typography variant="h6">
                      {Math.round(overallCompletion)}%
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="textSecondary">
                      Calculated Status
                    </Typography>
                    <Typography 
                      variant="h6" 
                      color={getStatusColor(calculatedStatus || 'On Track')}
                    >
                      {calculatedStatus || 'Calculating...'}
                    </Typography>
                  </Grid>
                </Grid>
              </Box>
            </Box>

            {/* Target Dates */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                Target Dates
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Start Date"
                    type="date"
                    value={isProject ? new Date(editedProject.startDate).toISOString().split('T')[0] : 
                      new Date(editedProject.start_date).toISOString().split('T')[0]}
                    onChange={(e) => handleDateChange('startDate', e.target.value)}
                    disabled={!canEditDates}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="End Date"
                    type="date"
                    value={isProject ? new Date(editedProject.endDate).toISOString().split('T')[0] : 
                      new Date(editedProject.end_date).toISOString().split('T')[0]}
                    onChange={(e) => handleDateChange('endDate', e.target.value)}
                    disabled={!canEditDates}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
              </Grid>
            </Box>

            {/* Milestones */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                Upcoming Milestone
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={2}
                value={milestone || ''}
                onChange={(e) => {
                  if (!editedProject) return;
                  if (isProject) {
                    setEditedProject({
                      ...editedProject,
                      comments: e.target.value
                    });
                  } else {
                    setEditedProject({
                      ...editedProject,
                      upcoming_milestone: e.target.value
                    });
                  }
                  setHasUnsavedChanges(true);
                }}
                disabled={!canEditDates}
              />
            </Box>

            {/* Phase Percentages */}
            <Box>
              <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                Phase Progress
              </Typography>
              <Grid container spacing={2}>
                {['feasibility', 'planning', 'execution', 'close'].map((phase) => (
                  <Grid item xs={12} sm={6} key={phase}>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="h6" color="primary" gutterBottom>
                        {phase.charAt(0).toUpperCase() + phase.slice(1)} Phase ({getDisplayWeight(phase)}% weight)
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Slider
                          value={isProject ? editedProject.phases[phase].completion : editedProject[phase].status.actual}
                          onChange={(_, value) => handlePhaseChange(phase, value as number)}
                          disabled={!canEditPercentages}
                          sx={{ flex: 1 }}
                        />
                        <Typography variant="body2" sx={{ minWidth: 45 }}>
                          {Math.round(isProject ? editedProject.phases[phase].completion : editedProject[phase].status.actual)}%
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    );
  };

  const renderFinancialDetailsTab = () => {
    if (!editedProject) return null;

    const isProject = 'phases' in editedProject;
    const budget = isProject ? editedProject.totalBudget : editedProject.total_budget;
    const actualSpend = isProject ? editedProject.totalActual : editedProject.total_actual;
    const financialNotes = isProject ? editedProject.comments : editedProject.comments_risk;

    const handleBudgetChange = (value: number) => {
      if (!editedProject) return;
      if (isProject) {
        setEditedProject({
          ...editedProject,
          totalBudget: value
        });
      } else {
        setEditedProject({
          ...editedProject,
          total_budget: value
        });
      }
      setHasUnsavedChanges(true);
    };

    const handleActualSpendChange = (value: number) => {
      if (!editedProject) return;
      if (isProject) {
        setEditedProject({
          ...editedProject,
          totalActual: value
        });
      } else {
        setEditedProject({
          ...editedProject,
          total_actual: value
        });
      }
      setHasUnsavedChanges(true);
    };

    const handleFinancialNotesChange = (value: string) => {
      if (!editedProject) return;
      if (isProject) {
        setEditedProject({
          ...editedProject,
          comments: value
        });
      } else {
        setEditedProject({
          ...editedProject,
          comments_risk: value
        });
      }
      setHasUnsavedChanges(true);
    };

    return (
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper elevation={0} sx={{ p: 3, bgcolor: 'background.default' }}>
            <Typography variant="h6" gutterBottom>
              Financial Details
            </Typography>

            {/* Budget Section */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                Budget Information
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Budget"
                    type="number"
                    value={budget || 0}
                    onChange={(e) => handleBudgetChange(parseFloat(e.target.value))}
                    disabled={!canEditBudgets}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">$</InputAdornment>,
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Actual Spend"
                    type="number"
                    value={actualSpend || 0}
                    onChange={(e) => handleActualSpendChange(parseFloat(e.target.value))}
                    disabled={!canEditBudgets}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">$</InputAdornment>,
                    }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Box sx={{ 
                    p: 2, 
                    bgcolor: 'background.paper', 
                    borderRadius: 1,
                    border: '1px solid',
                    borderColor: 'divider'
                  }}>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="textSecondary">
                          Remaining Budget
                        </Typography>
                        <Typography variant="h6" color={budget && actualSpend && (budget - actualSpend) < 0 ? 'error' : 'success'}>
                          {formatCurrency((budget || 0) - (actualSpend || 0))}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="textSecondary">
                          Budget Utilization
                        </Typography>
                        <Typography variant="h6" color={budget && actualSpend && (actualSpend / budget) > 1 ? 'error' : 'success'}>
                          {budget ? `${Math.round((actualSpend || 0) / budget * 100)}%` : '0%'}
                        </Typography>
                      </Grid>
                    </Grid>
                  </Box>
                </Grid>
              </Grid>
            </Box>

            {/* Financial Notes */}
            <Box>
              <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                Financial Notes
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={4}
                value={financialNotes || ''}
                onChange={(e) => handleFinancialNotesChange(e.target.value)}
                disabled={!canEditBudgets}
                placeholder="Add any financial notes or comments here..."
              />
            </Box>
          </Paper>
        </Grid>
      </Grid>
    );
  };

  const projectName = 'projectName' in editedProject ? editedProject.projectName : editedProject.project_name;

  if (!editedProject) {
    return null;
  }

  return (
    <>
      <Dialog
        open={isOpen}
        onClose={handleClose}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            minHeight: '80vh',
            maxHeight: '90vh'
          }
        }}
      >
        <DialogTitle sx={{ 
          borderBottom: '1px solid',
          borderColor: 'divider',
          px: 3,
          py: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <Typography variant="h6" component="div">
            Project Details
          </Typography>
          <IconButton
            edge="end"
            color="inherit"
            onClick={handleClose}
            aria-label="close"
            sx={{ ml: 2 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            aria-label="project edit tabs"
            sx={{
              px: 3,
              '& .MuiTab-root': {
                minHeight: '48px',
                textTransform: 'none',
                fontSize: '0.875rem'
              }
            }}
          >
            <Tab label="Basic Info" />
            <Tab label="Status & Milestones" />
            <Tab label="Phase Details" />
            <Tab label="Financial Details" />
          </Tabs>
        </Box>

        <DialogContent sx={{ p: 0 }}>
          <TabPanel value={activeTab} index={0}>
            {renderBasicInfoTab()}
          </TabPanel>

          <TabPanel value={activeTab} index={1}>
            {renderStatusAndMilestonesTab()}
          </TabPanel>

          <TabPanel value={activeTab} index={2}>
            <Box sx={{ mb: 3, p: 2, backgroundColor: '#F9FAFB', borderRadius: '8px' }}>
              <Typography variant="h6" sx={{ color: '#111827', mb: 1 }}>
                Overall Project Completion
              </Typography>
              <Typography variant="h4" sx={{ color: '#1e40af', fontWeight: 600 }}>
                {Math.round(overallCompletion)}%
              </Typography>
            </Box>
            {renderPhaseSection('feasibility', 'Feasibility')}
            {renderPhaseSection('planning', 'Planning')}
            {renderPhaseSection('execution', 'Execution')}
            {renderPhaseSection('close', 'Close')}
          </TabPanel>

          <TabPanel value={activeTab} index={3}>
            {renderFinancialDetailsTab()}
          </TabPanel>
        </DialogContent>

        <DialogActions sx={{ 
          p: 2, 
          borderTop: '1px solid #E5E7EB',
          gap: 2
        }}>
          <Button
            onClick={handleClose}
            variant="outlined"
            disabled={isSaving}
            sx={{ 
              color: '#6B7280',
              borderColor: '#D1D5DB',
              '&:hover': {
                borderColor: '#9CA3AF',
                backgroundColor: '#F9FAFB'
              }
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            variant="contained"
            disabled={!hasUnsavedChanges || isSaving}
            startIcon={isSaving && <CircularProgress size={16} color="inherit" />}
            sx={{ 
              backgroundColor: '#1e40af',
              '&:hover': {
                backgroundColor: '#1e3a8a'
              }
            }}
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={showConfirmDialog}
        onClose={() => setShowConfirmDialog(false)}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">
          Unsaved Changes
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            You have unsaved changes. Are you sure you want to close without saving?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setShowConfirmDialog(false)}
            sx={{ color: '#6B7280' }}
          >
            Continue Editing
          </Button>
          <Button 
            onClick={handleConfirmClose}
            variant="contained"
            color="error"
            autoFocus
          >
            Discard Changes
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={showUnsavedWarning}
        autoHideDuration={6000}
        onClose={() => setShowUnsavedWarning(false)}
      >
        <Alert 
          onClose={() => setShowUnsavedWarning(false)} 
          severity="warning"
          sx={{ width: '100%' }}
        >
          You have unsaved changes. Please save or discard them.
        </Alert>
      </Snackbar>
    </>
  );
}; 