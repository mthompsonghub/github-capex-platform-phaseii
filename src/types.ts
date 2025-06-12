export type ProjectStatus = 'Not Started' | 'In Progress' | 'Completed' | 'N/A' | 'Impacted' | 'Active';
export type ProjectPriority = 'Critical' | 'High' | 'Medium' | 'Low';

export interface ProjectPhases {
  id: string;
  project_id: string;
  // Feasibility
  feasibility_start: string | null;
  feasibility_end: string | null;
  feasibility_targeted_status: number;
  feasibility_actual_status: number;
  feasibility_milestones: any[];
  // Planning
  planning_start: string | null;
  planning_end: string | null;
  planning_targeted_status: number;
  planning_actual_status: number;
  planning_milestones: any[];
  // Execution
  execution_start: string | null;
  execution_end: string | null;
  execution_targeted_status: number;
  execution_actual_status: number;
  execution_milestones: any[];
  // Close
  close_start: string | null;
  close_end: string | null;
  close_targeted_status: number;
  close_actual_status: number;
  close_milestones: any[];
  // Overall Progress
  targeted_project_completion: number;
  actual_project_completion: number;
  // Additional Info
  upcoming_milestone: string | null;
  comments_risk: string | null;
  yearly_budget: number | null;
  yearly_actual: number | null;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  name: string;
  owner: string;
  project_type: 'project' | 'asset_purchase';
  status: ProjectStatus;
  priority: ProjectPriority;
  start_date: string;
  end_date: string;
  phases: ProjectPhases;
  created_at: string;
  updated_at: string;
  created_by?: string;
  resource_order?: string[];
}

export interface Resource {
  id: string;
  name: string;
  title: string;
  department: string;
  created_at: string | null;
  updated_at: string | null;
}

export interface Allocation {
  id: string;
  project_id: string;
  resource_id: string;
  project_quarter_number: number;
  percentage: number;
  created_at: string | null;
  updated_at: string | null;
}

export interface Alert {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  duration?: number;
}

export interface QuarterGroup {
  year: number;
  quarters: {
    quarter: number;
    label: string;
  }[];
}

export interface PhaseWeight {
  project_type: 'project' | 'asset_purchase';
  phase: 'feasibility' | 'planning' | 'execution' | 'close';
  weight: number;
}

export interface KPITarget {
  id: string;
  project_id: string;
  phase: string;
  component: string;
  target_date: string;
  created_at: string;
  updated_at: string;
}

export interface KPIActual {
  id: string;
  project_id: string;
  phase: string;
  component: string;
  actual_value: number;
  created_at: string;
  updated_at: string;
}

export interface ProjectCompletion {
  project_id: string;
  phase: 'feasibility' | 'planning' | 'execution' | 'close';
  actual_completion: number;
  target_completion: number;
  completion_ratio: number;
} 