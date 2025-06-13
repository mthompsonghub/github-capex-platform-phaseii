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
  Stack
} from '@mui/material';
import { defaultSettings, updateStatusThresholds, getStoredThresholds, ThresholdSettings } from '../data/capexData';
import { CapExErrorBoundary } from '../../ErrorBoundary';
import toast from 'react-hot-toast';
import debounce from 'lodash/debounce';

interface AdminConfigProps {
  open: boolean;
  onClose: () => void;
  onUpdate?: () => void;
}

interface ThresholdValidation {
  isValid: boolean;
  error?: string;
}

const validateThresholds = (impactedThreshold: number, atRiskThreshold: number): ThresholdValidation => {
  // Validate range (0-100)
  if (impactedThreshold < 0 || atRiskThreshold < 0 || impactedThreshold > 1 || atRiskThreshold > 1) {
    return {
      isValid: false,
      error: 'Thresholds must be between 0% and 100%'
    };
  }

  // Validate atRisk > impacted (since atRisk is the higher threshold)
  if (atRiskThreshold <= impactedThreshold) {
    return {
      isValid: false,
      error: 'At Risk threshold must be greater than Impacted threshold'
    };
  }

  // Validate minimum difference (exactly 10%)
  const minDifference = 0.1; // 10%
  if (Math.abs(atRiskThreshold - impactedThreshold) < minDifference) {
    return {
      isValid: false,
      error: `Thresholds must be exactly ${minDifference * 100}% apart`
    };
  }

  return { isValid: true };
};

