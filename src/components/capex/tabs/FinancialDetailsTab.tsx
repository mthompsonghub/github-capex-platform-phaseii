import React from 'react';
import { Card, CardContent, Grid, TextField, Typography, Box, Divider } from '@mui/material';
import { Project } from '../data/capexData';
import { FinancialPerformanceMetrics } from './FinancialPerformanceMetrics';
import { useCapExStore } from '../../../stores/capexStore';

interface FinancialDetailsTabProps {
  project: Project;
  onUpdate: (updates: Partial<Project>) => void;
}

export const FinancialDetailsTab: React.FC<FinancialDetailsTabProps> = ({ project, onUpdate }) => {
  const isAdmin = useCapExStore(state => state.isAdmin);

  const handleChange = (field: keyof Project) => (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    onUpdate({ [field]: value });
  };

  const handleDateChange = (field: keyof Project) => (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value ? new Date(event.target.value) : undefined;
    onUpdate({ [field]: value });
  };

  // Simple budget/utilization calculations
  const budget = Number(project?.totalBudget || 0);
  const actualSpend = Number(project?.totalActual || 0);
  const remainingBudget = budget - actualSpend;
  const formatCurrency = (val: number) => `$${val.toLocaleString()}`;

  return (
    <Box display="flex" flexDirection="column" gap={3}>
      {/* Project Identification Section */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Project Identification
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="SES Asset Number"
                value={project.sesNumber || ''}
                onChange={handleChange('sesNumber')}
                margin="normal"
                placeholder="Enter SES Asset Number"
                helperText="Internal asset tracking number"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Upcoming Milestone"
                value={project.upcomingMilestone || ''}
                onChange={handleChange('upcomingMilestone')}
                margin="normal"
                placeholder="Next major milestone"
                helperText="Next key deliverable or checkpoint"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Milestone Due Date"
                type="date"
                value={project.milestoneDueDate ? project.milestoneDueDate.toISOString().split('T')[0] : ''}
                onChange={handleDateChange('milestoneDueDate')}
                margin="normal"
                disabled={!isAdmin}
                InputLabelProps={{ shrink: true }}
                helperText={!isAdmin ? "Only administrators can edit this field" : ""}
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Financial Performance Metrics */}
      <FinancialPerformanceMetrics project={project} />

      {/* Budget performance card */}
      <Card sx={{ p: 2, bgcolor: remainingBudget < 0 ? 'error.light' : 'success.light' }}>
        <Typography variant="h6">
          Remaining Budget: {formatCurrency(remainingBudget)}
        </Typography>
        <Typography variant="body2">
          Utilization: {budget > 0 ? Math.round((actualSpend / budget) * 100) : 0}%
        </Typography>
      </Card>

      {/* Financial Notes Section */}
      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Financial Notes & Justifications
          </Typography>
          <TextField
            fullWidth
            label="Financial Notes"
            value={project.financialNotes || ''}
            onChange={handleChange('financialNotes')}
            margin="normal"
            multiline
            rows={4}
            placeholder="Add notes about budget changes, justifications, or financial concerns..."
            helperText="Use this section to document budget changes, provide justifications for overruns, or note any financial concerns."
          />
        </CardContent>
      </Card>
    </Box>
  );
}; 