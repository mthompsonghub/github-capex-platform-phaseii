import React from 'react';
import { TableColumnGroup } from '../../../types/table';
import { CapExRecord } from '../../../types/capex';
import { CheckCircle2, XCircle } from 'lucide-react';
import { twMerge } from 'tailwind-merge';

const renderStatusCell = (value: number) => {
  if (value === 100) {
    return <CheckCircle2 className="w-5 h-5 text-green-600" />;
  } else if (value === 0) {
    return <XCircle className="w-5 h-5 text-red-600" />;
  }
  return value ? `${value}%` : '';
};

const renderPhaseField = (value: { value: number; isNA: boolean }) => {
  if (value.isNA) {
    return <span className="text-gray-400">N/A</span>;
  }
  
  let bgColorClass = 'bg-red-100 text-red-800';
  if (value.value >= 80) bgColorClass = 'bg-green-100 text-green-800';
  else if (value.value >= 50) bgColorClass = 'bg-yellow-100 text-yellow-800';
  
  return (
    <div className="flex justify-center">
      <span className={twMerge('px-2 py-1 rounded text-sm font-medium', bgColorClass)}>
        {value.value}%
      </span>
    </div>
  );
};

const renderProjectStatus = (value: string) => {
  let colorClass = 'bg-gray-100 text-gray-800';
  if (value === 'On Track') colorClass = 'bg-green-100 text-green-800';
  else if (value === 'At Risk') colorClass = 'bg-yellow-100 text-yellow-800';
  else if (value === 'Impacted') colorClass = 'bg-red-100 text-red-800';
  
  return (
    <div className="flex justify-center">
      <span className={twMerge('px-2 py-1 rounded text-sm font-medium', colorClass)}>
        {value}
      </span>
    </div>
  );
};

const renderPercentage = (value: number) => {
  let bgColorClass = 'bg-red-100 text-red-800';
  if (value >= 80) bgColorClass = 'bg-green-100 text-green-800';
  else if (value >= 50) bgColorClass = 'bg-yellow-100 text-yellow-800';
  
  return (
    <div className="flex justify-end">
      <span className={twMerge('px-2 py-1 rounded text-sm font-medium', bgColorClass)}>
        {value}%
      </span>
    </div>
  );
};

const renderCurrency = (value: number) => {
  return (
    <div className="text-right font-medium">
      ${value?.toLocaleString()}K
    </div>
  );
};