const AdminConfigContent: React.FC<AdminConfigProps> = ({ open, onClose, onUpdate }) => {
  const [thresholds, setThresholds] = useState<ThresholdSettings>(defaultSettings);
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasShownError, setHasShownError] = useState(false);

  // Load thresholds from storage when dialog opens
  useEffect(() => {
    if (open) {
      console.log('Dialog opened - loading thresholds');
      try {
        const storedThresholds = getStoredThresholds();
        console.log('Loaded stored thresholds:', storedThresholds);
        setThresholds(storedThresholds);
        setError('');
        setIsLoading(false);
        setHasShownError(false);
      } catch (err) {
        console.error('Error loading thresholds:', err);
        toast.error('Failed to load thresholds. Using defaults.');
        setThresholds(defaultSettings);
      }
    }
  }, [open]);

  // Debounced error toast
  const showErrorToast = useCallback(
    debounce((message: string) => {
      console.log('Showing error toast:', message);
      toast.error(message);
    }, 300),
    []
  );

  const handleSliderChange = (type: 'atRisk' | 'impacted', newValue: number) => {
    try {
      console.log(`Slider change - ${type}:`, newValue);
      const value = Number(newValue) / 100;
      
      // Validate value is between 0-100
      if (isNaN(value) || value < 0 || value > 1) {
        throw new Error('Value must be between 0% and 100%');
      }
      
      const newThresholds = {
        ...thresholds,
        [type === 'atRisk' ? 'atRiskThreshold' : 'impactedThreshold']: value
      };
      
      const validation = validateThresholds(
        newThresholds.impactedThreshold,
        newThresholds.atRiskThreshold
      );
      
      if (!validation.isValid) {
        setError(validation.error!);
        if (!hasShownError) {
          showErrorToast(validation.error!);
          setHasShownError(true);
        }
        return;
      }

      setError('');
      setHasShownError(false);
      setThresholds(newThresholds);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Invalid value entered';
      setError(errorMessage);
      if (!hasShownError) {
        showErrorToast(errorMessage);
        setHasShownError(true);
      }
    }
  };

  const handleSave = async () => {
    console.log('Save clicked - current thresholds:', thresholds);
    try {
      setIsLoading(true);
      setError('');

      // Validate thresholds
      const validation = validateThresholds(
        thresholds.impactedThreshold,
        thresholds.atRiskThreshold
      );
      
      if (!validation.isValid) {
        throw new Error(validation.error);
      }

      // Update thresholds
      console.log('Updating thresholds...');
      const success = updateStatusThresholds(
        thresholds.impactedThreshold,
        thresholds.atRiskThreshold
      );
      
      if (!success) {
        throw new Error('Failed to update thresholds');
      }

      console.log('Thresholds updated successfully');
      toast.success('Thresholds updated successfully');
      
      // Call onUpdate before closing
      if (onUpdate) {
        console.log('Calling onUpdate...');
        onUpdate();
      }

      // Close the modal
      console.log('Closing modal...');
      onClose();
    } catch (err) {
      console.error('Error during save:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to update thresholds';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      console.log('Save operation completed');
      setIsLoading(false);
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

  const formatValue = (value: number) => `${(value * 100).toFixed(0)}%`;

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      aria-labelledby="status-threshold-title"
      disableEscapeKeyDown={isLoading}
      keepMounted={false}
      PaperProps={{
        sx: {
          borderRadius: '12px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1), 0 2px 4px rgba(0,0,0,0.06)'
        }
      }}
    >
      <DialogTitle 
        id="status-threshold-title"
        sx={{ 
          borderBottom: '1px solid #E5E7EB',
          px: 3,
          py: 2,
          backgroundColor: '#F9FAFB',
          color: '#111827',
          fontSize: '1.25rem',
          fontWeight: 600
        }}
      >
        Status Threshold Configuration
      </DialogTitle>
      
      <DialogContent sx={{ p: 3 }}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Configure the thresholds that determine project status. Values represent the percentage of target completion.
            Thresholds are ordered from lowest to highest: Impacted, At Risk, On Track.
          </Typography>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
        </Box>

        <Stack spacing={3}>
          <Box>
            <Box sx={{ 
              color: '#374151',
              fontWeight: 500,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 1
            }}>
              At Risk Threshold (Middle)
              <span style={{ color: '#6B7280' }}>
                {formatValue(thresholds.atRiskThreshold)}
              </span>
            </Box>
            <Slider
              value={thresholds.atRiskThreshold * 100}
              onChange={(_, value) => handleSliderChange('atRisk', value as number)}
              min={0}
              max={100}
              step={1}
              disabled={isLoading}
              marks={[
                { value: 0, label: '0%' },
                { value: 50, label: '50%' },
                { value: 100, label: '100%' }
              ]}
              sx={{
                color: '#F59E0B',
                '& .MuiSlider-thumb': {
                  backgroundColor: '#fff',
                  border: '2px solid currentColor',
                  '&:hover, &.Mui-focusVisible': {
                    boxShadow: '0 0 0 8px rgba(245, 158, 11, 0.16)'
                  }
                }
              }}
            />
          </Box>

          <Box>
            <Box sx={{ 
              color: '#374151',
              fontWeight: 500,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 1
            }}>
              Impacted Threshold (Lowest)
              <span style={{ color: '#6B7280' }}>
                {formatValue(thresholds.impactedThreshold)}
              </span>
            </Box>
            <Slider
              value={thresholds.impactedThreshold * 100}
              onChange={(_, value) => handleSliderChange('impacted', value as number)}
              min={0}
              max={100}
              step={1}
              disabled={isLoading}
              marks={[
                { value: 0, label: '0%' },
                { value: 50, label: '50%' },
                { value: 100, label: '100%' }
              ]}
              sx={{
                color: '#EF4444',
                '& .MuiSlider-thumb': {
                  backgroundColor: '#fff',
                  border: '2px solid currentColor',
                  '&:hover, &.Mui-focusVisible': {
                    boxShadow: '0 0 0 8px rgba(239, 68, 68, 0.16)'
                  }
                }
              }}
            />
          </Box>
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid #E5E7EB' }}>
        <Button 
          onClick={onClose}
          disabled={isLoading}
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
          disabled={isLoading || !!error}
          variant="contained"
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
  return (
    <CapExErrorBoundary>
      <AdminConfigContent {...props} />
    </CapExErrorBoundary>
  );
}; 