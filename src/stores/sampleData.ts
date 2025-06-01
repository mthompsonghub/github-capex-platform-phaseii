// Sample data for development
export const sampleProjects: Project[] = [
  {
    id: 'p1',
    name: 'Filling VHP Generator Implementation',
    status: 'Active',
    priority: 'Critical',
    start_date: '2024-01-01',
    end_date: '2025-12-31',
    resources_count: 5
  },
  {
    id: 'p2',
    name: 'Quality Control Lab Automation',
    status: 'Planned',
    priority: 'High',
    start_date: '2024-02-29',
    end_date: '2025-06-30',
    resources_count: 4
  },
  {
    id: 'p3',
    name: 'Warehouse Management System',
    status: 'On Hold',
    priority: 'Medium',
    start_date: '2024-02-01',
    end_date: '2025-09-30',
    resources_count: 6
  },
  {
    id: 'p4',
    name: 'Production Line Upgrade',
    status: 'Completed',
    priority: 'Low',
    start_date: '2024-06-01',
    end_date: '2026-03-31',
    resources_count: 8
  },
  {
    id: 'p5',
    name: 'Environmental Monitoring System',
    status: 'Active',
    priority: 'High',
    start_date: '2024-04-01',
    end_date: '2025-12-31',
    resources_count: 3
  }
];

export const sampleResources: Resource[] = [
  {
    id: 'r1',
    name: 'Victor Levy',
    title: 'Automation Engineer',
    department: 'Engineering'
  },
  {
    id: 'r2',
    name: 'Sarah Chen',
    title: 'Project Manager',
    department: 'Project Management'
  },
  {
    id: 'r3',
    name: 'Marcus Rodriguez',
    title: 'Quality Engineer',
    department: 'Quality'
  },
  {
    id: 'r4',
    name: 'Emma Thompson',
    title: 'Validation Specialist',
    department: 'Quality'
  },
  {
    id: 'r5',
    name: 'James Wilson',
    title: 'Process Engineer',
    department: 'Engineering'
  },
  {
    id: 'r6',
    name: 'Ana Silva',
    title: 'Controls Engineer',
    department: 'Engineering'
  },
  {
    id: 'r7',
    name: 'David Park',
    title: 'Quality Manager',
    department: 'Quality'
  },
  {
    id: 'r8',
    name: 'Lisa Johnson',
    title: 'Automation Engineer',
    department: 'Engineering'
  }
];

