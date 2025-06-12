import React, { useState } from 'react';
import { Project, KPITarget } from '../../types';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Spinner } from '../ui/spinner';
import { ErrorMessage } from '../ui/error-message';

interface KPITargetFormProps {
  project: Project;
  onSubmit: (target: Omit<KPITarget, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
}

const phaseComponents = {
  feasibility: ['Risk Assessment', 'Project Charter'],
  planning: [
    'RFQ Package',
    'Validation Strategy',
    'Financial Forecast',
    'Vendor Solicitation',
    'Gantt Chart',
    'Asset Number Approval'
  ],
  execution: [
    'PO Submission',
    'Equipment Design/Build',
    'Documentation',
    'Demo/Install',
    'Validation',
    'Turnover',
    'Go-Live'
  ],
  close: ['PO Closure', 'Project Turnover']
} as const;

export function KPITargetForm({ project, onSubmit }: KPITargetFormProps) {
  const [selectedPhase, setSelectedPhase] = useState<keyof typeof phaseComponents>('planning');
  const [selectedComponent, setSelectedComponent] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedComponent || !targetDate) return;

    setIsSubmitting(true);
    setError(undefined);

    try {
      await onSubmit({
        project_id: project.id,
        phase: selectedPhase,
        component: selectedComponent,
        target_date: targetDate,
      });

      // Reset form
      setSelectedComponent('');
      setTargetDate('');
    } catch (error) {
      setError('Failed to set KPI target. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isValid = selectedComponent && targetDate;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Set KPI Target</CardTitle>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="mb-4">
            <ErrorMessage message={error} />
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Phase</label>
            <select
              value={selectedPhase}
              onChange={(e) => setSelectedPhase(e.target.value as keyof typeof phaseComponents)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 hover:border-gray-300 transition-colors duration-200"
              disabled={isSubmitting}
            >
              {Object.keys(phaseComponents).map((phase) => (
                // Skip feasibility for asset purchases
                (project.project_type === 'asset_purchase' && phase === 'feasibility') ? null : (
                  <option key={phase} value={phase}>
                    {phase.charAt(0).toUpperCase() + phase.slice(1)}
                  </option>
                )
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Component</label>
            <select
              value={selectedComponent}
              onChange={(e) => setSelectedComponent(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 hover:border-gray-300 transition-colors duration-200"
              disabled={isSubmitting}
            >
              <option value="">Select a component</option>
              {phaseComponents[selectedPhase].map((component) => (
                <option key={component} value={component}>
                  {component}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Target Date</label>
            <input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              min={new Date().toISOString().split('T')[0]}
              disabled={isSubmitting}
            />
          </div>

          <button
            type="submit"
            disabled={!isValid || isSubmitting}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 flex justify-center items-center"
          >
            {isSubmitting ? (
              <>
                <Spinner size="sm" className="mr-2" />
                Setting Target...
              </>
            ) : (
              'Set Target'
            )}
          </button>
        </form>
      </CardContent>
    </Card>
  );
} 