export type Project = {
  id: string;
  name: string;
  status: ProjectStatus;
  priority: 'Critical' | 'High' | 'Medium' | 'Low';
  start_date: string;
  end_date: string;
  created_at?: string;
  updated_at?: string;
  created_by?: string;
  resource_order?: string[];
};

export type Resource = {
  id: string;
  name: string;
  title: string;
  department: string;
};

export type Allocation = {
  id: string;
  project_id: string;
  resource_id: string;
  project_quarter_number: number;
  percentage: number;
};

export type CalendarAllocation = {
  id: string;
  project_id: string;
  resource_id: string;
  percentage: number;
  calendar_year: number;
  calendar_quarter: number;
};

export type QuarterGroup = {
  year: number;
  quarters: {
    quarter: number;
    label: string;
  }[];
};

export type Alert = {
  type: 'warning' | 'error';
  message: string;
  details?: string;
};

export type OutOfBoundsAlert = {
  projectId: string;
  allocations: Allocation[];
};

export type OverAllocationAlert = {
  resource: Resource;
  quarter: { year: number; quarter: number };
  totalPercentage: number;
};

export interface KPITarget {
  id: string;
  project_id: string;
  phase: string;
  component: string;
  target_date: string;
  created_at?: string;
  updated_at?: string;
}

export interface KPIActual {
  id: string;
  project_id: string;
  phase: string;
  component: string;
  completion_date: string;
  created_at?: string;
  updated_at?: string;
}

export type ProjectStatus = 'Active' | 'Inactive' | 'Planned' | 'Completed' | 'On Hold';