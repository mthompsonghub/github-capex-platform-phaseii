import React from 'react';
import { Box, Card, CardContent, Grid, Typography, LinearProgress, Alert } from '@mui/material';
import { Project } from '../data/capexData';

interface FinancialPerformanceMetricsProps {
  project: Project;
}

export const FinancialPerformanceMetrics: React.FC<FinancialPerformanceMetricsProps> = ({ project }) => {
  const {
    totalBudget,
    totalActual,
    startDate,
    endDate
  } = project;

  // Calculate metrics
  const budgetUtilization = totalBudget > 0 ? (totalActual / totalBudget) * 100 : 0;
  const isOverBudget = totalActual > totalBudget;
  const isNearLimit = budgetUtilization >= 90 && !isOverBudget;

  // Calculate spend rate
  const today = new Date();
  const projectStart = new Date(startDate);
  const projectEnd = new Date(endDate);
  const totalDays = Math.max(1, Math.ceil((projectEnd.getTime() - projectStart.getTime()) / (1000 * 60 * 60 * 24)));
  const daysElapsed = Math.max(0, Math.ceil((today.getTime() - projectStart.getTime()) / (1000 * 60 * 60 * 24)));
  const expectedProgress = (daysElapsed / totalDays) * 100;
  const actualProgress = budgetUtilization;
  const spendRate = totalActual / daysElapsed;

  // Calculate projected completion cost
  const projectedCost = actualProgress > 0 ? (totalActual / actualProgress) * 100 : totalBudget;
  const costVariance = projectedCost - totalBudget;

  return (
    <Box sx={{ mt: 3 }}>
      <Grid container spacing={3}>
        {/* Budget vs Actual Card */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Budget vs Actual
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Budget Utilization
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={Math.min(budgetUtilization, 100)}
                  color={isOverBudget ? 'error' : isNearLimit ? 'warning' : 'primary'}
                  sx={{ height: 10, borderRadius: 5, mb: 1 }}
                />
                <Typography variant="body2" color="text.secondary">
                  {budgetUtilization.toFixed(1)}% utilized
                </Typography>
              </Box>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Total Budget
                  </Typography>
                  <Typography variant="h6">
                    ${totalBudget.toLocaleString()}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Total Actual
                  </Typography>
                  <Typography variant="h6" color={isOverBudget ? 'error.main' : 'inherit'}>
                    ${totalActual.toLocaleString()}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Performance Metrics Card */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Performance Metrics
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Daily Spend Rate
                  </Typography>
                  <Typography variant="h6">
                    ${spendRate.toLocaleString(undefined, { maximumFractionDigits: 0 })}/day
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Projected Cost
                  </Typography>
                  <Typography variant="h6" color={costVariance > 0 ? 'error.main' : 'success.main'}>
                    ${projectedCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Expected Progress
                  </Typography>
                  <Typography variant="h6">
                    {expectedProgress.toFixed(1)}%
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Actual Progress
                  </Typography>
                  <Typography variant="h6">
                    {actualProgress.toFixed(1)}%
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Budget Status Warnings */}
        {(isOverBudget || isNearLimit) && (
          <Grid item xs={12}>
            <Alert 
              severity={isOverBudget ? 'error' : 'warning'}
              sx={{ mt: 2 }}
            >
              {isOverBudget 
                ? 'Project is over budget. Please review spending and update financial notes with justification.'
                : 'Project is approaching budget limit. Monitor spending closely.'}
            </Alert>
          </Grid>
        )}
      </Grid>
    </Box>
  );
}; 