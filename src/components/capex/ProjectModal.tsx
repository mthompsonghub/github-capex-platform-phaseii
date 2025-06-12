import React, { useState, useEffect } from 'react';
import { X, ChevronDown, ChevronRight } from 'lucide-react';
import { CapExRecord, ProjectSection, PhaseField, YearlyFinancials } from '../../types/capex';

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (record: CapExRecord) => void;
  mode: 'add' | 'edit';
  section?: ProjectSection;
  project?: CapExRecord;
}

const MODAL_TABS = [
  { id: 'basic', label: 'Basic Info' },
  { id: 'status', label: 'Status & Milestones' },
  { id: 'planning', label: 'Planning Details' },
  { id: 'financial', label: 'Financial Details' },
] as const;

interface PhaseInputProps {
  label: string;
  field: PhaseField;
  onChange: (value: PhaseField) => void;
  disabled?: boolean;
}

const baseInputStyles = 'mt-1 block w-full rounded-md border-gray-200 bg-white hover:border-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors duration-200 sm:text-sm';
const baseCheckboxStyles = 'rounded border-gray-200 text-blue-500 hover:border-gray-400 focus:ring-2 focus:ring-blue-200 transition-colors duration-200';
const baseRadioStyles = 'border-gray-200 text-blue-500 hover:border-gray-400 focus:ring-2 focus:ring-blue-200 transition-colors duration-200';

const PhaseInput: React.FC<PhaseInputProps> = ({ label, field, onChange, disabled = false }) => (
  <div className="flex items-center gap-4">
    <label className="block text-sm font-medium text-gray-700 flex-grow">{label}</label>
    <div className="flex items-center gap-2">
      <input
        type="number"
        min="0"
        max="100"
        disabled={disabled || field?.isNA}
        className={`w-20 ${baseInputStyles} ${disabled ? 'bg-gray-100' : ''}`}
        value={field?.isNA ? '' : field?.value ?? ''}
        onChange={(e) => onChange({ 
          value: Math.min(100, Math.max(0, parseInt(e.target.value) || 0)),
          isNA: false 
        })}
      />
      <span className="text-sm text-gray-500">%</span>
      <label className="inline-flex items-center">
        <input
          type="checkbox"
          disabled={disabled}
          className={baseCheckboxStyles}
          checked={field?.isNA ?? false}
          onChange={(e) => onChange({ 
            value: 0,
            isNA: e.target.checked 
          })}
        />
        <span className="ml-2 text-sm text-gray-500">N/A</span>
      </label>
    </div>
  </div>
);

