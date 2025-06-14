import React, { useState, useEffect } from 'react';
import { useCapExStore } from '../../stores/capexStore';
import { Project } from './data/capexData';
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
  Alert
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
  const updateProject = useCapExStore(state => state.actions.updateProject);
  const closeProjectModal = useCapExStore(state => state.actions.closeProjectModal);
  const [activeTab, setActiveTab] = useState(0);
  const [editedProject, setEditedProject] = useState<Project | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (modalState.data) {
      setEditedProject(modalState.data);
      setHasUnsavedChanges(false);
      setValidationErrors({});
    }
  }, [modalState.data]);

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

  const handleSave = async () => {
    if (!editedProject || !validateForm()) {
      return;
    }
    
    setIsSaving(true);
    try {
      await updateProject(editedProject.id, {
        projectName: editedProject.projectName,
        projectOwner: editedProject.projectOwner,
        projectStatus: editedProject.projectStatus,
        startDate: editedProject.startDate,
        endDate: editedProject.endDate,
        totalBudget: editedProject.totalBudget,
        totalActual: editedProject.totalActual,
        projectType: editedProject.projectType,
        phases: editedProject.phases
      });
      setHasUnsavedChanges(false);
      closeProjectModal();
    } catch (error) {
      console.error('Error saving project:', error);
    } finally {
      setIsSaving(false);
    }
  };

  if (!editedProject || !modalState.isOpen) {
    return null;
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
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          minHeight: '80vh',
          maxHeight: '90vh'
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
            <Typography color="text.secondary">
              Phase progress tracking and milestone management will be implemented here.
            </Typography>
          </Box>
        </TabPanel>
        <TabPanel value={activeTab} index={2}>
          <Box sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Financial Details
            </Typography>
            <Typography color="text.secondary">
              Budget tracking and financial reporting will be implemented here.
            </Typography>
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