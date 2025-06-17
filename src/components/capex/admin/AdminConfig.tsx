import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  Alert,
  Slider,
  Stack,
  FormControlLabel,
  Switch
} from '@mui/material';
import { STATUS_PERCENTAGES, AdminSettings } from '../../../types/capex-unified';
import { CapExErrorBoundary } from '../../ErrorBoundary';
import toast from 'react-hot-toast';
import debounce from 'lodash/debounce';
import { useCapExStore } from '../../../stores/capexStore';

interface AdminConfigProps {
  open: boolean;
  onClose: () => void;
  onUpdate?: (settings: AdminSettings) => Promise<void>;
}

interface ThresholdValidation {
  isValid: boolean;
  error?: string;
}

const validateThresholds = (
  onTrackThreshold: number,
  atRiskThreshold: number,
  impactedThreshold: number
): ThresholdValidation => {
  // Validate range (0-100)
  if (
    onTrackThreshold < 0 || onTrackThreshold > 100 ||
    atRiskThreshold < 0 || atRiskThreshold > 100 ||
    impactedThreshold < 0 || impactedThreshold > 100
  ) {
    return {
      isValid: false,
      error: 'Thresholds must be between 0% and 100%'
    };
  }

  // Validate thresholds are in correct order
  if (onTrackThreshold <= atRiskThreshold) {
    return {
      isValid: false,
      error: 'On Track threshold must be greater than At Risk threshold'
    };
  }

  if (atRiskThreshold <= impactedThreshold) {
    return {
      isValid: false,
      error: 'At Risk threshold must be greater than Impacted threshold'
    };
  }

  // Validate minimum difference (at least 10%)
  const minDifference = 10; // 10%
  if ((onTrackThreshold - atRiskThreshold) < minDifference) {
    return {
      isValid: false,
      error: 'On Track and At Risk thresholds must be at least 10% apart'
    };
  }

  if ((atRiskThreshold - impactedThreshold) < minDifference) {
    return {
      isValid: false,
      error: 'At Risk and Impacted thresholds must be at least 10% apart'
    };
  }

  return { isValid: true };
};

const defaultSettings: AdminSettings = {
  thresholds: {
    onTrack: STATUS_PERCENTAGES.onTrack,
    atRisk: STATUS_PERCENTAGES.atRisk
  },
  phaseWeights: {
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
  }
};

