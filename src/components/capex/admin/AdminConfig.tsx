import React, { useState, useEffect } from 'react';
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
import { STATUS_THRESHOLDS, updateStatusThresholds } from '../data/capexData';

interface AdminConfigProps {
  open: boolean;
  onClose: () => void;
  onUpdate?: () => void;
}

export const AdminConfig: React.FC<AdminConfigProps> = ({ open, onClose, onUpdate }) => {
  const [atRisk, setAtRisk] = useState<number>(STATUS_THRESHOLDS.AT_RISK);
  const [impacted, setImpacted] = useState<number>(STATUS_THRESHOLDS.AT_RISK);
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Reset values when dialog opens
    if (open) {
      setAtRisk(STATUS_THRESHOLDS.AT_RISK);
      setImpacted(STATUS_THRESHOLDS.AT_RISK);
      setError('');
      setIsLoading(false);
    }
  }, [open]);

  const handleSliderChange = (type: 'atRisk' | 'impacted', newValue: number) => {
    try {
      const value = Number(newValue) / 100;
      if (isNaN(value) || value < 0 || value > 1) {
        throw new Error('Invalid value');
      }
      
      if (type === 'atRisk') {
        if (value <= impacted) {
          setError('At Risk threshold must be greater than Impacted threshold');
        } else {
          setError('');
          setAtRisk(value);
        }
      } else {
        if (value >= atRisk) {
          setError('Impacted threshold must be less than At Risk threshold');
        } else {
          setError('');
          setImpacted(value);
        }
      }
    } catch (err) {
      setError('Invalid value entered');
    }
  };

  const handleSave = async () => {
    try {
      setIsLoading(true);
      setError('');

      // Validate thresholds
      if (impacted >= atRisk) {
        throw new Error('Impacted threshold must be less than At Risk threshold');
      }
      if (atRisk >= 1) {
        throw new Error('At Risk threshold must be less than 100%');
      }
      if (impacted <= 0) {
        throw new Error('Impacted threshold must be greater than 0%');
      }

      // Update thresholds
      const success = updateStatusThresholds(impacted, atRisk);
      if (!success) {
        throw new Error('Failed to update thresholds');
      }

      onUpdate?.();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update thresholds');
    } finally {
      setIsLoading(false);
    }
  };

  const formatValue = (value: number) => `${(value * 100).toFixed(0)}%`;

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      aria-labelledby="status-threshold-title"
      disableEscapeKeyDown
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
              At Risk Threshold
              <span style={{ color: '#6B7280' }}>
                {formatValue(atRisk)}
              </span>
            </Box>
            <Slider
              value={atRisk * 100}
              onChange={(_, value) => handleSliderChange('atRisk', value as number)}
              min={0}
              max={100}
              step={1}
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
              Impacted Threshold
              <span style={{ color: '#6B7280' }}>
                {formatValue(impacted)}
              </span>
            </Box>
            <Slider
              value={impacted * 100}
              onChange={(_, value) => handleSliderChange('impacted', value as number)}
              min={0}
              max={100}
              step={1}
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

      <DialogActions sx={{ 
        borderTop: '1px solid #E5E7EB',
        px: 3,
        py: 2
      }}>
        <Button 
          onClick={onClose}
          disabled={isLoading}
          sx={{ 
            color: '#6B7280',
            '&:hover': { backgroundColor: '#F3F4F6' }
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={isLoading || Boolean(error)}
          sx={{ 
            backgroundColor: '#1e40af',
            '&:hover': { backgroundColor: '#1e3a8a' }
          }}
        >
          {isLoading ? 'Saving...' : 'Save Changes'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}; 