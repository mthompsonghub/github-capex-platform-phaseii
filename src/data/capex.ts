import { CapExRecord, ProjectOwner } from '../types/capex-unified';

export const PROJECT_OWNERS: ProjectOwner[] = [
  { id: 'tb', name: 'T. Bolt', initials: 'TB' },
  { id: 'vl', name: 'V. Levy', initials: 'VL' },
  { id: 'sj', name: 'S. Johnson', initials: 'SJ' },
  { id: 'kb', name: 'K. Brown', initials: 'KB' },
  { id: 'mt', name: 'M. Thompson', initials: 'MT' },
  { id: 'kw', name: 'K. Wheeler', initials: 'KW' },
  { id: 'bb', name: 'B. Bussey', initials: 'BB' },
  { id: 'mr', name: 'M. Ribeiro', initials: 'MR' },
  { id: 'ma', name: 'M. Adams', initials: 'MA' },
  { id: 'dh', name: 'D. Hotsinpiller', initials: 'DH' },
  { id: 'zw', name: 'Z. Wilson', initials: 'ZW' },
  { id: 'ea', name: 'E. Ayres', initials: 'EA' },
];

export const INITIAL_DATA: CapExRecord[] = [
  // Projects Section
  {
    id: '1',
    section: 'Projects',
    project_owner: 'T. Bolt',
    project_name: 'Cardinal Capital Project',
    yearly_budget: 1604,
    yearly_actual: 123,
    actual_yearly_spent: 8,
    risk_assessment: 'N/A',
    project_charter: 'N/A',
    feasibility_status: 0,
    rfq_package: 'N/A',
    validation_strategy: 'N/A',
    financial_forecast: 'N/A',
    vendor_solicitation: 'N/A',
    gantt_chart: 'N/A',
    ses_asset_number_approval: 'N/A',
    planning_status: 0,
    po_submission: 'N/A',
    equipment_design: 'N/A',
    equipment_build: 'N/A',
    project_documentation: 'N/A',
    demo_install: 'N/A',
    validation: 'N/A',
    equipment_turnover: 'N/A',
    go_live: 'N/A',
    execution_status: 0,
    po_closure: 'N/A',
    project_turnover: 'N/A',
    close_status: 0,
    project_status: 'On Track',
    actual_project_completion: 0,
    total_ratio_uncapped: 0,
    total_actual_target: 0,
    upcoming_milestone: 'Project Charter Review',
    comments_risk: 'Awaiting stakeholder feedback',
  },
  {
    id: '2',
    section: 'Projects',
    project_owner: 'M. Smith',
    project_name: 'DeltaV Migration',
    yearly_budget: 2500,
    yearly_actual: 1250,
    actual_yearly_spent: 50,
    risk_assessment: '75%',
    project_charter: '90%',
    feasibility_status: 83,
    rfq_package: '80%',
    validation_strategy: '75%',
    financial_forecast: '100%',
    vendor_solicitation: '90%',
    gantt_chart: '85%',
    ses_asset_number_approval: '100%',
    planning_status: 88,
    po_submission: '100%',
    equipment_design: '75%',
    equipment_build: '46%',
    project_documentation: '46%',
    demo_install: '0%',
    validation: '0%',
    equipment_turnover: '0%',
    go_live: '0%',
    execution_status: 36,
    po_closure: '0%',
    project_turnover: '0%',
    close_status: 0,
    project_status: 'On Track',
    actual_project_completion: 52,
    total_ratio_uncapped: 0,
    total_actual_target: 0,
    upcoming_milestone: 'Equipment Build Phase',
    comments_risk: 'Supply chain delays possible',
  },
  {
    id: '3',
    section: 'Asset Purchases',
    project_owner: 'R. Johnson',
    project_name: 'Capital IT Server Replacement',
    yearly_budget: 750,
    yearly_actual: 600,
    actual_yearly_spent: 80,
    risk_assessment: '100%',
    project_charter: '100%',
    feasibility_status: 100,
    rfq_package: '100%',
    validation_strategy: '100%',
    financial_forecast: '100%',
    vendor_solicitation: '100%',
    gantt_chart: '100%',
    ses_asset_number_approval: '100%',
    planning_status: 100,
    po_submission: '100%',
    equipment_design: '100%',
    equipment_build: '90%',
    project_documentation: '85%',
    demo_install: '75%',
    validation: '46%',
    equipment_turnover: '0%',
    go_live: '0%',
    execution_status: 63,
    po_closure: '0%',
    project_turnover: '0%',
    close_status: 0,
    project_status: 'On Track',
    actual_project_completion: 66,
    total_ratio_uncapped: 0,
    total_actual_target: 0,
    upcoming_milestone: 'Validation Testing',
    comments_risk: 'On schedule',
  }
]; 