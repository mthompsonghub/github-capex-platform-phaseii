import React, { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Select, MenuItem, FormControl, InputLabel, Box, IconButton } from '@mui/material';
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
  const { updateProject, closeProjectModal } = actions;

  const [formData, setFormData] = useState<Partial<Project>>({
    projectName: '',
    projectType: PROJECT_TYPES.PROJECTS,
    projectOwner: '',
    projectStatus: 'On Track' as ProjectStatus,
    comments: ''
  });

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
          {editProject.data ? 'Edit Project' : 'New Project'}
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

      <DialogContent sx={{ padding: '24px' }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <TextField
            label="Project Name"
            value={formData.projectName}
            onChange={(e) => handleInputChange('projectName', e.target.value)}
            fullWidth
            required
          />

          <FormControl fullWidth>
            <InputLabel>Project Type</InputLabel>
            <Select
              value={formData.projectType?.id || 'projects'}
              onChange={(e) => handleInputChange('projectType', 
                e.target.value === 'projects' ? PROJECT_TYPES.PROJECTS : PROJECT_TYPES.ASSET_PURCHASES
              )}
              label="Project Type"
            >
              <MenuItem value="projects">Project</MenuItem>
              <MenuItem value="asset_purchases">Asset Purchase</MenuItem>
            </Select>
          </FormControl>

          <TextField
            label="Project Owner"
            value={formData.projectOwner}
            onChange={(e) => handleInputChange('projectOwner', e.target.value)}
            fullWidth
            required
          />

          <FormControl fullWidth>
            <InputLabel>Status</InputLabel>
            <Select
              value={formData.projectStatus || 'On Track'}
              onChange={(e) => handleInputChange('projectStatus', e.target.value)}
              label="Status"
            >
              {PROJECT_STATUS_OPTIONS.map(option => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            label="Comments"
            value={formData.comments || ''}
            onChange={(e) => handleInputChange('comments', e.target.value)}
            fullWidth
            multiline
            rows={4}
          />
        </Box>
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
          Cancel
        </Button>
        <Button 
          onClick={handleSave}
          variant="contained"
          sx={{ 
            backgroundColor: '#1e40af',
            '&:hover': { backgroundColor: '#1e3a8a' }
          }}
        >
          Save Changes
        </Button>
      </DialogActions>
    </Dialog>
  );
}; 