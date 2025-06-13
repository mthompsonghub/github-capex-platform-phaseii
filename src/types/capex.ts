export type ProjectStatus = 'On Track' | 'At Risk' | 'Impacted';
export type ProjectSection = 'Projects' | 'Asset Purchases';
export type PhaseStatus = number | 'N/A';
export type StatusPercentage = '0%' | '25%' | '50%' | '75%' | '100%' | 'N/A';

export interface CapExActual {
  // Project Information
  project_id: string;
  project_owner: string;
  project_name: string;
  project_type: string;

  // Finance Status
  yearly_budget: number;
  yearly_actual: number;
  actual_yearly_spent: number;

  // Feasibility
  risk_assessment: number;
  project_charter: number;
  feasibility_status: number;

  // Planning
  rfq_package: number;
  validation_strategy: number;
  financial_forecast: number;
  vendor_solicitation: number;
  gantt_chart: number;
  ses_asset_number_approval: number;
  planning_status: number;

  // Execution
  po_submission: number;
  equipment_design: number;
  equipment_build: number;
  project_documentation: number;
  demo_install: number;
  validation: number;
  equipment_turnover: number;
  go_live: number;
  execution_status: number;

  // Close
  po_closure: number;
  project_turnover: number;
  close_status: number;

  // Metrics
  project_status: ProjectStatus;
  actual_project_completion: number;
  total_ratio_uncapped: number;
  total_actual_target: number;
  upcoming_milestone: string;
  comments_risk: string;

  // Metadata
  created_at: string;
  updated_at: string;
}

export interface Column {
  key: keyof CapExRecord;
  title: string;
  width?: number;
  type?: 'number' | 'percentage' | 'status' | 'text' | 'textarea';
  editable?: boolean;
  calculated?: boolean;
}

export interface ColumnGroup {
  title: string;
  children: Column[];
}

export interface TableState {
  searchText: string;
  filters: Record<string, string[]>;
  sortColumn?: keyof CapExActual;
  sortDirection: 'asc' | 'desc';
  currentPage: number;
  pageSize: number;
}

export interface ProjectOwner {
  id: string;
  name: string;
  initials: string;
}

export interface PhaseField {
  value: number;
  isNA: boolean;
}

export interface PhaseValue {
  value: number;
  isNA: boolean;
}

export interface ProgressMetric {
  target: number;
  actual: number;
}

export interface FinancialMetric {
  target: number;
  actual: number;
}

export interface SubItem {
  id: string;
  name: string;
  weight: number;
  target: number;
  actual: number;
  isNA: boolean;
  description?: string;
}

export interface Phase {
  id: string;
  name: string;
  weight: number;
  subItems: SubItem[];
  status: ProgressMetric;
}

export interface ProjectType {
  id: string;
  name: string;
  phaseWeights: {
    feasibility: number;
    planning: number;
    execution: number;
    close: number;
  };
}

export interface YearlyFinancials {
  year: number;
  yearly_budget: number;
  yearly_actual: number;
  actual_yearly_spent: number;
  q1_budget: number;
  q2_budget: number;
  q3_budget: number;
  q4_budget: number;
  q1_actual: number;
  q2_actual: number;
  q3_actual: number;
  q4_actual: number;
}

export interface CapExRecord {
  id: string;
  section: string;
  projectType: ProjectType;
  project_name: string;
  project_owner: string;
  start_date: string;
  end_date: string;
  total_budget: number;
  total_actual: number;
  total_spent_percentage: number;
  financials: YearlyFinancials[];
  current_year: number;
  project_status: string;
  actual_project_completion: number;
  target_project_completion: number;
  total_ratio_uncapped: number;
  total_actual_target: number;
  upcoming_milestone: string;
  comments_risk: string;

  // Phases
  feasibility: Phase;
  planning: Phase;
  execution: Phase;
  close: Phase;
}

// Helper function to calculate status averages
export function calculateStatusAverage(values: string[]): number {
  const validValues = values
    .filter(v => v !== 'N/A')
    .map(v => parseInt(v as string));
  
  if (validValues.length === 0) return 0;
  return Math.round(validValues.reduce((a, b) => a + b, 0) / validValues.length);
}

