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

  const handleSliderChange = (type: 'onTrack' | 'atRisk' | 'impacted', newValue: number) => {
    try {
      console.log(`Slider change - ${type}:`, newValue);
      
      // Validate value is between 0-100
      if (isNaN(newValue) || newValue < 0 || newValue > 100) {
        throw new Error('Value must be between 0% and 100%');
      }
      
      const newThresholds = {
        ...thresholds,
        [type === 'onTrack' ? 'onTrackThreshold' : 
         type === 'atRisk' ? 'atRiskThreshold' : 'impactedThreshold']: newValue
      };
      
      const validation = validateThresholds(
        newThresholds.onTrackThreshold,
        newThresholds.atRiskThreshold,
        newThresholds.impactedThreshold
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
        thresholds.onTrackThreshold,
        thresholds.atRiskThreshold,
        thresholds.impactedThreshold
      );
      
      if (!validation.isValid) {
        throw new Error(validation.error);
      }

      // Update thresholds
      console.log('Updating thresholds...');
      const success = updateStatusThresholds(
        thresholds.onTrackThreshold,
        thresholds.atRiskThreshold,
        thresholds.impactedThreshold
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

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="sm"
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
                  onChange={(_, value) => handleSliderChange('onTrack', value as number)}
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
                  onChange={(_, value) => handleSliderChange('atRisk', value as number)}
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
                  onChange={(_, value) => handleSliderChange('impacted', value as number)}
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

export const AdminConfig: React.FC<AdminConfigProps> = (props) => (
  <CapExErrorBoundary>
    <AdminConfigContent {...props} />
  </CapExErrorBoundary>
); 