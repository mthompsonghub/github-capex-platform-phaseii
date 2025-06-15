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
import { defaultSettings, updateStatusThresholds, getStoredThresholds, ThresholdSettings } from '../data/capexData';
import { CapExErrorBoundary } from '../../ErrorBoundary';
import toast from 'react-hot-toast';
import debounce from 'lodash/debounce';
import { useCapExStore } from '../../../stores/capexStore';

export interface ExtendedThresholdSettings extends ThresholdSettings {
  projectWeights: {
    feasibility: number;
    planning: number;
    execution: number;
    close: number;
  };
  assetWeights: {
    feasibility: number;
    planning: number;
    execution: number;
    close: number;
  };
}

interface AdminConfigProps {
  open: boolean;
  onClose: () => void;
  onUpdate?: (settings: ExtendedThresholdSettings) => Promise<void>;
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

const defaultExtendedSettings: ExtendedThresholdSettings = {
  ...defaultSettings,
  projectWeights: {
    feasibility: 15,
    planning: 35,
    execution: 45,
    close: 5
  },
  assetWeights: {
    feasibility: 0,
    planning: 45,
    execution: 50,
    close: 5
  }
};

const AdminConfigContent: React.FC<AdminConfigProps> = ({ open, onClose, onUpdate }) => {
  console.log('AdminConfigContent rendered with props:', { open, onClose, onUpdate });
  
  const { phaseWeights, actions: { fetchPhaseWeights, updatePhaseWeights } } = useCapExStore();

  const [thresholds, setThresholds] = useState<ExtendedThresholdSettings>(defaultExtendedSettings);
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasShownError, setHasShownError] = useState(false);

  // Extract values from thresholds state
  const { onTrackThreshold, atRiskThreshold, impactedThreshold } = thresholds;
  const [projectWeights, setProjectWeights] = useState({
    feasibility: 15, planning: 35, execution: 45, close: 5
  });
  const [assetWeights, setAssetWeights] = useState({
    feasibility: 0, planning: 45, execution: 50, close: 5
  });

  // Calculate totals
  const projectTotal = projectWeights.feasibility + projectWeights.planning + projectWeights.execution + projectWeights.close;
  const assetTotal = assetWeights.feasibility + assetWeights.planning + assetWeights.execution + assetWeights.close;

  // Load thresholds from storage when dialog opens
  useEffect(() => {
    if (open) {
      console.log('Dialog opened - loading thresholds');
      try {
        const storedThresholds = getStoredThresholds();
        console.log('Loaded stored thresholds:', storedThresholds);
        setThresholds({
          ...storedThresholds,
          projectWeights: defaultExtendedSettings.projectWeights,
          assetWeights: defaultExtendedSettings.assetWeights
        });
        setError('');
        setIsLoading(false);
        setHasShownError(false);
      } catch (err) {
        console.error('Error loading thresholds:', err);
        toast.error('Failed to load thresholds. Using defaults.');
        setThresholds(defaultExtendedSettings);
      }
    }
  }, [open]);

  // Load phase weights when dialog opens
  useEffect(() => {
    if (open) {
      fetchPhaseWeights();
    }
  }, [open, fetchPhaseWeights]);

  // Update local state when phase weights change
  useEffect(() => {
    if (phaseWeights) {
      setProjectWeights(phaseWeights.projects);
      setAssetWeights(phaseWeights.asset_purchases);
    }
  }, [phaseWeights]);

  // Debounced error toast
  const showErrorToast = useCallback(
    debounce((message: string) => {
      console.log('Showing error toast:', message);
      toast.error(message);
    }, 300),
    []
  );

