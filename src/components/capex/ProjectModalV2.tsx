import React, { useState, useEffect } from 'react';
import { useCapExStore } from '../../stores/capexStore';
import { Project, PROJECT_TYPES, calculatePhaseCompletion, calculateOverallCompletion } from './data/capexData';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  IconButton,
  Tabs,
  Tab,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Slider,
  Switch,
  FormControlLabel,
  InputAdornment,
  Card,
  Grid
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

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
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `simple-tab-${index}`,
    'aria-controls': `simple-tabpanel-${index}`,
  };
}

export const ProjectEditModalV2: React.FC = () => {
  const modalState = useCapExStore(state => state.modalState);
  const actions = useCapExStore(state => state.actions);
  const closeProjectModal = useCapExStore(state => state.actions.closeProjectModal);
  const [activeTab, setActiveTab] = useState(0);
  const [editedProject, setEditedProject] = useState<Project | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    console.log('ProjectModalV2 useEffect - modalState:', modalState);
    console.log('ProjectModalV2 useEffect - modalState.data:', modalState.data);
    
    if (modalState.data === 'admin') {
      console.log('Admin modal detected - ignoring in ProjectModalV2');
      return;
    }
    
    if (modalState.isOpen && modalState.data && typeof modalState.data === 'object') {
      console.log('Setting editedProject to:', modalState.data);
      setEditedProject(modalState.data);
      setHasUnsavedChanges(false);
      setValidationErrors({});
      setActiveTab(0); // Reset to first tab
    } else if (!modalState.isOpen) {
      // Clear state when modal closes
      setEditedProject(null);
      setHasUnsavedChanges(false);
      setValidationErrors({});
    }
  }, [modalState.isOpen, modalState.data]);

  const handleClose = () => {
    if (hasUnsavedChanges) {
      if (!confirm('You have unsaved changes. Are you sure you want to close?')) {
        return;
      }
    }
    closeProjectModal();
    setEditedProject(null);
    setHasUnsavedChanges(false);
    setValidationErrors({});
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const updateField = (field: keyof Project, value: any) => {
    if (!editedProject) return;
    
    setEditedProject({
      ...editedProject,
      [field]: value
    });
    setHasUnsavedChanges(true);
    
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    if (!editedProject) return false;
    
    const errors: Record<string, string> = {};
    
    if (!editedProject.projectName?.trim()) {
      errors.projectName = 'Project name is required';
    }
    
    if (!editedProject.projectOwner?.trim()) {
      errors.projectOwner = 'Project owner is required';
    }
    
    if (editedProject.projectName && editedProject.projectName.length > 100) {
      errors.projectName = 'Project name must be less than 100 characters';
    }
    
    if (editedProject.projectOwner && editedProject.projectOwner.length > 50) {
      errors.projectOwner = 'Project owner name must be less than 50 characters';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const recalculateCompletion = (updatedPhases: any) => {
    // Update individual phase completion percentages
    const feasibilityCompletion = calculatePhaseCompletion(updatedPhases.feasibility);
    const planningCompletion = calculatePhaseCompletion(updatedPhases.planning);
    const executionCompletion = calculatePhaseCompletion(updatedPhases.execution);
    const closeCompletion = calculatePhaseCompletion(updatedPhases.close);

    // Update the phases with new completion percentages
    const phasesWithCompletion = {
      ...updatedPhases,
      feasibility: { ...updatedPhases.feasibility, completion: feasibilityCompletion },
      planning: { ...updatedPhases.planning, completion: planningCompletion },
      execution: { ...updatedPhases.execution, completion: executionCompletion },
      close: { ...updatedPhases.close, completion: closeCompletion }
    };

    return phasesWithCompletion;
  };

  const handleSave = async () => {
    try {
      console.log('🔍 About to call store updateProject directly');
      // Call store function directly
      const store = useCapExStore.getState();
      await store.actions.updateProject(editedProject);
      console.log('✅ Store updateProject completed');
      // ... rest of save logic (e.g., close modal, setHasUnsavedChanges(false), etc.)
      setHasUnsavedChanges(false);
      closeProjectModal();
    } catch (error) {
      console.error('Save error:', error);
    }
  };

  const getDisplayWeight = (phaseName: string) => {
    const projectType = editedProject?.projectType || editedProject?.project_type;
    const store = useCapExStore.getState();
    const weights = store.actions.getPhaseWeights(projectType);
    return weights[phaseName] || 0;
  };

  const handleFieldChange = (field: string, value: any) => {
    setEditedProject(prev => ({
      ...prev,
      [field]: value
    }));
    setHasUnsavedChanges(true);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount || 0);
  };

  const budget = editedProject?.totalBudget || editedProject?.total_budget || 0;
  const actualSpend = editedProject?.totalActual || editedProject?.total_actual || 0;
  const remainingBudget = budget - actualSpend;

  // Don't render anything when admin modal is open
  if (modalState.data === 'admin') {
    return null;
  }

  if (!modalState.isOpen) {
    return null;
  }

  if (!editedProject) {
    return (
      <Dialog open={modalState.isOpen} onClose={handleClose}>
        <DialogContent>
          <Typography>Loading project data...</Typography>
        </DialogContent>
      </Dialog>
    );
  }

  const renderBasicInfoTab = () => {
    return (
      <Box sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          Basic Information
        </Typography>
        
        {Object.keys(validationErrors).length > 0 && (
          <Alert severity="error" sx={{ mb: 2 }}>
            Please fix the validation errors below
          </Alert>
        )}
        
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <TextField
            fullWidth
            label="Project Name"
            value={editedProject.projectName || ''}
            onChange={(e) => updateField('projectName', e.target.value)}
            error={!!validationErrors.projectName}
            helperText={validationErrors.projectName}
            required
            variant="outlined"
            inputProps={{ maxLength: 100 }}
          />

          <TextField
            fullWidth
            label="Project Owner"
            value={editedProject.projectOwner || ''}
            onChange={(e) => updateField('projectOwner', e.target.value)}
            error={!!validationErrors.projectOwner}
            helperText={validationErrors.projectOwner}
            required
            variant="outlined"
            inputProps={{ maxLength: 50 }}
            placeholder="Enter name or email"
          />

          <FormControl fullWidth>
            <InputLabel>Project Status</InputLabel>
            <Select
              value={editedProject.projectStatus || 'On Track'}
              label="Project Status"
              disabled={true}
              sx={{ 
                '& .MuiSelect-select.Mui-disabled': {
                  backgroundColor: '#f5f5f5',
                  color: '#666'
                }
              }}
            >
              <MenuItem value="On Track">On Track</MenuItem>
              <MenuItem value="At Risk">At Risk</MenuItem>
              <MenuItem value="Impacted">Impacted</MenuItem>
            </Select>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
              Status is automatically calculated based on completion percentages and admin thresholds
            </Typography>
          </FormControl>

          <Box sx={{ mt: 2, p: 2, backgroundColor: '#f9f9f9', borderRadius: 1 }}>
            <Typography variant="subtitle2" gutterBottom>
              Project Overview
            </Typography>
            <Typography variant="body2" color="text.secondary">
              <strong>Project Dates:</strong> {' '}
              {editedProject.startDate ? new Date(editedProject.startDate).toLocaleDateString() : 'Not set'} - {' '}
              {editedProject.endDate ? new Date(editedProject.endDate).toLocaleDateString() : 'Not set'}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              <strong>Budget:</strong> ${editedProject.totalBudget?.toLocaleString() || '0'} | {' '}
              <strong>Spent:</strong> ${editedProject.totalActual?.toLocaleString() || '0'}
            </Typography>
          </Box>
        </Box>
      </Box>
    );
  };

  return (
    <Dialog
      open={modalState.isOpen}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          minHeight: '80vh',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column'
        }
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">
            Edit Project: {editedProject.projectName || 'Untitled Project'}
          </Typography>
          <IconButton onClick={handleClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={activeTab} onChange={handleTabChange}>
            <Tab label="Basic Info" {...a11yProps(0)} />
            <Tab label="Status & Milestones" {...a11yProps(1)} />
            <Tab label="Financial Details" {...a11yProps(2)} />
          </Tabs>
        </Box>
        
        <TabPanel value={activeTab} index={0}>
          {renderBasicInfoTab()}
        </TabPanel>
        <TabPanel value={activeTab} index={1}>
          <Box sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Status & Milestones
            </Typography>
            
            {/* Feasibility Phase */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" sx={{ mb: 2, color: 'primary.main' }}>
                Feasibility Phase ({getDisplayWeight('feasibility')}% weight)
              </Typography>
              {Object.entries(editedProject.phases.feasibility.subItems).map(([key, subItem]) => (
                <Box key={key} sx={{ mb: 2 }}>
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
                                feasibility: {
                                  ...editedProject.phases.feasibility,
                                  subItems: {
                                    ...editedProject.phases.feasibility.subItems,
                                    [key]: { ...subItem, isNA: e.target.checked, value: e.target.checked ? 0 : subItem.value }
                                  }
                                }
                              };
                              updateField('phases', updatedPhases);
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
                        feasibility: {
                          ...editedProject.phases.feasibility,
                          subItems: {
                            ...editedProject.phases.feasibility.subItems,
                            [key]: { ...subItem, value: newValue as number }
                          }
                        }
                      };
                      const finalPhases = recalculateCompletion(updatedPhases);
                      updateField('phases', finalPhases);
                    }}
                    disabled={subItem.isNA}
                    min={0}
                    max={100}
                    step={1}
                    marks={[
                      { value: 0, label: '0%' },
                      { value: 50, label: '50%' },
                      { value: 100, label: '100%' }
                    ]}
                    valueLabelDisplay="auto"
                    valueLabelFormat={(value) => `${value}%`}
                  />
                </Box>
              ))}
            </Box>

            {/* Planning Phase */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" sx={{ mb: 2, color: 'primary.main' }}>
                Planning Phase ({getDisplayWeight('planning')}% weight)
              </Typography>
              {Object.entries(editedProject.phases.planning.subItems).map(([key, subItem]) => (
                <Box key={key} sx={{ mb: 2 }}>
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
                                planning: {
                                  ...editedProject.phases.planning,
                                  subItems: {
                                    ...editedProject.phases.planning.subItems,
                                    [key]: { ...subItem, isNA: e.target.checked, value: e.target.checked ? 0 : subItem.value }
                                  }
                                }
                              };
                              updateField('phases', updatedPhases);
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
                        planning: {
                          ...editedProject.phases.planning,
                          subItems: {
                            ...editedProject.phases.planning.subItems,
                            [key]: { ...subItem, value: newValue as number }
                          }
                        }
                      };
                      const finalPhases = recalculateCompletion(updatedPhases);
                      updateField('phases', finalPhases);
                    }}
                    disabled={subItem.isNA}
                    min={0}
                    max={100}
                    step={1}
                    marks={[
                      { value: 0, label: '0%' },
                      { value: 50, label: '50%' },
                      { value: 100, label: '100%' }
                    ]}
                    valueLabelDisplay="auto"
                    valueLabelFormat={(value) => `${value}%`}
                  />
                </Box>
              ))}
            </Box>

            {/* Execution Phase */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" sx={{ mb: 2, color: 'primary.main' }}>
                Execution Phase ({getDisplayWeight('execution')}% weight)
              </Typography>
              {Object.entries(editedProject.phases.execution.subItems).map(([key, subItem]) => (
                <Box key={key} sx={{ mb: 2 }}>
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
                                execution: {
                                  ...editedProject.phases.execution,
                                  subItems: {
                                    ...editedProject.phases.execution.subItems,
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
                        execution: {
                          ...editedProject.phases.execution,
                          subItems: {
                            ...editedProject.phases.execution.subItems,
                            [key]: { ...subItem, value: newValue as number }
                          }
                        }
                      };
                      const finalPhases = recalculateCompletion(updatedPhases);
                      updateField('phases', finalPhases);
                    }}
                    disabled={subItem.isNA}
                    min={0}
                    max={100}
                    step={1}
                    marks={[
                      { value: 0, label: '0%' },
                      { value: 50, label: '50%' },
                      { value: 100, label: '100%' }
                    ]}
                    valueLabelDisplay="auto"
                    valueLabelFormat={(value) => `${value}%`}
                  />
                </Box>
              ))}
            </Box>

            {/* Close Phase */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" sx={{ mb: 2, color: 'primary.main' }}>
                Close Phase ({getDisplayWeight('close')}% weight)
              </Typography>
              {Object.entries(editedProject.phases.close.subItems).map(([key, subItem]) => (
                <Box key={key} sx={{ mb: 2 }}>
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
                                close: {
                                  ...editedProject.phases.close,
                                  subItems: {
                                    ...editedProject.phases.close.subItems,
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
                        close: {
                          ...editedProject.phases.close,
                          subItems: {
                            ...editedProject.phases.close.subItems,
                            [key]: { ...subItem, value: newValue as number }
                          }
                        }
                      };
                      const finalPhases = recalculateCompletion(updatedPhases);
                      updateField('phases', finalPhases);
                    }}
                    disabled={subItem.isNA}
                    min={0}
                    max={100}
                    step={1}
                    marks={[
                      { value: 0, label: '0%' },
                      { value: 50, label: '50%' },
                      { value: 100, label: '100%' }
                    ]}
                    valueLabelDisplay="auto"
                    valueLabelFormat={(value) => `${value}%`}
                  />
                </Box>
              ))}
            </Box>
          </Box>
        </TabPanel>
        <TabPanel value={activeTab} index={2}>
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Project Identification
            </Typography>
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="SES Asset Number"
                  value={editedProject?.sesNumber || editedProject?.ses_number || ''}
                  onChange={(e) => handleFieldChange('sesNumber', e.target.value)}
                  placeholder="Enter SES Asset Number"
                  helperText="Internal asset tracking number"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Upcoming Milestone"
                  value={editedProject?.upcomingMilestone || editedProject?.upcoming_milestone || ''}
                  onChange={(e) => handleFieldChange('upcomingMilestone', e.target.value)}
                  placeholder="Next major milestone"
                  helperText="Next key deliverable"
                />
              </Grid>
            </Grid>
            <Typography variant="h6" gutterBottom>
              Budget Overview
            </Typography>
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Total Budget"
                  type="number"
                  value={budget || 0}
                  onChange={(e) => handleFieldChange('totalBudget', parseFloat(e.target.value) || 0)}
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
                  onChange={(e) => handleFieldChange('totalActual', parseFloat(e.target.value) || 0)}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">$</InputAdornment>,
                  }}
                />
              </Grid>
            </Grid>
            <Card sx={{ p: 2, mb: 3, bgcolor: remainingBudget < 0 ? 'error.light' : 'success.light' }}>
              <Typography variant="h6">
                Remaining Budget: {formatCurrency(remainingBudget)}
              </Typography>
              <Typography variant="body2">
                Budget Utilization: {budget ? Math.round((actualSpend / budget) * 100) : 0}%
              </Typography>
            </Card>
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Financial Notes"
              value={editedProject?.financialNotes || editedProject?.comments || ''}
              onChange={(e) => handleFieldChange('financialNotes', e.target.value)}
              placeholder="Budget justifications, concerns, or notes..."
            />
          </Box>
        </TabPanel>
      </DialogContent>
      
      <DialogActions sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
        <Button onClick={handleClose} variant="outlined">
          Cancel
        </Button>
        <Button 
          onClick={handleSave} 
          variant="contained" 
          color="primary"
          disabled={isSaving || !hasUnsavedChanges || Object.keys(validationErrors).length > 0}
        >
          {isSaving ? 'Saving...' : 'Save Changes'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}; 