interface PhaseSectionProps {
  title: string;
  completion: number;
  isExpanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

const PhaseSection: React.FC<PhaseSectionProps> = ({ title, completion, isExpanded, onToggle, children }) => (
  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
    <div className="flex items-center justify-between cursor-pointer" onClick={onToggle}>
      <div className="flex items-center gap-2">
        {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
        <h4 className="text-sm font-medium text-gray-900">{title}</h4>
      </div>
      <div className="text-sm font-medium text-gray-700">{completion}% Complete</div>
    </div>
    {isExpanded && (
      <div className="mt-4 space-y-4">
        {children}
      </div>
    )}
  </div>
);

// Helper function to calculate phase completion
const calculatePhaseCompletion = (fields: PhaseField[]): number => {
  const validFields = fields.filter(f => !f.isNA);
  if (validFields.length === 0) return 0;
  return Math.round(validFields.reduce((sum, f) => sum + f.value, 0) / validFields.length);
};

export function ProjectModal({
  isOpen,
  onClose,
  onSave,
  mode,
  section: initialSection = 'Projects',
  project,
}: ProjectModalProps) {
  const [activeTab, setActiveTab] = useState<typeof MODAL_TABS[number]['id']>('basic');
  const [section, setSection] = useState<ProjectSection>(initialSection);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['feasibility']));
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [formData, setFormData] = useState<Partial<CapExRecord>>({
    section: initialSection,
    project_status: 'On Track',
    feasibility_status: 0,
    planning_status: 0,
    execution_status: 0,
    close_status: 0,
    total_budget: 0,
    total_actual: 0,
    total_spent_percentage: 0,
    current_year: new Date().getFullYear(),
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0],
    financials: [{
      year: new Date().getFullYear(),
      yearly_budget: 0,
      yearly_actual: 0,
      actual_yearly_spent: 0,
      q1_budget: 0,
      q2_budget: 0,
      q3_budget: 0,
      q4_budget: 0,
      q1_actual: 0,
      q2_actual: 0,
      q3_actual: 0,
      q4_actual: 0,
    }],
    risk_assessment: { value: 0, isNA: false },
    project_charter: { value: 0, isNA: false },
    rfq_package: { value: 0, isNA: false },
    validation_strategy: { value: 0, isNA: false },
    financial_forecast: { value: 0, isNA: false },
    vendor_solicitation: { value: 0, isNA: false },
    gantt_chart: { value: 0, isNA: false },
    ses_asset_number_approval: { value: 0, isNA: false },
    po_submission: { value: 0, isNA: false },
    equipment_design: { value: 0, isNA: false },
    equipment_build: { value: 0, isNA: false },
    project_documentation: { value: 0, isNA: false },
    demo_install: { value: 0, isNA: false },
    validation: { value: 0, isNA: false },
    equipment_turnover: { value: 0, isNA: false },
    go_live: { value: 0, isNA: false },
    po_closure: { value: 0, isNA: false },
    project_turnover: { value: 0, isNA: false },
    upcoming_milestone: '',
    comments_risk: '',
    ...project,
  });

  useEffect(() => {
    if (project) {
      setSection(project.section);
      setFormData(project);
      if (project.current_year) {
        setSelectedYear(project.current_year);
      }
    }
  }, [project]);

  // Auto-calculate phase percentages whenever fields change
  useEffect(() => {
    const newData = { ...formData };
    let hasChanges = false;

    // Calculate feasibility status (Projects only)
    if (section === 'Projects') {
      const newFeasibilityStatus = calculatePhaseCompletion([
        newData.risk_assessment as PhaseField,
        newData.project_charter as PhaseField,
      ]);
      if (newFeasibilityStatus !== newData.feasibility_status) {
        newData.feasibility_status = newFeasibilityStatus;
        hasChanges = true;
      }
    }

    // Calculate planning status
    const newPlanningStatus = calculatePhaseCompletion([
      newData.rfq_package as PhaseField,
      newData.validation_strategy as PhaseField,
      newData.financial_forecast as PhaseField,
      newData.vendor_solicitation as PhaseField,
      newData.gantt_chart as PhaseField,
      newData.ses_asset_number_approval as PhaseField,
    ]);
    if (newPlanningStatus !== newData.planning_status) {
      newData.planning_status = newPlanningStatus;
      hasChanges = true;
    }

    // Calculate execution status
    const newExecutionStatus = calculatePhaseCompletion([
      newData.po_submission as PhaseField,
      newData.equipment_design as PhaseField,
      newData.equipment_build as PhaseField,
      newData.project_documentation as PhaseField,
      newData.demo_install as PhaseField,
      newData.validation as PhaseField,
      newData.equipment_turnover as PhaseField,
      newData.go_live as PhaseField,
    ]);
    if (newExecutionStatus !== newData.execution_status) {
      newData.execution_status = newExecutionStatus;
      hasChanges = true;
    }

    // Calculate close status
    const newCloseStatus = calculatePhaseCompletion([
      newData.po_closure as PhaseField,
      newData.project_turnover as PhaseField,
    ]);
    if (newCloseStatus !== newData.close_status) {
      newData.close_status = newCloseStatus;
      hasChanges = true;
    }

    // Calculate overall completion
    const phases = section === 'Projects' 
      ? [newData.feasibility_status || 0, newData.planning_status || 0, newData.execution_status || 0, newData.close_status || 0]
      : [newData.planning_status || 0, newData.execution_status || 0, newData.close_status || 0];
    
    const newCompletion = Math.round(phases.reduce((sum, val) => sum + val, 0) / phases.length);
    if (newCompletion !== newData.actual_project_completion) {
      newData.actual_project_completion = newCompletion;
      hasChanges = true;
    }

    // Only update state if there are actual changes
    if (hasChanges) {
      setFormData(newData);
    }
  }, [
    section,
    formData.risk_assessment,
    formData.project_charter,
    formData.rfq_package,
    formData.validation_strategy,
    formData.financial_forecast,
    formData.vendor_solicitation,
    formData.gantt_chart,
    formData.ses_asset_number_approval,
    formData.po_submission,
    formData.equipment_design,
    formData.equipment_build,
    formData.project_documentation,
    formData.demo_install,
    formData.validation,
    formData.equipment_turnover,
    formData.go_live,
    formData.po_closure,
    formData.project_turnover
  ]);

  const handleInputChange = (field: keyof CapExRecord, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFinancialChange = (field: keyof YearlyFinancials, value: number) => {
    setFormData(prev => {
      const financials = [...(prev.financials || [])];
      const yearIndex = financials.findIndex(f => f.year === selectedYear);
      
      if (yearIndex === -1) {
        // Add new year if it doesn't exist
        financials.push({
          year: selectedYear,
          yearly_budget: 0,
          yearly_actual: 0,
          actual_yearly_spent: 0,
          q1_budget: 0,
          q2_budget: 0,
          q3_budget: 0,
          q4_budget: 0,
          q1_actual: 0,
          q2_actual: 0,
          q3_actual: 0,
          q4_actual: 0,
          [field]: value
        });
      } else {
        // Update existing year
        financials[yearIndex] = {
          ...financials[yearIndex],
          [field]: value
        };
      }

      // Calculate yearly totals
      const yearData = financials[yearIndex === -1 ? financials.length - 1 : yearIndex];
      const yearlyBudget = yearData.q1_budget + yearData.q2_budget + yearData.q3_budget + yearData.q4_budget;
      const yearlyActual = yearData.q1_actual + yearData.q2_actual + yearData.q3_actual + yearData.q4_actual;
      const yearlySpent = yearlyBudget > 0 ? (yearlyActual / yearlyBudget) * 100 : 0;

      financials[yearIndex === -1 ? financials.length - 1 : yearIndex] = {
        ...yearData,
        yearly_budget: yearlyBudget,
        yearly_actual: yearlyActual,
        actual_yearly_spent: yearlySpent
      };

      // Calculate total project financials
      const totalBudget = financials.reduce((sum, f) => sum + f.yearly_budget, 0);
      const totalActual = financials.reduce((sum, f) => sum + f.yearly_actual, 0);
      const totalSpent = totalBudget > 0 ? (totalActual / totalBudget) * 100 : 0;

      return {
        ...prev,
        financials,
        total_budget: totalBudget,
        total_actual: totalActual,
        total_spent_percentage: totalSpent,
        current_year: selectedYear
      };
    });
  };

  const toggleSection = (sectionName: string) => {
    const newExpandedSections = new Set(expandedSections);
    if (expandedSections.has(sectionName)) {
      newExpandedSections.delete(sectionName);
    } else {
      newExpandedSections.add(sectionName);
    }
    setExpandedSections(newExpandedSections);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'add') {
      onSave({
        ...formData,
        id: crypto.randomUUID(),
        section,
      } as CapExRecord);
    } else {
      onSave(formData as CapExRecord);
    }
    onClose();
  };

  const renderBasicInfo = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Type</label>
        <div className="mt-1 flex flex-col space-y-2">
          <div className="flex space-x-4">
            <label className="inline-flex items-center">
              <input
                type="radio"
                className={`${baseRadioStyles} disabled:opacity-50`}
                checked={section === 'Projects'}
                onChange={() => setSection('Projects')}
                disabled={mode === 'edit'}
              />
              <span className="ml-2">Project</span>
            </label>
            <label className="inline-flex items-center">
              <input
                type="radio"
                className={`${baseRadioStyles} disabled:opacity-50`}
                checked={section === 'Asset Purchases'}
                onChange={() => setSection('Asset Purchases')}
                disabled={mode === 'edit'}
              />
              <span className="ml-2">Asset Purchase</span>
            </label>
          </div>
          {mode === 'edit' && (
            <p className="text-sm text-gray-500 italic">
              Item type cannot be changed after creation
            </p>
          )}
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Name</label>
        <input
          type="text"
          className={baseInputStyles}
          value={formData.project_name || ''}
          onChange={(e) => handleInputChange('project_name', e.target.value)}
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Owner</label>
        <input
          type="text"
          className={baseInputStyles}
          value={formData.project_owner || ''}
          onChange={(e) => handleInputChange('project_owner', e.target.value)}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Start Date</label>
          <input
            type="date"
            className={baseInputStyles}
            value={formData.start_date || ''}
            onChange={(e) => handleInputChange('start_date', e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">End Date</label>
          <input
            type="date"
            className={baseInputStyles}
            value={formData.end_date || ''}
            onChange={(e) => handleInputChange('end_date', e.target.value)}
          />
        </div>
      </div>
      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
        <h4 className="text-sm font-medium text-gray-900 mb-2">Project Financials</h4>
        <dl className="grid grid-cols-2 gap-4">
          <div>
            <dt className="text-sm text-gray-500">Total Budget</dt>
            <dd className="mt-1 text-sm text-gray-900">${formData.total_budget?.toLocaleString()}K</dd>
          </div>
          <div>
            <dt className="text-sm text-gray-500">Total Actual</dt>
            <dd className="mt-1 text-sm text-gray-900">${formData.total_actual?.toLocaleString()}K</dd>
          </div>
          <div>
            <dt className="text-sm text-gray-500">Total Spent</dt>
            <dd className="mt-1 text-sm text-gray-900">{formData.total_spent_percentage?.toFixed(1)}%</dd>
          </div>
        </dl>
      </div>
    </div>
  );

  const renderStatusAndMilestones = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Project Status</label>
        <div className="mt-1 p-2 rounded-md bg-gray-50 border border-gray-200">
          <span className={`inline-flex px-2 py-1 text-sm font-medium rounded-full ${
            formData.project_status === 'On Track' ? 'bg-green-100 text-green-800' :
            formData.project_status === 'At Risk' ? 'bg-yellow-100 text-yellow-800' :
            'bg-red-100 text-red-800'
          }`}>
            {formData.project_status}
          </span>
          <p className="mt-1 text-xs text-gray-500">
            Status is automatically calculated based on target vs actual completion
          </p>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Upcoming Milestone</label>
        <input
          type="text"
          className={baseInputStyles}
          value={formData.upcoming_milestone || ''}
          onChange={(e) => handleInputChange('upcoming_milestone', e.target.value)}
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Risk Comments</label>
        <textarea
          className={`${baseInputStyles} resize-none`}
          rows={3}
          value={formData.comments_risk || ''}
          onChange={(e) => handleInputChange('comments_risk', e.target.value)}
        />
      </div>
    </div>
  );

  const renderPlanningDetails = () => (
    <div className="space-y-6">
      {section === 'Projects' && (
        <PhaseSection
          title="Feasibility Phase"
          completion={formData.feasibility_status || 0}
          isExpanded={expandedSections.has('feasibility')}
          onToggle={() => toggleSection('feasibility')}
        >
          <PhaseInput
            label="Risk Assessment"
            field={formData.risk_assessment as PhaseField}
            onChange={(value) => handleInputChange('risk_assessment', value)}
          />
          <PhaseInput
            label="Project Charter"
            field={formData.project_charter as PhaseField}
            onChange={(value) => handleInputChange('project_charter', value)}
          />
        </PhaseSection>
      )}

      <PhaseSection
        title="Planning Phase"
        completion={formData.planning_status || 0}
        isExpanded={expandedSections.has('planning')}
        onToggle={() => toggleSection('planning')}
      >
        <PhaseInput
          label="RFQ Package"
          field={formData.rfq_package as PhaseField}
          onChange={(value) => handleInputChange('rfq_package', value)}
        />
        <PhaseInput
          label="Validation Strategy"
          field={formData.validation_strategy as PhaseField}
          onChange={(value) => handleInputChange('validation_strategy', value)}
        />
        <PhaseInput
          label="Financial Forecast"
          field={formData.financial_forecast as PhaseField}
          onChange={(value) => handleInputChange('financial_forecast', value)}
        />
        <PhaseInput
          label="Vendor Solicitation"
          field={formData.vendor_solicitation as PhaseField}
          onChange={(value) => handleInputChange('vendor_solicitation', value)}
        />
        <PhaseInput
          label="Gantt Chart"
          field={formData.gantt_chart as PhaseField}
          onChange={(value) => handleInputChange('gantt_chart', value)}
        />
        <PhaseInput
          label="SES Asset Number Approval"
          field={formData.ses_asset_number_approval as PhaseField}
          onChange={(value) => handleInputChange('ses_asset_number_approval', value)}
        />
      </PhaseSection>

      <PhaseSection
        title="Execution Phase"
        completion={formData.execution_status || 0}
        isExpanded={expandedSections.has('execution')}
        onToggle={() => toggleSection('execution')}
      >
        <PhaseInput
          label="PO Submission"
          field={formData.po_submission as PhaseField}
          onChange={(value) => handleInputChange('po_submission', value)}
        />
        <PhaseInput
          label="Equipment Design"
          field={formData.equipment_design as PhaseField}
          onChange={(value) => handleInputChange('equipment_design', value)}
        />
        <PhaseInput
          label="Equipment Build"
          field={formData.equipment_build as PhaseField}
          onChange={(value) => handleInputChange('equipment_build', value)}
        />
        <PhaseInput
          label="Project Documentation/SOP"
          field={formData.project_documentation as PhaseField}
          onChange={(value) => handleInputChange('project_documentation', value)}
        />
        <PhaseInput
          label="Demo/Install"
          field={formData.demo_install as PhaseField}
          onChange={(value) => handleInputChange('demo_install', value)}
        />
        <PhaseInput
          label="Validation"
          field={formData.validation as PhaseField}
          onChange={(value) => handleInputChange('validation', value)}
        />
        <PhaseInput
          label="Equipment Turnover/Training"
          field={formData.equipment_turnover as PhaseField}
          onChange={(value) => handleInputChange('equipment_turnover', value)}
        />
        <PhaseInput
          label="Go-Live"
          field={formData.go_live as PhaseField}
          onChange={(value) => handleInputChange('go_live', value)}
        />
      </PhaseSection>

      <PhaseSection
        title="Close Phase"
        completion={formData.close_status || 0}
        isExpanded={expandedSections.has('close')}
        onToggle={() => toggleSection('close')}
      >
        <PhaseInput
          label="PO Closure"
          field={formData.po_closure as PhaseField}
          onChange={(value) => handleInputChange('po_closure', value)}
        />
        <PhaseInput
          label="Project Turnover"
          field={formData.project_turnover as PhaseField}
          onChange={(value) => handleInputChange('project_turnover', value)}
        />
      </PhaseSection>

      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
        <h4 className="text-sm font-medium text-blue-900">Overall Progress: {formData.actual_project_completion}%</h4>
        <p className="mt-1 text-sm text-blue-700">
          Automatically calculated based on component completion (excludes N/A items)
        </p>
      </div>
    </div>
  );

  const renderFinancialDetails = () => {
    const currentYearData = formData.financials?.find(f => f.year === selectedYear) || {
      year: selectedYear,
      yearly_budget: 0,
      yearly_actual: 0,
      actual_yearly_spent: 0,
      q1_budget: 0,
      q2_budget: 0,
      q3_budget: 0,
      q4_budget: 0,
      q1_actual: 0,
      q2_actual: 0,
      q3_actual: 0,
      q4_actual: 0,
    };

    const startYear = formData.start_date ? new Date(formData.start_date).getFullYear() : new Date().getFullYear();
    const endYear = formData.end_date ? new Date(formData.end_date).getFullYear() : startYear;
    const years = Array.from({ length: endYear - startYear + 1 }, (_, i) => startYear + i);

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium text-gray-900">Financial Details</h4>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className={baseInputStyles}
          >
            {years.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h5 className="text-sm font-medium text-gray-700 mb-2">Quarterly Budget</h5>
              <div className="space-y-2">
                <div>
                  <label className="block text-xs text-gray-500">Q1 Budget ($K)</label>
                  <input
                    type="number"
                    className={baseInputStyles}
                    value={currentYearData.q1_budget || ''}
                    onChange={(e) => handleFinancialChange('q1_budget', parseFloat(e.target.value))}
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500">Q2 Budget ($K)</label>
                  <input
                    type="number"
                    className={baseInputStyles}
                    value={currentYearData.q2_budget || ''}
                    onChange={(e) => handleFinancialChange('q2_budget', parseFloat(e.target.value))}
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500">Q3 Budget ($K)</label>
                  <input
                    type="number"
                    className={baseInputStyles}
                    value={currentYearData.q3_budget || ''}
                    onChange={(e) => handleFinancialChange('q3_budget', parseFloat(e.target.value))}
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500">Q4 Budget ($K)</label>
                  <input
                    type="number"
                    className={baseInputStyles}
                    value={currentYearData.q4_budget || ''}
                    onChange={(e) => handleFinancialChange('q4_budget', parseFloat(e.target.value))}
                  />
                </div>
              </div>
            </div>
            <div>
              <h5 className="text-sm font-medium text-gray-700 mb-2">Quarterly Actual</h5>
              <div className="space-y-2">
                <div>
                  <label className="block text-xs text-gray-500">Q1 Actual ($K)</label>
                  <input
                    type="number"
                    className={baseInputStyles}
                    value={currentYearData.q1_actual || ''}
                    onChange={(e) => handleFinancialChange('q1_actual', parseFloat(e.target.value))}
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500">Q2 Actual ($K)</label>
                  <input
                    type="number"
                    className={baseInputStyles}
                    value={currentYearData.q2_actual || ''}
                    onChange={(e) => handleFinancialChange('q2_actual', parseFloat(e.target.value))}
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500">Q3 Actual ($K)</label>
                  <input
                    type="number"
                    className={baseInputStyles}
                    value={currentYearData.q3_actual || ''}
                    onChange={(e) => handleFinancialChange('q3_actual', parseFloat(e.target.value))}
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500">Q4 Actual ($K)</label>
                  <input
                    type="number"
                    className={baseInputStyles}
                    value={currentYearData.q4_actual || ''}
                    onChange={(e) => handleFinancialChange('q4_actual', parseFloat(e.target.value))}
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700">Current Year Spent</label>
            <div className="mt-1 p-2 rounded-md bg-gray-100 border border-gray-200">
              <span className="text-sm font-medium text-gray-900">
                {currentYearData.actual_yearly_spent?.toFixed(1)}%
              </span>
              <p className="mt-1 text-xs text-gray-500">
                Automatically calculated based on Current Year Actual vs Budget
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"></div>
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="relative w-full max-w-4xl rounded-lg bg-white shadow-xl">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900">
              {mode === 'add' ? 'Add New Item' : 'Edit Item'}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              {MODAL_TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap
                    ${activeTab === tab.id
                      ? 'border-[#0066B3] text-[#0066B3]'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="px-6 py-4 space-y-4 max-h-[calc(100vh-16rem)] overflow-y-auto">
              {activeTab === 'basic' && renderBasicInfo()}
              {activeTab === 'status' && renderStatusAndMilestones()}
              {activeTab === 'planning' && renderPlanningDetails()}
              {activeTab === 'financial' && renderFinancialDetails()}
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0066B3] rounded-md border border-gray-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-[#0066B3] hover:bg-[#0066B3]/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0066B3] rounded-md"
              >
                {mode === 'add' ? 'Create' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 