export const COLUMN_GROUPS: ColumnGroup[] = [
  {
    title: 'Project Information',
    children: [
      { key: 'project_owner', title: 'Project Owner', width: 150, type: 'text', editable: true },
      { key: 'project_name', title: 'Name', width: 300, type: 'text', editable: true },
      { key: 'start_date', title: 'Start Date', width: 120, type: 'text', editable: true },
      { key: 'end_date', title: 'End Date', width: 120, type: 'text', editable: true },
    ],
  },
  {
    title: 'Finance Status',
    children: [
      { key: 'total_budget', title: 'Total Budget ($ \'000s)', width: 150, type: 'number', editable: true },
      { key: 'total_actual', title: 'Total Actual ($ \'000s)', width: 150, type: 'number', editable: true },
      { key: 'total_spent_percentage', title: 'Total Spent (%)', width: 150, type: 'percentage', calculated: true },
    ],
  },
  {
    title: 'Feasibility',
    children: [
      { key: 'risk_assessment', title: 'Risk Assessment', width: 120, type: 'percentage', editable: true },
      { key: 'project_charter', title: 'Project Charter', width: 120, type: 'percentage', editable: true },
      { key: 'feasibility_status', title: 'Feasibility Status', width: 120, type: 'percentage', calculated: true },
    ],
  },
  {
    title: 'Planning',
    children: [
      { key: 'rfq_package', title: 'RFQ Package', width: 120, type: 'percentage', editable: true },
      { key: 'validation_strategy', title: 'Validation Strategy', width: 120, type: 'percentage', editable: true },
      { key: 'financial_forecast', title: 'Financial Forecast', width: 120, type: 'percentage', editable: true },
      { key: 'vendor_solicitation', title: 'Vendor Solicitation', width: 120, type: 'percentage', editable: true },
      { key: 'gantt_chart', title: 'Gantt Chart', width: 120, type: 'percentage', editable: true },
      { key: 'ses_asset_number_approval', title: 'SES Asset Number Approval', width: 150, type: 'percentage', editable: true },
      { key: 'planning_status', title: 'Planning Status', width: 120, type: 'percentage', calculated: true },
    ],
  },
  {
    title: 'Execution',
    children: [
      { key: 'po_submission', title: 'PO Submission', width: 120, type: 'percentage', editable: true },
      { key: 'equipment_design', title: 'Equipment Design', width: 120, type: 'percentage', editable: true },
      { key: 'equipment_build', title: 'Equipment Build', width: 120, type: 'percentage', editable: true },
      { key: 'project_documentation', title: 'Project Documentation/SOP', width: 150, type: 'percentage', editable: true },
      { key: 'demo_install', title: 'Demo/Install', width: 120, type: 'percentage', editable: true },
      { key: 'validation', title: 'Validation', width: 120, type: 'percentage', editable: true },
      { key: 'equipment_turnover', title: 'Equipment Turnover/Training', width: 150, type: 'percentage', editable: true },
      { key: 'go_live', title: 'Go-Live', width: 120, type: 'percentage', editable: true },
      { key: 'execution_status', title: 'Execution Status', width: 120, type: 'percentage', calculated: true },
    ],
  },
  {
    title: 'Close',
    children: [
      { key: 'po_closure', title: 'PO Closure', width: 120, type: 'percentage', editable: true },
      { key: 'project_turnover', title: 'Project Turnover', width: 120, type: 'percentage', editable: true },
      { key: 'close_status', title: 'Close Status', width: 120, type: 'percentage', calculated: true },
    ],
  },
  {
    title: 'Metrics',
    children: [
      { key: 'project_status', title: 'Project Status', width: 120, type: 'status', editable: true },
      { key: 'actual_project_completion', title: 'Actual Project Complete', width: 150, type: 'percentage', calculated: true },
      { key: 'total_ratio_uncapped', title: 'Total Ratio: Actual/Target (Uncapped)', width: 200, type: 'percentage', calculated: true },
      { key: 'total_actual_target', title: 'Total Actual/Target', width: 150, type: 'percentage', calculated: true },
    ],
  },
  {
    title: 'Project Status',
    children: [
      { key: 'upcoming_milestone', title: 'Upcoming Milestone', width: 300, type: 'text', editable: true },
      { key: 'comments_risk', title: 'Comment/Risk', width: 300, type: 'textarea', editable: true },
    ],
  },
];

export const STATUS_PERCENTAGES: StatusPercentage[] = ['0%', '25%', '50%', '75%', '100%', 'N/A'];

export interface ModalState<T> {
  isOpen: boolean;
  data: T | null;
}

export interface AdminSettings {
  onTrackThreshold: number;
  atRiskThreshold: number;
  showFinancials: boolean;
} 