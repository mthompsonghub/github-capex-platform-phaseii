import React, { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Select, MenuItem, FormControl, InputLabel, Box, IconButton, Tabs, Tab } from '@mui/material';
import { X } from 'lucide-react';
import { useCapExStore } from '../../stores/capexStore';
import { Project, PROJECT_TYPES } from './data/capexData';

const PROJECT_STATUS_OPTIONS = [
  { value: 'On Track', label: 'On Track' },
  { value: 'At Risk', label: 'At Risk' },
  { value: 'Impacted', label: 'Impacted' }
] as const;

type ProjectStatus = typeof PROJECT_STATUS_OPTIONS[number]['value'];

export const ProjectModalV2: React.FC = () => {
  const { modals, actions } = useCapExStore();
  const { editProject } = modals;
  console.log('ProjectModalV2: editProject.isOpen:', editProject.isOpen, 'editProject.data:', editProject.data);
  const { updateProject, closeProjectModal } = actions;

  const [formData, setFormData] = useState<Partial<Project>>({
    projectName: '',
    projectType: PROJECT_TYPES.PROJECTS,
    projectOwner: '',
    projectStatus: 'On Track' as ProjectStatus,
    comments: ''
  });

  const [tab, setTab] = useState(0);

  useEffect(() => {
    if (editProject.data) {
      setFormData({
        projectName: editProject.data.projectName,
        projectType: editProject.data.projectType,
        projectOwner: editProject.data.projectOwner,
        projectStatus: editProject.data.projectStatus,
        comments: editProject.data.comments || ''
      });
    }
  }, [editProject.data]);

  const handleInputChange = (field: keyof Project, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = () => {
    if (!editProject.data?.id) return;

    updateProject(editProject.data.id, {
      ...formData,
      projectName: formData.projectName || '',
      projectOwner: formData.projectOwner || '',
      projectType: formData.projectType || PROJECT_TYPES.PROJECTS,
      projectStatus: formData.projectStatus || 'On Track',
      comments: formData.comments
    });

    closeProjectModal();
  };

  if (!editProject.isOpen) return null;

  const project = editProject.data;

  return (
    <Dialog 
      open={editProject.isOpen} 
      onClose={closeProjectModal}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)'
        }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        borderBottom: '1px solid #e5e7eb',
        padding: '16px 24px'
      }}>
        <span className="text-lg font-semibold text-gray-900">
          {project ? project.projectName : 'Project Details'}
        </span>
        <IconButton 
          onClick={closeProjectModal}
          size="small"
          sx={{ 
            color: 'gray.500',
            '&:hover': { color: 'gray.700' }
          }}
        >
          <X className="w-5 h-5" />
        </IconButton>
      </DialogTitle>

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ px: 3, pt: 2 }}>
        <Tab label="Basic Info" />
        <Tab label="Status & Milestones" />
        <Tab label="Financial Details" />
      </Tabs>

      <DialogContent sx={{ padding: '24px' }}>
        {tab === 0 && project && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box><strong>Project Name:</strong> {project.projectName}</Box>
            <Box><strong>Project Type:</strong> {project.projectType?.name || project.projectType?.id}</Box>
            <Box><strong>Project Owner:</strong> {project.projectOwner}</Box>
            <Box><strong>Status:</strong> {project.projectStatus}</Box>
            <Box><strong>Comments:</strong> {project.comments}</Box>
            <Box><strong>Start Date:</strong> {project.startDate?.toLocaleDateString?.() || ''}</Box>
            <Box><strong>End Date:</strong> {project.endDate?.toLocaleDateString?.() || ''}</Box>
          </Box>
        )}
        {tab === 1 && project && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {/* <Box><strong>Upcoming Milestone:</strong> {project.upcoming_milestone || 'N/A'}</Box> */}
            <Box><strong>Overall Completion:</strong> {project.phases ? `${project.phases.feasibility.completion}% Feasibility, ${project.phases.planning.completion}% Planning, ${project.phases.execution.completion}% Execution, ${project.phases.close.completion}% Close` : 'N/A'}</Box>
            {/* Add more milestone/status info as needed */}
          </Box>
        )}
        {tab === 2 && project && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box><strong>Total Budget:</strong> ${project.totalBudget?.toLocaleString?.() || 'N/A'}</Box>
            <Box><strong>Total Actual:</strong> ${project.totalActual?.toLocaleString?.() || 'N/A'}</Box>
            {/* Add more financial details as needed */}
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ 
        padding: '16px 24px',
        borderTop: '1px solid #e5e7eb'
      }}>
        <Button 
          onClick={closeProjectModal}
          sx={{ 
            color: 'gray.600',
            '&:hover': { backgroundColor: 'gray.100' }
          }}
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}; 