  const handleThresholdChange = (name: keyof ThresholdSettings, value: number) => {
    setThresholds(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleProjectWeightChange = (phase: keyof typeof projectWeights, value: number) => {
    setThresholds(prev => ({
      ...prev,
      projectWeights: {
        ...prev.projectWeights,
        [phase]: value
      }
    }));
  };

  const handleAssetWeightChange = (asset: keyof typeof assetWeights, value: number) => {
    setThresholds(prev => ({
      ...prev,
      assetWeights: {
        ...prev.assetWeights,
        [asset]: value
      }
    }));
  };

  const handleSave = async () => {
    console.log('AdminConfig handleSave called');
    console.log('Saving thresholds:', { onTrackThreshold, atRiskThreshold, impactedThreshold });
    console.log('Saving project weights:', projectWeights);
    console.log('Saving asset weights:', assetWeights);
    
    try {
      if (!onUpdate) {
        console.error('onUpdate function is not defined');
        return;
      }

      // Save threshold settings
      await onUpdate({
        onTrackThreshold,
        atRiskThreshold,
        impactedThreshold,
        projectWeights,
        assetWeights
      });

      // Save phase weights
      await updatePhaseWeights('projects', projectWeights);
      await updatePhaseWeights('asset_purchases', assetWeights);
      
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
        console.log('Loading timeout reached - resetting loading state');
        setIsLoading(false);
        toast.error('Operation timed out. Please try again.');
      }, 5000); // 5 second timeout
    }
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [isLoading]);

  const formatValue = (value: number) => `${value.toFixed(0)}%`;