const AdminConfigContent: React.FC<AdminConfigProps> = ({ open, onClose, onUpdate }) => {
  console.log('AdminConfigContent rendered with props:', { open, onClose, onUpdate });
  
  const { adminSettings, actions: { updateAdminSettings } } = useCapExStore();

  const [settings, setSettings] = useState<AdminSettings>(() => ({
    ...defaultSettings,
    ...adminSettings
  }));

  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasShownError, setHasShownError] = useState(false);

  // Extract values from settings state
  const { thresholds, phaseWeights } = settings;
  const { onTrack, atRisk } = thresholds;
  const { complexProject: projectWeights, assetPurchase: assetWeights } = phaseWeights;

  // Calculate totals
  const projectTotal = projectWeights.feasibility + projectWeights.planning + projectWeights.execution + projectWeights.close;
  const assetTotal = assetWeights.planning + assetWeights.execution + assetWeights.close;

  // Load settings from store when dialog opens
  useEffect(() => {
    if (open) {
      console.log('Dialog opened - loading settings');
      try {
        setSettings({
          ...defaultSettings,
          ...adminSettings
        });
        setError('');
        setIsLoading(false);
        setHasShownError(false);
      } catch (err) {
        console.error('Error loading settings:', err);
        toast.error('Failed to load settings. Using defaults.');
        setSettings(defaultSettings);
      }
    }
  }, [open, adminSettings]);

  // Debounced error toast
  const showErrorToast = useCallback(
    debounce((message: string) => {
      console.log('Showing error toast:', message);
      toast.error(message);
    }, 300),
    []
  );

  const handleThresholdChange = (name: keyof typeof thresholds, value: number) => {
    setSettings(prev => ({
      ...prev,
      thresholds: {
        ...prev.thresholds,
        [name]: value
      }
    }));
  };

  const handleProjectWeightChange = (phase: keyof typeof projectWeights, value: number) => {
    setSettings(prev => ({
      ...prev,
      phaseWeights: {
        ...prev.phaseWeights,
        complexProject: {
          ...prev.phaseWeights.complexProject,
          [phase]: value
        }
      }
    }));
  };

  const handleAssetWeightChange = (phase: keyof typeof assetWeights, value: number) => {
    setSettings(prev => ({
      ...prev,
      phaseWeights: {
        ...prev.phaseWeights,
        assetPurchase: {
          ...prev.phaseWeights.assetPurchase,
          [phase]: value
        }
      }
    }));
  };

  const handleSave = async () => {
    console.log('AdminConfig handleSave called');
    console.log('Saving settings:', settings);
    
    try {
      // Save all settings to store
      await updateAdminSettings(settings);

      if (onUpdate) {
        await onUpdate(settings);
      }
      
      console.log('All settings saved successfully');
      onClose();
    } catch (error) {
      console.error('Save failed:', error);
      toast.error('Failed to save settings');
    }
  };

  // Safety timeout for loading state
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    if (isLoading) {
      timeoutId = setTimeout(() => {
        setIsLoading(false);
        if (!hasShownError) {
          toast.error('Loading timeout. Please try again.');
          setHasShownError(true);
        }
      }, 5000);
    }
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [isLoading, hasShownError]);

  const formatValue = (value: number) => `${value.toFixed(0)}%`;

  const ValueBadge = ({ value, color }: { value: number; color: string }) => (
    <Box
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 40,
        height: 40,
        borderRadius: '50%',
        bgcolor: color,
        color: 'white',
        fontWeight: 'bold',
        fontSize: '0.875rem'
      }}
    >
      {formatValue(value)}
    </Box>
  );

  const ThresholdPreview = () => {
    const validation = validateThresholds(onTrack, atRisk, 0);
    const showError = !validation.isValid && error;

    return (
      <Box sx={{ mt: 4, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
        <Typography variant="h6" gutterBottom>
          Threshold Preview
        </Typography>
        <Stack spacing={2}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <ValueBadge value={onTrack} color="success.main" />
            <Typography>On Track</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <ValueBadge value={atRisk} color="warning.main" />
            <Typography>At Risk</Typography>
          </Box>
          {showError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {validation.error}
            </Alert>
          )}
        </Stack>
      </Box>
    );
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Admin Configuration</DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          <Typography variant="h6" gutterBottom>
            Status Thresholds
          </Typography>
          <Stack spacing={3}>
            <Box>
              <Typography gutterBottom>On Track Threshold</Typography>
              <Slider
                value={onTrack}
                onChange={(_, value) => handleThresholdChange('onTrack', value as number)}
                min={0}
                max={100}
                valueLabelDisplay="auto"
                valueLabelFormat={formatValue}
              />
            </Box>
            <Box>
              <Typography gutterBottom>At Risk Threshold</Typography>
              <Slider
                value={atRisk}
                onChange={(_, value) => handleThresholdChange('atRisk', value as number)}
                min={0}
                max={100}
                valueLabelDisplay="auto"
                valueLabelFormat={formatValue}
              />
            </Box>
          </Stack>
          <ThresholdPreview />
        </Box>

        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" gutterBottom>
            Complex Project Phase Weights
          </Typography>
          <Stack spacing={3}>
            {Object.entries(projectWeights).map(([phase, weight]) => (
              <Box key={phase}>
                <Typography gutterBottom>
                  {phase.charAt(0).toUpperCase() + phase.slice(1)} Weight
                </Typography>
                <Slider
                  value={weight}
                  onChange={(_, value) => handleProjectWeightChange(phase as keyof typeof projectWeights, value as number)}
                  min={0}
                  max={100}
                  valueLabelDisplay="auto"
                  valueLabelFormat={formatValue}
                />
              </Box>
            ))}
            <Typography color={projectTotal === 100 ? 'success.main' : 'error.main'}>
              Total: {formatValue(projectTotal)}
            </Typography>
          </Stack>
        </Box>

        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" gutterBottom>
            Asset Purchase Phase Weights
          </Typography>
          <Stack spacing={3}>
            {Object.entries(assetWeights).map(([phase, weight]) => (
              <Box key={phase}>
                <Typography gutterBottom>
                  {phase.charAt(0).toUpperCase() + phase.slice(1)} Weight
                </Typography>
                <Slider
                  value={weight}
                  onChange={(_, value) => handleAssetWeightChange(phase as keyof typeof assetWeights, value as number)}
                  min={0}
                  max={100}
                  valueLabelDisplay="auto"
                  valueLabelFormat={formatValue}
                />
              </Box>
            ))}
            <Typography color={assetTotal === 100 ? 'success.main' : 'error.main'}>
              Total: {formatValue(assetTotal)}
            </Typography>
          </Stack>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} variant="contained" color="primary">
          Save Changes
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export const AdminConfig: React.FC<AdminConfigProps> = (props) => (
  <CapExErrorBoundary>
    <AdminConfigContent {...props} />
  </CapExErrorBoundary>
); 