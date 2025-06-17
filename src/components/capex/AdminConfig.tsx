import React, { useState, useEffect } from 'react';
import { useCapExStore } from '../../stores/capexStore';
import { STATUS_PERCENTAGES } from '../../types/capex-unified';
import { Button, TextField, Typography, Box, Paper } from '@mui/material';

const AdminConfig: React.FC = () => {
  const actions = useCapExStore(state => state.actions);
  const adminSettings = useCapExStore(state => state.adminSettings);

  const [thresholds, setThresholds] = useState({
    onTrack: adminSettings?.thresholds?.onTrack ?? STATUS_PERCENTAGES.onTrack,
    atRisk: adminSettings?.thresholds?.atRisk ?? STATUS_PERCENTAGES.atRisk
  });

  const [phaseWeights, setPhaseWeights] = useState({
    complexProject: {
      feasibility: adminSettings?.phaseWeights?.complexProject?.feasibility ?? 15,
      planning: adminSettings?.phaseWeights?.complexProject?.planning ?? 35,
      execution: adminSettings?.phaseWeights?.complexProject?.execution ?? 45,
      close: adminSettings?.phaseWeights?.complexProject?.close ?? 5
    },
    assetPurchase: {
      planning: adminSettings?.phaseWeights?.assetPurchase?.planning ?? 45,
      execution: adminSettings?.phaseWeights?.assetPurchase?.execution ?? 50,
      close: adminSettings?.phaseWeights?.assetPurchase?.close ?? 5
    }
  });

  const handleThresholdChange = (field: 'onTrack' | 'atRisk', value: string) => {
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue) && numValue >= 0 && numValue <= 100) {
      setThresholds(prev => ({
        ...prev,
        [field]: numValue
      }));
    }
  };

  const handlePhaseWeightChange = (
    projectType: 'complexProject' | 'assetPurchase',
    phase: string,
    value: string
  ) => {
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue) && numValue >= 0 && numValue <= 100) {
      setPhaseWeights(prev => ({
        ...prev,
        [projectType]: {
          ...prev[projectType],
          [phase]: numValue
        }
      }));
    }
  };

  const handleSave = () => {
    actions.updateAdminSettings({
      thresholds,
      phaseWeights
    });
  };

  const handleReset = () => {
    setThresholds({
      onTrack: STATUS_PERCENTAGES.onTrack,
      atRisk: STATUS_PERCENTAGES.atRisk
    });
    setPhaseWeights({
      complexProject: {
        feasibility: 15,
        planning: 35,
        execution: 45,
        close: 5
      },
      assetPurchase: {
        planning: 45,
        execution: 50,
        close: 5
      }
    });
  };

  return (
    <Paper sx={{ p: 3, maxWidth: 800, mx: 'auto', mt: 4 }}>
      <Typography variant="h5" gutterBottom>
        Admin Configuration
      </Typography>

      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Status Thresholds
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField
            label="On Track Threshold"
            type="number"
            value={thresholds.onTrack}
            onChange={(e) => handleThresholdChange('onTrack', e.target.value)}
            inputProps={{ min: 0, max: 100 }}
          />
          <TextField
            label="At Risk Threshold"
            type="number"
            value={thresholds.atRisk}
            onChange={(e) => handleThresholdChange('atRisk', e.target.value)}
            inputProps={{ min: 0, max: 100 }}
          />
        </Box>
      </Box>

      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Complex Project Phase Weights
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          {Object.entries(phaseWeights.complexProject).map(([phase, weight]) => (
            <TextField
              key={phase}
              label={`${phase.charAt(0).toUpperCase() + phase.slice(1)} Weight`}
              type="number"
              value={weight}
              onChange={(e) => handlePhaseWeightChange('complexProject', phase, e.target.value)}
              inputProps={{ min: 0, max: 100 }}
            />
          ))}
        </Box>
      </Box>

      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Asset Purchase Phase Weights
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          {Object.entries(phaseWeights.assetPurchase).map(([phase, weight]) => (
            <TextField
              key={phase}
              label={`${phase.charAt(0).toUpperCase() + phase.slice(1)} Weight`}
              type="number"
              value={weight}
              onChange={(e) => handlePhaseWeightChange('assetPurchase', phase, e.target.value)}
              inputProps={{ min: 0, max: 100 }}
            />
          ))}
        </Box>
      </Box>

      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
        <Button variant="outlined" onClick={handleReset}>
          Reset to Defaults
        </Button>
        <Button variant="contained" onClick={handleSave}>
          Save Changes
        </Button>
      </Box>
    </Paper>
  );
};

export default AdminConfig; 