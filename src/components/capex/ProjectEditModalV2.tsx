import React, { useState } from 'react';
import { useCapExStore } from './stores/capexStore';
import { Project } from './data/capexData';
import { CapExRecord } from '../../types/capex';
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
  Tab
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
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
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
  const { modals, setModalState } = useCapExStore();
  const { isOpen, data: initialProject } = modals.projectForm;
  const [activeTab, setActiveTab] = useState(0);
  const [editedProject, setEditedProject] = useState<Project | CapExRecord | null>(null);

  // Initialize edited project when modal opens
  React.useEffect(() => {
    if (initialProject) {
      setEditedProject(initialProject);
    }
  }, [initialProject]);

  const handleClose = () => {
    setModalState('projectForm', { isOpen: false, data: null });
    setEditedProject(null);
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  if (!editedProject) {
    return null;
  }

  const renderBasicInfoTab = () => {
    const projectName = 'phases' in editedProject 
      ? editedProject.projectName 
      : editedProject.project_name;

    return (
      <Box sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          Basic Information
        </Typography>
        <TextField
          fullWidth
          label="Project Name"
          value={projectName}
          margin="normal"
        />
      </Box>
    );
  };

  return (
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
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">
            Edit Project
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
          <Typography>Status & Milestones content coming soon...</Typography>
        </TabPanel>
        <TabPanel value={activeTab} index={2}>
          <Typography>Financial Details content coming soon...</Typography>
        </TabPanel>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button variant="contained" color="primary">
          Save Changes
        </Button>
      </DialogActions>
    </Dialog>
  );
}; 