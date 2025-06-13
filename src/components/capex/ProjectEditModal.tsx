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
import { useAdminSettings } from '../../stores/capexStore';

type ProjectStatus = 'On Track' | 'At Risk' | 'Impacted';

interface ProjectEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project | CapExRecord;
  onSave: (project: Project | CapExRecord) => void;
}

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

export const ProjectEditModal: React.FC<ProjectEditModalProps> = ({
  isOpen,
  onClose,
  project: initialProject,
  onSave,
}) => {
  const adminSettings = useAdminSettings();
  const [activeTab, setActiveTab] = useState(0);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showUnsavedWarning, setShowUnsavedWarning] = useState(false);
  const [editedProject, setEditedProject] = useState<Project | CapExRecord>(initialProject);
  const [isSaving, setIsSaving] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [overallCompletion, setOverallCompletion] = useState(0);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [calculatedStatus, setCalculatedStatus] = useState<ProjectStatus | null>(null);
  const [statusChanged, setStatusChanged] = useState(false);

  // Permission helpers
  const canEditDates = isAdmin;
  const canEditBudgets = isAdmin;
  const canEditPercentages = true; // All users can edit percentages
  const canEditComments = true; // All users can edit comments

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
    setEditedProject(initialProject);
    setHasUnsavedChanges(false);
    setActiveTab(0);
    calculateAndSetOverallCompletion(initialProject);
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
        adminSettings.onTrackThreshold,
        adminSettings.atRiskThreshold
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
      setShowConfirmDialog(true);
    } else {
      onClose();
    }
  };

  const handleConfirmClose = () => {
    setShowConfirmDialog(false);
    setHasUnsavedChanges(false);
    onClose();
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await onSave(editedProject);
      setHasUnsavedChanges(false);
      onClose();
    } catch (error) {
      console.error('Error saving project:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const updatePhaseValue = (
    phaseKey: 'feasibility' | 'planning' | 'execution' | 'close',
    subItemId: string,
    value: number
  ) => {
    setHasUnsavedChanges(true);
    
    if ('phases' in editedProject) {
      // Handle Project type
      const updatedProject = {
        ...editedProject,
        phases: {
          ...editedProject.phases,
          [phaseKey]: {
            ...editedProject.phases[phaseKey],
            subItems: editedProject.phases[phaseKey].subItems.map(item =>
              item.id === subItemId ? { ...item, value } : item
            )
          }
        }
      } as Project;

      // Recalculate phase completion using only non-N/A items
      const phase = updatedProject.phases[phaseKey];
      phase.completion = calculatePhaseCompletionExcludingNA(phase.subItems);
      
      setEditedProject(updatedProject);
      calculateAndSetOverallCompletion(updatedProject);
    } else {
      // Handle CapExRecord type
      const updatedProject = {
        ...editedProject,
        [phaseKey]: {
          ...editedProject[phaseKey],
          subItems: editedProject[phaseKey].subItems.map(item =>
            item.id === subItemId ? { ...item, target: value, actual: value } : item
          ),
          status: {
            target: value,
            actual: value
          }
        }
      } as CapExRecord;

      setEditedProject(updatedProject);
      calculateAndSetOverallCompletion(updatedProject);
    }
  };

  const renderPhaseSection = (
    phaseKey: 'feasibility' | 'planning' | 'execution' | 'close',
    phaseTitle: string
  ) => {
    if (isLoading) {
      return (
        <Box display="flex" justifyContent="center" alignItems="center" height="100%">
          <CircularProgress />
        </Box>
      );
    }

    const phase = 'phases' in editedProject 
      ? editedProject.phases[phaseKey]
      : editedProject[phaseKey];
    
    const weight = editedProject.projectType.phaseWeights[phaseKey];
    const completion = 'completion' in phase ? phase.completion : phase.status.actual;

    // Calculate phase impact on overall status
    const phaseImpact = () => {
      const maxPossibleChange = (100 - completion) * (weight / 100);
      return maxPossibleChange;
    };

    return (
      <Paper 
        elevation={0} 
        sx={{ 
          p: 3, 
          mb: 3,
          bgcolor: 'background.default',
          position: 'relative'
        }}
      >
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">
            {phaseTitle} ({weight}%)
          </Typography>
          <Box textAlign="right">
            <Typography variant="h6" color="primary">
              {completion}%
            </Typography>
            <Typography variant="caption" color="textSecondary">
              Max impact: +{Math.round(phaseImpact())}% to overall
            </Typography>
          </Box>
        </Box>

        {/* Sub-items grid */}
        <Grid container spacing={2}>
          {'subItems' in phase && phase.subItems.map((item: any) => (
            <Grid item xs={12} sm={6} key={item.id}>
              <Box
                sx={{
                  p: 2,
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 1,
                  bgcolor: item.isNA ? 'action.disabledBackground' : 'background.paper'
                }}
              >
                <Typography variant="subtitle2" gutterBottom>
                  {item.name}
                </Typography>
                <Slider
                  value={item.value}
                  onChange={(_e, value) => {
                    if (!canEditPercentages) return;
                    updatePhaseValue(phaseKey, item.id, value as number);
                  }}
                  disabled={!canEditPercentages || item.isNA}
                  valueLabelDisplay="auto"
                  marks={[
                    { value: 0, label: '0%' },
                    { value: 25, label: '25%' },
                    { value: 50, label: '50%' },
                    { value: 75, label: '75%' },
                    { value: 100, label: '100%' }
                  ]}
                  step={1}
                  min={0}
                  max={100}
                  sx={{
                    '& .MuiSlider-thumb': {
                      transition: 'left 0.2s ease-out'
                    }
                  }}
                />
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <FormControlLabel
                    control={
                      <Switch
                        size="small"
                        checked={!item.isNA}
                        onChange={(e) => {
                          if (!canEditPercentages) return;
                          const updatedItem = { ...item, isNA: !e.target.checked };
                          if (updatedItem.isNA) updatedItem.value = 0;
                          updatePhaseValue(phaseKey, item.id, updatedItem.value);
                        }}
                        disabled={!canEditPercentages}
                      />
                    }
                    label={
                      <Typography variant="caption" color="textSecondary">
                        {item.isNA ? 'N/A' : 'Active'}
                      </Typography>
                    }
                  />
                  <Typography variant="body2" color="textSecondary">
                    {item.value}%
                  </Typography>
                </Box>
              </Box>
            </Grid>
          ))}
        </Grid>

        {/* Permission indicator for non-admin users */}
        {!canEditPercentages && (
          <Box 
            sx={{ 
              position: 'absolute',
              top: 0,
              right: 0,
              p: 1
            }}
          >
            <Tooltip title="You do not have permission to edit percentages">
              <LockIcon size={16} className="text-gray-400" />
            </Tooltip>
          </Box>
        )}
      </Paper>
    );
  };

  const renderBasicInfoTab = () => {
    if (isLoading) {
      return (
        <Box display="flex" justifyContent="center" alignItems="center" height="100%">
          <CircularProgress />
        </Box>
      );
    }

    // Type-safe field mappings
    type FieldMapping = {
      projectField: string;
      recordField: string;
      type: 'string' | 'number' | 'date';
    };

    const fieldMappings: Record<string, FieldMapping> = {
      name: { projectField: 'name', recordField: 'project_name', type: 'string' },
      status: { projectField: 'status', recordField: 'project_status', type: 'string' },
      startDate: { projectField: 'startDate', recordField: 'start_date', type: 'date' },
      endDate: { projectField: 'endDate', recordField: 'end_date', type: 'date' },
      comments: { projectField: 'comments', recordField: 'project_comments', type: 'string' },
    };

    // Helper to safely get values based on project type
    const getValue = (field: keyof typeof fieldMappings) => {
      const mapping = fieldMappings[field];
      const value = 'phases' in editedProject
        ? (editedProject as any)[mapping.projectField]
        : (editedProject as any)[mapping.recordField];
      
      return value;
    };

    // Helper to safely set values based on project type
    const setValue = (field: keyof typeof fieldMappings, value: any) => {
      const mapping = fieldMappings[field];
      setHasUnsavedChanges(true);
      
      if ('phases' in editedProject) {
        setEditedProject({
          ...editedProject,
          [mapping.projectField]: value
        } as Project);
      } else {
        setEditedProject({
          ...editedProject,
          [mapping.recordField]: value
        } as CapExRecord);
      }
    };

    // Get status color based on current status
    const getStatusColor = (status: ProjectStatus) => {
      switch (status) {
        case 'On Track':
          return 'success.main';
        case 'At Risk':
          return 'warning.main';
        case 'Impacted':
          return 'error.main';
        default:
          return 'text.secondary';
      }
    };

    return (
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Typography variant="subtitle2" color="textSecondary" sx={{ mb: 1 }}>
            {isAdmin ? 'Admin Mode' : 'Project Owner Mode'}
          </Typography>
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Project Name"
            value={getValue('name')}
            onChange={(e) => setValue('name', e.target.value)}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <FormControl fullWidth>
            <InputLabel>Status</InputLabel>
            <Select
              value={getValue('status')}
              label="Status"
              onChange={(e) => setValue('status', e.target.value)}
            >
              <MenuItem value="On Track">On Track</MenuItem>
              <MenuItem value="At Risk">At Risk</MenuItem>
              <MenuItem value="Impacted">Impacted</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        {/* Status Calculation Info */}
        <Grid item xs={12}>
          <Box sx={{ 
            p: 2, 
            bgcolor: 'background.paper', 
            borderRadius: 1, 
            border: '1px solid',
            borderColor: 'divider'
          }}>
            <Typography variant="h6" gutterBottom>
              Auto-Calculated Status
            </Typography>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={6}>
                <Typography variant="body2" color="textSecondary">
                  Current Completion: {Math.round(overallCompletion)}%
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Status Thresholds: On Track ≥{Math.round(adminSettings.onTrackThreshold * 100)}%, 
                  At Risk ≥{Math.round(adminSettings.atRiskThreshold * 100)}%
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Box display="flex" alignItems="center" gap={1}>
                  <Typography 
                    variant="h6" 
                    color={getStatusColor(calculatedStatus || 'On Track')}
                  >
                    {calculatedStatus || 'Calculating...'}
                  </Typography>
                  {statusChanged && (
                    <Chip
                      label="Updated"
                      color="info"
                      size="small"
                      sx={{ ml: 1 }}
                    />
                  )}
                </Box>
              </Grid>
            </Grid>
          </Box>
        </Grid>

        <Grid item xs={12} sm={6}>
          <Tooltip 
            title={!canEditDates ? "Only administrators can edit dates" : ""}
            placement="top"
          >
            <Box>
              <TextField
                fullWidth
                label="Start Date"
                type="date"
                value={new Date(getValue('startDate')).toISOString().split('T')[0]}
                disabled={!canEditDates}
                InputProps={{
                  endAdornment: !canEditDates && (
                    <InputAdornment position="end">
                      <LockIcon size={16} />
                    </InputAdornment>
                  )
                }}
                onChange={(e) => {
                  if (!canEditDates) return;
                  setValue('startDate', new Date(e.target.value));
                }}
                sx={{
                  '& .Mui-disabled': {
                    backgroundColor: 'action.disabledBackground',
                    cursor: 'not-allowed'
                  }
                }}
              />
            </Box>
          </Tooltip>
        </Grid>

        <Grid item xs={12} sm={6}>
          <Tooltip 
            title={!canEditDates ? "Only administrators can edit dates" : ""}
            placement="top"
          >
            <Box>
              <TextField
                fullWidth
                label="End Date"
                type="date"
                value={new Date(getValue('endDate')).toISOString().split('T')[0]}
                disabled={!canEditDates}
                InputProps={{
                  endAdornment: !canEditDates && (
                    <InputAdornment position="end">
                      <LockIcon size={16} />
                    </InputAdornment>
                  )
                }}
                onChange={(e) => {
                  if (!canEditDates) return;
                  setValue('endDate', new Date(e.target.value));
                }}
                sx={{
                  '& .Mui-disabled': {
                    backgroundColor: 'action.disabledBackground',
                    cursor: 'not-allowed'
                  }
                }}
              />
            </Box>
          </Tooltip>
        </Grid>

        {/* Comments section - Available to all users */}
        <Grid item xs={12}>
          <Divider sx={{ my: 2 }}>
            <Typography variant="subtitle2" color="textSecondary">
              Comments
            </Typography>
          </Divider>
        </Grid>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Comments"
            multiline
            rows={4}
            value={getValue('comments')}
            onChange={(e) => setValue('comments', e.target.value)}
          />
        </Grid>
      </Grid>
    );
  };

  const renderStatusAndMilestonesTab = () => {
    const isProject = 'projectName' in editedProject;
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

            {/* Threshold Information */}
            <Box>
              <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                Status Thresholds
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
                    <Typography variant="body2" color="success.main">
                      On Track: ≥{Math.round(adminSettings.onTrackThreshold * 100)}%
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="warning.main">
                      At Risk: ≥{Math.round(adminSettings.atRiskThreshold * 100)}%
                    </Typography>
                  </Grid>
                </Grid>
                {isAdmin && (
                  <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
                    Thresholds can be configured in Admin Settings
                  </Typography>
                )}
              </Box>
            </Box>
          </Paper>
        </Grid>

        {/* Milestone Section */}
        <Grid item xs={12}>
          <Paper elevation={0} sx={{ p: 3, bgcolor: 'background.default' }}>
            <Typography variant="h6" gutterBottom>
              Milestones & Comments
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Upcoming Milestone"
                  value={milestone || ''}
                  onChange={(e) => {
                    setHasUnsavedChanges(true);
                    if (isProject) {
                      setEditedProject({
                        ...editedProject as Project,
                        comments: e.target.value
                      });
                    } else {
                      setEditedProject({
                        ...editedProject as CapExRecord,
                        upcoming_milestone: e.target.value
                      });
                    }
                  }}
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Risk Comments"
                  multiline
                  rows={4}
                  value={comments || ''}
                  onChange={(e) => {
                    setHasUnsavedChanges(true);
                    if (isProject) {
                      setEditedProject({
                        ...editedProject as Project,
                        comments: e.target.value
                      });
                    } else {
                      setEditedProject({
                        ...editedProject as CapExRecord,
                        comments_risk: e.target.value
                      });
                    }
                  }}
                />
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Last Updated */}
        <Grid item xs={12}>
          <Typography variant="caption" color="textSecondary">
            Last Updated: {new Date(lastUpdated).toLocaleString()}
          </Typography>
        </Grid>
      </Grid>
    );
  };

  const renderFinancialDetailsTab = () => {
    if (isLoading) {
      return (
        <Box display="flex" justifyContent="center" alignItems="center" height="100%">
          <CircularProgress />
        </Box>
      );
    }

    if (!canEditBudgets) {
      return (
        <Box p={3} textAlign="center">
          <LockIcon size={48} className="text-gray-400 mb-4" />
          <Typography variant="h6" color="textSecondary" gutterBottom>
            Financial Details Restricted
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Only administrators can view and edit financial details.
            Please contact your administrator for access.
          </Typography>
        </Box>
      );
    }

    const isProject = 'projectName' in editedProject;
    const budget = isProject ? editedProject.totalBudget : editedProject.total_budget;
    const actual = isProject ? editedProject.totalActual : editedProject.total_actual;
    const spentPercentage = (actual / budget) * 100;

    return (
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper elevation={0} sx={{ p: 3, border: '1px solid #E5E7EB', borderRadius: '12px' }}>
            <Typography variant="h6" gutterBottom>
              Budget Overview
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Total Budget
                </Typography>
                <Typography variant="h5" color="text.primary">
                  {formatCurrency(budget)}
                </Typography>
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Total Actual
                </Typography>
                <Typography variant="h5" color={actual > budget ? 'error.main' : 'text.primary'}>
                  {formatCurrency(actual)}
                </Typography>
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Spent Percentage
                </Typography>
                <Typography 
                  variant="h5" 
                  color={spentPercentage > 100 ? 'error.main' : 'text.primary'}
                >
                  {Math.round(spentPercentage)}%
                </Typography>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
        <Grid item xs={12}>
          <Paper 
            elevation={0} 
            sx={{ 
              p: 3, 
              border: '1px solid #E5E7EB', 
              borderRadius: '12px',
              backgroundColor: '#F9FAFB'
            }}
          >
            <Typography variant="subtitle2" color="text.secondary">
              Quarterly Breakdown
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Coming in future update
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    );
  };

  const projectName = 'projectName' in editedProject ? editedProject.projectName : editedProject.project_name;

  return (
    <>
      <Dialog
        open={isOpen}
        onClose={handleClose}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '12px',
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