// Extended sample allocations covering Q3 2024 to Q3 2026
export const sampleAllocations: Allocation[] = [
  // Project 1 - Critical Priority
  { id: 'a1', project_id: 'p1', resource_id: 'r1', year: 2024, quarter: 3, percentage: 85 },
  { id: 'a2', project_id: 'p1', resource_id: 'r1', year: 2024, quarter: 4, percentage: 75 },
  { id: 'a3', project_id: 'p1', resource_id: 'r2', year: 2025, quarter: 1, percentage: 60 },
  { id: 'a4', project_id: 'p1', resource_id: 'r6', year: 2025, quarter: 2, percentage: 90 },
  { id: 'a5', project_id: 'p1', resource_id: 'r8', year: 2025, quarter: 3, percentage: 45 },
  { id: 'a6', project_id: 'p1', resource_id: 'r1', year: 2025, quarter: 4, percentage: 70 },
  { id: 'a7', project_id: 'p1', resource_id: 'r2', year: 2026, quarter: 1, percentage: 55 },
  { id: 'a8', project_id: 'p1', resource_id: 'r6', year: 2026, quarter: 2, percentage: 85 },
  { id: 'a9', project_id: 'p1', resource_id: 'r8', year: 2026, quarter: 3, percentage: 40 },

  // Project 2 - High Priority
  { id: 'a10', project_id: 'p2', resource_id: 'r3', year: 2024, quarter: 3, percentage: 75 },
  { id: 'a11', project_id: 'p2', resource_id: 'r4', year: 2024, quarter: 4, percentage: 65 },
  { id: 'a12', project_id: 'p2', resource_id: 'r7', year: 2025, quarter: 1, percentage: 85 },
  { id: 'a13', project_id: 'p2', resource_id: 'r3', year: 2025, quarter: 2, percentage: 70 },
  { id: 'a14', project_id: 'p2', resource_id: 'r4', year: 2025, quarter: 3, percentage: 55 },
  { id: 'a15', project_id: 'p2', resource_id: 'r7', year: 2025, quarter: 4, percentage: 80 },
  { id: 'a16', project_id: 'p2', resource_id: 'r3', year: 2026, quarter: 1, percentage: 60 },
  { id: 'a17', project_id: 'p2', resource_id: 'r4', year: 2026, quarter: 2, percentage: 45 },
  { id: 'a18', project_id: 'p2', resource_id: 'r7', year: 2026, quarter: 3, percentage: 75 },

  // Project 3 - Medium Priority
  { id: 'a19', project_id: 'p3', resource_id: 'r2', year: 2024, quarter: 3, percentage: 35 },
  { id: 'a20', project_id: 'p3', resource_id: 'r5', year: 2024, quarter: 4, percentage: 95 },
  { id: 'a21', project_id: 'p3', resource_id: 'r8', year: 2025, quarter: 1, percentage: 70 },
  { id: 'a22', project_id: 'p3', resource_id: 'r2', year: 2025, quarter: 2, percentage: 40 },
  { id: 'a23', project_id: 'p3', resource_id: 'r5', year: 2025, quarter: 3, percentage: 85 },
  { id: 'a24', project_id: 'p3', resource_id: 'r8', year: 2025, quarter: 4, percentage: 65 },
  { id: 'a25', project_id: 'p3', resource_id: 'r2', year: 2026, quarter: 1, percentage: 30 },
  { id: 'a26', project_id: 'p3', resource_id: 'r5', year: 2026, quarter: 2, percentage: 90 },
  { id: 'a27', project_id: 'p3', resource_id: 'r8', year: 2026, quarter: 3, percentage: 75 },

  // Project 4 - Low Priority
  { id: 'a28', project_id: 'p4', resource_id: 'r1', year: 2024, quarter: 3, percentage: 45 },
  { id: 'a29', project_id: 'p4', resource_id: 'r6', year: 2024, quarter: 4, percentage: 65 },
  { id: 'a30', project_id: 'p4', resource_id: 'r8', year: 2025, quarter: 1, percentage: 80 },
  { id: 'a31', project_id: 'p4', resource_id: 'r1', year: 2025, quarter: 2, percentage: 50 },
  { id: 'a32', project_id: 'p4', resource_id: 'r6', year: 2025, quarter: 3, percentage: 70 },
  { id: 'a33', project_id: 'p4', resource_id: 'r8', year: 2025, quarter: 4, percentage: 75 },
  { id: 'a34', project_id: 'p4', resource_id: 'r1', year: 2026, quarter: 1, percentage: 55 },
  { id: 'a35', project_id: 'p4', resource_id: 'r6', year: 2026, quarter: 2, percentage: 60 },
  { id: 'a36', project_id: 'p4', resource_id: 'r8', year: 2026, quarter: 3, percentage: 85 },

  // Project 5 - High Priority
  { id: 'a37', project_id: 'p5', resource_id: 'r3', year: 2024, quarter: 3, percentage: 40 },
  { id: 'a38', project_id: 'p5', resource_id: 'r4', year: 2024, quarter: 4, percentage: 85 },
  { id: 'a39', project_id: 'p5', resource_id: 'r7', year: 2025, quarter: 1, percentage: 60 },
  { id: 'a40', project_id: 'p5', resource_id: 'r3', year: 2025, quarter: 2, percentage: 45 },
  { id: 'a41', project_id: 'p5', resource_id: 'r4', year: 2025, quarter: 3, percentage: 80 },
  { id: 'a42', project_id: 'p5', resource_id: 'r7', year: 2025, quarter: 4, percentage: 55 },
  { id: 'a43', project_id: 'p5', resource_id: 'r3', year: 2026, quarter: 1, percentage: 35 },
  { id: 'a44', project_id: 'p5', resource_id: 'r4', year: 2026, quarter: 2, percentage: 75 },
  { id: 'a45', project_id: 'p5', resource_id: 'r7', year: 2026, quarter: 3, percentage: 50 }
];