  const ValueBadge = ({ value, color }: { value: number; color: string }) => (
    <Box
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        px: 1.5,
        py: 0.5,
        borderRadius: 1,
        backgroundColor: `${color}15`,
        color: color,
        fontWeight: 500,
        fontSize: '0.875rem',
        minWidth: '60px',
        justifyContent: 'center'
      }}
    >
      {formatValue(value)}
    </Box>
  );

  const ThresholdPreview = () => {
    const marks = [
      { value: thresholds.impactedThreshold, label: 'Impacted' },
      { value: thresholds.atRiskThreshold, label: 'At Risk' },
      { value: thresholds.onTrackThreshold, label: 'On Track' }
    ].sort((a, b) => a.value - b.value);

    return (
      <Box sx={{ mt: 2, mb: 3 }}>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Visual Preview
        </Typography>
        <Box sx={{ 
          height: 40, 
          position: 'relative',
          bgcolor: '#F3F4F6',
          borderRadius: 1,
          overflow: 'hidden'
        }}>
          {marks.map((mark, index) => (
            <Box
              key={mark.label}
              sx={{
                position: 'absolute',
                left: `${mark.value}%`,
                top: 0,
                bottom: 0,
                width: '2px',
                bgcolor: index === 0 ? '#EF4444' : index === 1 ? '#F59E0B' : '#10B981',
                transform: 'translateX(-50%)',
                '&::after': {
                  content: '""',
                  position: 'absolute',
                  left: '50%',
                  top: 0,
                  width: 0,
                  height: 0,
                  borderLeft: '4px solid transparent',
                  borderRight: '4px solid transparent',
                  borderTop: '4px solid',
                  borderTopColor: index === 0 ? '#EF4444' : index === 1 ? '#F59E0B' : '#10B981',
                  transform: 'translateX(-50%)'
                }
              }}
            />
          ))}
          <Box sx={{ 
            position: 'absolute',
            left: 0,
            right: 0,
            top: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            px: 1
          }}>
            {marks.map((mark) => (
              <Typography
                key={mark.label}
                variant="caption"
                sx={{
                  color: mark.label === 'Impacted' ? '#EF4444' :
                         mark.label === 'At Risk' ? '#F59E0B' : '#10B981',
                  fontWeight: 500,
                  transform: 'translateX(-50%)',
                  position: 'absolute',
                  left: `${mark.value}%`
                }}
              >
                {mark.label}
              </Typography>
            ))}
          </Box>
        </Box>
      </Box>
    );
  };

  console.log('AdminConfig rendering with open:', open);
  return (
    <Dialog
      open={open}
      onClose={onClose}
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
        borderBottom: '1px solid #E5E7EB',
        pb: 2,
        '& .MuiTypography-root': {
          fontSize: '1.25rem',
          fontWeight: 600,
          color: '#111827'
        }
      }}>
        Admin Configuration
      </DialogTitle>
      
      <DialogContent sx={{ pt: 3 }}>
        {error && (
          <Alert 
            severity="error" 
            sx={{ mb: 2 }}
            onClose={() => setError('')}
          >
            {error}
          </Alert>
        )}
        
        <Stack spacing={4}>
          <Box>
            <Typography variant="subtitle1" sx={{ mb: 1, color: '#374151' }}>
              Status Thresholds
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Set the completion percentage thresholds that determine a project's status. 
              Projects must be at least 10% apart to ensure clear status differentiation.
              Higher completion percentages indicate better project health.
            </Typography>

            <ThresholdPreview />
            
            <Stack spacing={3}>
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    On Track Threshold (Highest)
                  </Typography>
                  <ValueBadge value={thresholds.onTrackThreshold} color="#10B981" />
                </Box>
                <Slider
                  value={thresholds.onTrackThreshold}
                  onChange={(_, value) => handleThresholdChange('onTrackThreshold', value as number)}
                  valueLabelDisplay="auto"
                  valueLabelFormat={formatValue}
                  min={0}
                  max={100}
                  step={1}
                  marks={Array.from({ length: 11 }, (_, i) => ({ value: i * 10, label: `${i * 10}%` }))}
                  sx={{
                    color: '#10B981',
                    '& .MuiSlider-thumb': {
                      '&:hover, &.Mui-focusVisible': {
                        boxShadow: '0 0 0 8px rgba(16, 185, 129, 0.16)'
                      }
                    },
                    '& .MuiSlider-mark': {
                      backgroundColor: '#bfdbfe',
                      height: '8px',
                      width: '1px',
                      '&.MuiSlider-markActive': {
                        backgroundColor: '#fff'
                      }
                    }
                  }}
                />
              </Box>

              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    At Risk Threshold (Medium)
                  </Typography>
                  <ValueBadge value={thresholds.atRiskThreshold} color="#F59E0B" />
                </Box>
                <Slider
                  value={thresholds.atRiskThreshold}
                  onChange={(_, value) => handleThresholdChange('atRiskThreshold', value as number)}
                  valueLabelDisplay="auto"
                  valueLabelFormat={formatValue}
                  min={0}
                  max={100}
                  step={1}
                  marks={Array.from({ length: 11 }, (_, i) => ({ value: i * 10, label: `${i * 10}%` }))}
                  sx={{
                    color: '#F59E0B',
                    '& .MuiSlider-thumb': {
                      '&:hover, &.Mui-focusVisible': {
                        boxShadow: '0 0 0 8px rgba(245, 158, 11, 0.16)'
                      }
                    },
                    '& .MuiSlider-mark': {
                      backgroundColor: '#bfdbfe',
                      height: '8px',
                      width: '1px',
                      '&.MuiSlider-markActive': {
                        backgroundColor: '#fff'
                      }
                    }
                  }}
                />
              </Box>

              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Impacted Threshold (Lowest)
                  </Typography>
                  <ValueBadge value={thresholds.impactedThreshold} color="#EF4444" />
                </Box>
                <Slider
                  value={thresholds.impactedThreshold}
                  onChange={(_, value) => handleThresholdChange('impactedThreshold', value as number)}
                  valueLabelDisplay="auto"
                  valueLabelFormat={formatValue}
                  min={0}
                  max={100}
                  step={1}
                  marks={Array.from({ length: 11 }, (_, i) => ({ value: i * 10, label: `${i * 10}%` }))}
                  sx={{
                    color: '#EF4444',
                    '& .MuiSlider-thumb': {
                      '&:hover, &.Mui-focusVisible': {
                        boxShadow: '0 0 0 8px rgba(239, 68, 68, 0.16)'
                      }
                    },
                    '& .MuiSlider-mark': {
                      backgroundColor: '#bfdbfe',
                      height: '8px',
                      width: '1px',
                      '&.MuiSlider-markActive': {
                        backgroundColor: '#fff'
                      }
                    }
                  }}
                />
              </Box>
            </Stack>
          </Box>

          {/* Project Phase Weights */}
          <Box sx={{ mt: 4 }}>
            <Typography variant="h6">Project Phase Weights</Typography>
            <Box sx={{ px: 2 }}>
              <Box sx={{ mb: 2 }}>
                <Typography>Feasibility</Typography>
                <Slider
                  value={projectWeights.feasibility}
                  onChange={(_, value) => handleProjectWeightChange('feasibility', value as number)}
                  valueLabelDisplay="auto"
                  valueLabelFormat={formatValue}
                />
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography>Planning</Typography>
                <Slider
                  value={projectWeights.planning}
                  onChange={(_, value) => handleProjectWeightChange('planning', value as number)}
                  valueLabelDisplay="auto"
                  valueLabelFormat={formatValue}
                />
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography>Execution</Typography>
                <Slider
                  value={projectWeights.execution}
                  onChange={(_, value) => handleProjectWeightChange('execution', value as number)}
                  valueLabelDisplay="auto"
                  valueLabelFormat={formatValue}
                />
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography>Close</Typography>
                <Slider
                  value={projectWeights.close}
                  onChange={(_, value) => handleProjectWeightChange('close', value as number)}
                  valueLabelDisplay="auto"
                  valueLabelFormat={formatValue}
                />
              </Box>
              <Typography variant="caption" color={projectTotal === 100 ? 'success.main' : 'error.main'}>
                Total: {projectTotal}% {projectTotal !== 100 && '(Must equal 100%)'}
              </Typography>
            </Box>
          </Box>

          {/* Asset Category Weights */}
          <Box sx={{ mt: 4 }}>
            <Typography variant="h6">Asset Category Weights</Typography>
            <Box sx={{ px: 2 }}>
              <Box sx={{ mb: 2 }}>
                <Typography>Feasibility</Typography>
                <Slider
                  value={assetWeights.feasibility}
                  onChange={(_, value) => handleAssetWeightChange('feasibility', value as number)}
                  valueLabelDisplay="auto"
                  valueLabelFormat={formatValue}
                />
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography>Planning</Typography>
                <Slider
                  value={assetWeights.planning}
                  onChange={(_, value) => handleAssetWeightChange('planning', value as number)}
                  valueLabelDisplay="auto"
                  valueLabelFormat={formatValue}
                />
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography>Execution</Typography>
                <Slider
                  value={assetWeights.execution}
                  onChange={(_, value) => handleAssetWeightChange('execution', value as number)}
                  valueLabelDisplay="auto"
                  valueLabelFormat={formatValue}
                />
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography>Close</Typography>
                <Slider
                  value={assetWeights.close}
                  onChange={(_, value) => handleAssetWeightChange('close', value as number)}
                  valueLabelDisplay="auto"
                  valueLabelFormat={formatValue}
                />
              </Box>
              <Typography variant="caption" color={assetTotal === 100 ? 'success.main' : 'error.main'}>
                Total: {assetTotal}% {assetTotal !== 100 && '(Must equal 100%)'}
              </Typography>
            </Box>
          </Box>
        </Stack>
      </DialogContent>
      
      <DialogActions sx={{ 
        borderTop: '1px solid #E5E7EB',
        px: 3,
        py: 2
      }}>
        <Button 
          onClick={onClose}
          sx={{ 
            color: '#6B7280',
            '&:hover': {
              backgroundColor: '#F3F4F6'
            }
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={isLoading || !!error}
          sx={{ 
            backgroundColor: '#1e40af',
            '&:hover': {
              backgroundColor: '#1e3a8a'
            }
          }}
        >
          {isLoading ? 'Saving...' : 'Save Changes'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export const AdminConfig: React.FC<AdminConfigProps> = (props) => {
  console.log('AdminConfig wrapper rendered with props:', props);
  return (
    <CapExErrorBoundary>
      <AdminConfigContent {...props} />
    </CapExErrorBoundary>
  );
}; 