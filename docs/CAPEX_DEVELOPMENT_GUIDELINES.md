# CapEx KPI Scorecard Development Guidelines

## Project Context
This document outlines the development guidelines for the React/TypeScript web application that replaces Excel-based CapEx tracking. The app is part of a larger platform but modifications should ONLY be made to CapEx-specific files.

## Critical Rules
- NEVER modify files outside `/src/components/capex/` unless explicitly listed as safe
- Always preserve existing functionality - this is a production system with 3 active projects
- Use Zustand for state management - do not introduce Redux or Context API
- Maintain TypeScript strict mode - no any types without justification

## File Structure & Safe Zones

### ✅ Safe to Modify:
```
src/
├── components/capex/
│   ├── admin/AdminConfig.tsx
│   ├── data/capexData.ts
│   ├── ProjectEditModal.tsx
│   ├── ProjectModalV2.tsx
│   └── ProjectRow.tsx
├── pages/KPIOverviewPage.tsx
├── types/capex.ts
└── utils/projectUtils.ts
```

### ❌ Do Not Modify (but can import/use):
```
src/
├── lib/supabase.ts              ← Use for DB queries
├── components/matrix/*          ← Operational system
├── components/user-management/* ← Operational system
└── types/roles.ts              ← Use for permissions
```

## Code Patterns

### 1. Zustand Store Pattern
```typescript
// Good - Using selectors for performance
const projects = useProjectStore(state => state.projects);
const updateProject = useProjectStore(state => state.updateProject);

// Bad - Subscribing to entire store
const store = useProjectStore();
```

### 2. Database Queries
```typescript
// Always use try-catch with Supabase
try {
  const { data, error } = await supabase
    .from('capex_projects')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data;
} catch (error) {
  console.error('Database error:', error);
  // Handle gracefully
}
```

### 3. Type Safety
```typescript
// Define explicit types for all data structures
interface Project {
  id: string;
  name: string;
  completion: number; // 0-100
  phases: {
    feasibility: PhaseData;
    planning: PhaseData;
    execution: PhaseData;
    close: PhaseData;
  };
}

// Use type guards
const isValidProject = (data: unknown): data is Project => {
  return typeof data === 'object' && data !== null && 'id' in data;
};
```

## Common Gotchas & Solutions

### 1. Completion Percentages
- Database stores as integers (0-100)
- UI may expect decimals (0.0-1.0)
- Always verify which format you're working with

### 2. Async State Updates
```typescript
// Good - Handles race conditions
useEffect(() => {
  let mounted = true;
  
  const loadData = async () => {
    const data = await fetchProjects();
    if (mounted) {
      setProjects(data);
    }
  };
  
  loadData();
  return () => { mounted = false; };
}, []);
```

### 3. Modal State Management
- Modal open/close state is in KPIOverviewPage
- Modal content state should be in Zustand
- Don't mix UI state with business logic

## Testing Approach
Before committing any changes:
1. Verify dashboard loads without errors
2. Check all 3 projects display correctly
3. Test modal opening/closing
4. Ensure calculations match expected values
5. No console errors in development mode

## Phase 2.2 Implementation Guide
After fixing the current bug, implement modals with these tabs:

### Tab 1: Basic Info
- Project name, type, owner
- Status and overall completion
- Budget vs actual spending

### Tab 2: Status & Milestones
- Phase completion sliders
- Milestone dates and status
- Timeline visualization

### Tab 3: Financial Details
- Detailed budget breakdown
- ROI calculations
- Approval status

## Helpful Commands
```bash
# Start development server
npm run dev

# Type checking
npm run type-check

# Test database connection
npm run test:db

# Build for production
npm run build
```

## When Stuck
1. Check existing patterns in operational apps (matrix/user-management)
2. Refer to Zustand documentation for state management
3. Use Supabase dashboard to verify data structure
4. Add console.logs liberally during debugging (remove before commit)
5. Check browser DevTools Network tab for API issues

## Remember
- You're building for executives who need clean, professional interfaces
- The dashboard must be screenshot-ready at all times
- Performance matters - optimize re-renders
- This will be viewed on monitors, tablets, and during presentations 