export const columnGroups: TableColumnGroup<CapExRecord>[] = [
  {
    title: 'Project Information',
    children: [
      {
        key: 'project_owner',
        title: 'Project Owner',
        width: 150,
        sorter: true,
      },
      {
        key: 'project_name',
        title: 'Name',
        width: 300,
        sorter: true,
      },
      {
        key: 'section',
        title: 'Type',
        width: 150,
        sorter: true,
      },
    ],
  },
  {
    title: 'Finance Status',
    children: [
      {
        key: 'yearly_budget',
        title: 'Yearly Budget ($ \'000s)',
        width: 150,
        render: renderCurrency,
        className: 'text-right',
      },
      {
        key: 'yearly_actual',
        title: 'Yearly Actual ($ \'000s)',
        width: 150,
        render: renderCurrency,
        className: 'text-right',
      },
      {
        key: 'actual_yearly_spent',
        title: 'Actual Yearly Spent (%)',
        width: 150,
        render: renderPercentage,
      },
    ],
  },
  {
    title: 'CapEx Process',
    children: [
      {
        title: 'Feasibility',
        children: [
          {
            key: 'risk_assessment',
            title: 'Risk Assessment',
            width: 120,
            render: renderPhaseField,
            className: 'text-center',
          },
          {
            key: 'project_charter',
            title: 'Project Charter',
            width: 120,
            render: renderPhaseField,
            className: 'text-center',
          },
          {
            key: 'feasibility_status',
            title: 'Feasibility Status',
            width: 120,
            render: renderStatusCell,
            className: 'text-center',
          },
        ],
      },
      {
        title: 'Planning',
        children: [
          {
            key: 'rfq_package',
            title: 'RFQ Package',
            width: 120,
            render: renderPhaseField,
            className: 'text-center',
          },
          {
            key: 'validation_strategy',
            title: 'Validation Strategy',
            width: 120,
            render: renderPhaseField,
            className: 'text-center',
          },
          {
            key: 'financial_forecast',
            title: 'Financial Forecast',
            width: 120,
            render: renderPhaseField,
            className: 'text-center',
          },
          {
            key: 'vendor_solicitation',
            title: 'Vendor Solicitation',
            width: 120,
            render: renderPhaseField,
            className: 'text-center',
          },
          {
            key: 'gantt_chart',
            title: 'Gantt Chart',
            width: 120,
            render: renderPhaseField,
            className: 'text-center',
          },
          {
            key: 'ses_asset_number_approval',
            title: 'SES Asset Number Approval',
            width: 150,
            render: renderPhaseField,
            className: 'text-center',
          },
          {
            key: 'planning_status',
            title: 'Planning Status',
            width: 120,
            render: renderStatusCell,
            className: 'text-center',
          },
        ],
      },
      {
        title: 'Execution',
        children: [
          {
            key: 'po_submission',
            title: 'PO Submission',
            width: 120,
            render: renderPhaseField,
            className: 'text-center',
          },
          {
            key: 'equipment_design',
            title: 'Equipment Design',
            width: 120,
            render: renderPhaseField,
            className: 'text-center',
          },
          {
            key: 'equipment_build',
            title: 'Equipment Build',
            width: 120,
            render: renderPhaseField,
            className: 'text-center',
          },
          {
            key: 'project_documentation',
            title: 'Project Documentation',
            width: 150,
            render: renderPhaseField,
            className: 'text-center',
          },
          {
            key: 'demo_install',
            title: 'Demo/Install',
            width: 120,
            render: renderPhaseField,
            className: 'text-center',
          },
          {
            key: 'validation',
            title: 'Validation',
            width: 120,
            render: renderPhaseField,
            className: 'text-center',
          },
          {
            key: 'equipment_turnover',
            title: 'Equipment Turnover',
            width: 150,
            render: renderPhaseField,
            className: 'text-center',
          },
          {
            key: 'go_live',
            title: 'Go-Live',
            width: 120,
            render: renderPhaseField,
            className: 'text-center',
          },
          {
            key: 'execution_status',
            title: 'Execution Status',
            width: 120,
            render: renderStatusCell,
            className: 'text-center',
          },
        ],
      },
      {
        title: 'Close',
        children: [
          {
            key: 'po_closure',
            title: 'PO Closure',
            width: 120,
            render: renderPhaseField,
            className: 'text-center',
          },
          {
            key: 'project_turnover',
            title: 'Project Turnover',
            width: 120,
            render: renderPhaseField,
            className: 'text-center',
          },
          {
            key: 'close_status',
            title: 'Close Status',
            width: 120,
            render: renderStatusCell,
            className: 'text-center',
          },
        ],
      },
    ],
  },
  {
    title: 'Metrics',
    children: [
      {
        key: 'project_status',
        title: 'Project Status',
        width: 150,
        render: renderProjectStatus,
        sorter: true,
      },
      {
        key: 'actual_project_completion',
        title: 'Actual Project Completion',
        width: 150,
        render: renderPercentage,
      },
      {
        key: 'total_ratio_uncapped',
        title: 'Total Ratio: Actual/Target (Uncapped)',
        width: 200,
        render: renderPercentage,
      },
      {
        key: 'total_actual_target',
        title: 'Total Actual/Target',
        width: 150,
        render: renderPercentage,
      },
      {
        key: 'upcoming_milestone',
        title: 'Upcoming Milestone',
        width: 300,
        render: (value: string) => (
          <div className="whitespace-pre-wrap">{value}</div>
        ),
      },
      {
        key: 'comments_risk',
        title: 'Comments/Risk',
        width: 300,
        render: (value: string) => (
          <div className="whitespace-pre-wrap">{value}</div>
        ),
      },
    ],
  },
]; 