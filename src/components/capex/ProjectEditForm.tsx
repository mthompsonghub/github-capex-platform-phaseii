import React, { useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  Tab,
  Tabs,
  TextField,
  Typography,
  Slider,
  Switch,
  FormControlLabel
} from '@mui/material';
import { CapExRecord, Phase, SubItem } from '../../types/capex';

interface ProjectEditFormProps {
  project: CapExRecord;
  onSave: (updatedProject: CapExRecord) => void;
  onClose: () => void;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel = (props: TabPanelProps) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`project-edit-tabpanel-${index}`}
      aria-labelledby={`project-edit-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
};

const PhaseEditPanel: React.FC<{
  phase: Phase;
  phaseWeight: number;
  onPhaseChange: (updatedPhase: Phase) => void;
  onWeightChange: (weight: number) => void;
}> = ({ phase, phaseWeight, onPhaseChange, onWeightChange }) => {
  const handleSubItemChange = (subItem: SubItem, index: number) => {
    const updatedSubItems = [...phase.subItems];
    updatedSubItems[index] = subItem;
    onPhaseChange({ ...phase, subItems: updatedSubItems });
  };

  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="subtitle1" gutterBottom>Phase Weight</Typography>
      <Slider
        value={phaseWeight}
        onChange={(_, value) => onWeightChange(value as number)}
        min={0}
        max={100}
        valueLabelDisplay="auto"
        sx={{ mb: 4 }}
      />

      {phase.subItems.map((subItem, index) => (
        <Box key={subItem.id} sx={{ mb: 3 }}>
          <Typography variant="subtitle2">{subItem.name}</Typography>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={3}>
              <TextField
                label="Weight"
                type="number"
                value={subItem.weight}
                onChange={(e) => handleSubItemChange(
                  { ...subItem, weight: Number(e.target.value) },
                  index
                )}
                fullWidth
                size="small"
                InputProps={{ inputProps: { min: 0, max: 100 } }}
              />
            </Grid>
            <Grid item xs={3}>
              <TextField
                label="Target"
                type="number"
                value={subItem.target}
                onChange={(e) => handleSubItemChange(
                  { ...subItem, target: Number(e.target.value) },
                  index
                )}
                fullWidth
                size="small"
                InputProps={{ inputProps: { min: 0, max: 100 } }}
              />
            </Grid>
            <Grid item xs={3}>
              <TextField
                label="Actual"
                type="number"
                value={subItem.actual}
                onChange={(e) => handleSubItemChange(
                  { ...subItem, actual: Number(e.target.value) },
                  index
                )}
                fullWidth
                size="small"
                InputProps={{ inputProps: { min: 0, max: 100 } }}
                disabled={subItem.isNA}
              />
            </Grid>
            <Grid item xs={3}>
              <FormControlLabel
                control={
                  <Switch
                    checked={subItem.isNA}
                    onChange={(e) => handleSubItemChange(
                      { ...subItem, isNA: e.target.checked },
                      index
                    )}
                  />
                }
                label="N/A"
              />
            </Grid>
          </Grid>
        </Box>
      ))}
    </Box>
  );
};

export const ProjectEditForm: React.FC<ProjectEditFormProps> = ({
  project,
  onSave,
  onClose
}) => {
  const [currentTab, setCurrentTab] = useState(0);
  const [editedProject, setEditedProject] = useState<CapExRecord>({ ...project });

  const handlePhaseChange = (phaseName: keyof typeof editedProject.projectType.phaseWeights, updatedPhase: Phase) => {
    setEditedProject({
      ...editedProject,
      [phaseName]: updatedPhase
    });
  };

  const handlePhaseWeightChange = (phaseName: keyof typeof editedProject.projectType.phaseWeights, weight: number) => {
    setEditedProject({
      ...editedProject,
      projectType: {
        ...editedProject.projectType,
        phaseWeights: {
          ...editedProject.projectType.phaseWeights,
          [phaseName]: weight
        }
      }
    });
  };

  const handleBasicInfoChange = (field: keyof CapExRecord, value: any) => {
    setEditedProject({
      ...editedProject,
      [field]: value
    });
  };

  const handleSave = () => {
    onSave(editedProject);
    onClose();
  };

  return (
    <Dialog open fullWidth maxWidth="md">
      <DialogTitle>Edit Project</DialogTitle>
      <DialogContent>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={currentTab} onChange={(_, newValue) => setCurrentTab(newValue)}>
            <Tab label="Basic Info" />
            <Tab label="Feasibility" />
            <Tab label="Planning" />
            <Tab label="Execution" />
            <Tab label="Close" />
          </Tabs>
        </Box>

        <TabPanel value={currentTab} index={0}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                label="Project Name"
                value={editedProject.project_name}
                onChange={(e) => handleBasicInfoChange('project_name', e.target.value)}
                fullWidth
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Project Owner"
                value={editedProject.project_owner}
                onChange={(e) => handleBasicInfoChange('project_owner', e.target.value)}
                fullWidth
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="Start Date"
                type="date"
                value={editedProject.start_date}
                onChange={(e) => handleBasicInfoChange('start_date', e.target.value)}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="End Date"
                type="date"
                value={editedProject.end_date}
                onChange={(e) => handleBasicInfoChange('end_date', e.target.value)}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="Total Budget"
                type="number"
                value={editedProject.total_budget}
                onChange={(e) => handleBasicInfoChange('total_budget', Number(e.target.value))}
                fullWidth
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="Total Actual"
                type="number"
                value={editedProject.total_actual}
                onChange={(e) => handleBasicInfoChange('total_actual', Number(e.target.value))}
                fullWidth
              />
            </Grid>
          </Grid>
        </TabPanel>

        <TabPanel value={currentTab} index={1}>
          <PhaseEditPanel
            phase={editedProject.feasibility}
            phaseWeight={editedProject.projectType.phaseWeights.feasibility}
            onPhaseChange={(phase) => handlePhaseChange('feasibility', phase)}
            onWeightChange={(weight) => handlePhaseWeightChange('feasibility', weight)}
          />
        </TabPanel>

        <TabPanel value={currentTab} index={2}>
          <PhaseEditPanel
            phase={editedProject.planning}
            phaseWeight={editedProject.projectType.phaseWeights.planning}
            onPhaseChange={(phase) => handlePhaseChange('planning', phase)}
            onWeightChange={(weight) => handlePhaseWeightChange('planning', weight)}
          />
        </TabPanel>

        <TabPanel value={currentTab} index={3}>
          <PhaseEditPanel
            phase={editedProject.execution}
            phaseWeight={editedProject.projectType.phaseWeights.execution}
            onPhaseChange={(phase) => handlePhaseChange('execution', phase)}
            onWeightChange={(weight) => handlePhaseWeightChange('execution', weight)}
          />
        </TabPanel>

        <TabPanel value={currentTab} index={4}>
          <PhaseEditPanel
            phase={editedProject.close}
            phaseWeight={editedProject.projectType.phaseWeights.close}
            onPhaseChange={(phase) => handlePhaseChange('close', phase)}
            onWeightChange={(weight) => handlePhaseWeightChange('close', weight)}
          />
        </TabPanel>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} variant="contained" sx={{ bgcolor: '#D32F2F' }}>
          Save Changes
        </Button>
      </DialogActions>
    </Dialog>
  );
}; 