# KPI Tracking System Documentation

## Overview
The KPI (Key Performance Indicator) tracking system is designed to monitor and evaluate project progress across different phases. It provides real-time updates, progress visualization, and reporting capabilities for both regular projects and asset purchases.

## Project Types and Phase Weights

### Regular Projects
- Feasibility (15%)
- Planning (35%)
- Execution (45%)
- Close (5%)

### Asset Purchases
- Planning (45%)
- Execution (50%)
- Close (5%)

## Features

### Real-time Updates
- Automatic UI updates when KPI data changes
- Supabase subscriptions for live data synchronization
- Toast notifications for user feedback

### Progress Tracking
- Overall project completion percentage
- Phase-by-phase breakdown
- Expected vs actual progress comparison
- Visual status indicators (green/yellow/red)
- On-track/behind schedule indicators

### Data Export
- CSV export functionality
- Includes:
  * Project details
  * Phase information
  * Target and completion dates
  * Status and variance analysis

## Technical Implementation

### Database Tables

#### KPI Targets
```sql
create table public.kpi_targets (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid references public.projects(id),
  phase text not null,
  component text not null,
  target_date timestamp with time zone not null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);
```

#### KPI Actuals
```sql
create table public.kpi_actuals (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid references public.projects(id),
  phase text not null,
  component text not null,
  completion_date timestamp with time zone not null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);
```

### State Management
The system uses Zustand for state management with the following stores:
- `kpiStore`: Manages KPI targets and actuals
- `dataStore`: Handles project data

### Components

#### KPIDashboard
Main container component that:
- Displays all project KPIs
- Handles data fetching and real-time updates
- Manages export functionality

#### KPICard
Individual project card showing:
- Project name and status
- Overall completion percentage
- Phase-by-phase progress
- Visual indicators

### Calculations

#### Project Completion
```typescript
function calculateProjectCompletion(targets: KPITarget[], actuals: KPIActual[]) {
  // Groups targets and actuals by phase
  // Calculates actual and expected completion percentages
  // Returns completion metrics and phase breakdowns
}
```

## Usage

### Viewing KPIs
1. Navigate to the KPI Overview page
2. View overall project status
3. Click on individual cards for detailed phase information

### Exporting Data
1. Click the "Export Report" button
2. Choose save location for the CSV file
3. Open in spreadsheet software for analysis

### Real-time Updates
- Changes are automatically reflected in the UI
- Toast notifications confirm updates
- No manual refresh required

## Best Practices

### Setting Targets
1. Define clear phase components
2. Set realistic target dates
3. Consider dependencies between phases
4. Account for project type differences

### Monitoring Progress
1. Regularly update actual completions
2. Review variance reports
3. Address delays promptly
4. Track phase dependencies

### Data Analysis
1. Export regular reports
2. Compare across projects
3. Identify common bottlenecks
4. Use data for future planning

## Troubleshooting

### Common Issues
1. Data not updating
   - Check internet connection
   - Verify Supabase connection
   - Refresh the page

2. Export fails
   - Check browser permissions
   - Ensure data is loaded
   - Try again after a few seconds

3. Progress calculation issues
   - Verify target dates
   - Check phase weights
   - Validate component completion

## Future Enhancements
1. Advanced filtering options
2. Custom phase weights
3. Milestone tracking
4. Performance analytics
5. Integration with project timelines 