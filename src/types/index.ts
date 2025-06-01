export type Project = {
  id: string;
  name: string;
  status: 'Active' | 'Inactive' | 'Planned' | 'Completed' | 'On Hold';
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
  year: number;
  quarter: number;
  percentage: number;
};

export type QuarterGroup = {
  year: number;
  quarters: {
    quarter: number;
    label: string;
  }[];
};