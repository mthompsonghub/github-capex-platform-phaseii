import React, { useState, useEffect } from 'react';
import { Project, KPITarget, KPIActual } from '../../types';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Spinner } from '../ui/spinner';
import { ErrorMessage } from '../ui/error-message';

interface KPIActualFormProps {
  project: Project;
  targets: KPITarget[];
  onSubmit: (actual: Omit<KPIActual, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
}

export function KPIActualForm({ project, targets, onSubmit }: KPIActualFormProps) {
  const [selectedPhase, setSelectedPhase] = useState<string>('');
  const [selectedComponent, setSelectedComponent] = useState('');
  const [completionDate, setCompletionDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | undefined>();

  // Get unique phases from targets
  const phases = Array.from(new Set(targets.map(t => t.phase)))
    .filter(phase => project.project_type === 'project' || phase !== 'feasibility');

  // Get components for selected phase
  const components = targets
    .filter(t => t.phase === selectedPhase)
    .map(t => t.component);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedComponent || !completionDate) return;

    setIsSubmitting(true);
    setError(undefined);

    try {
      await onSubmit({
        project_id: project.id,
        phase: selectedPhase as KPIActual['phase'],
        component: selectedComponent,
        completion_date: completionDate,
      });

      // Reset form
      setSelectedComponent('');
      setCompletionDate('');
    } catch (error) {
      setError('Failed to record KPI completion. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset component when phase changes
  useEffect(() => {
    setSelectedComponent('');
  }, [selectedPhase]);

  const isValid = selectedComponent && completionDate;

  if (targets.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Record Completion</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-gray-500 text-center py-4">
            No KPI targets set. Please set targets before recording completions.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Record Completion</CardTitle>
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
              onChange={(e) => setSelectedPhase(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 hover:border-gray-300 transition-colors duration-200"
              disabled={isSubmitting}
            >
              <option value="">Select a phase</option>
              {phases.map((phase) => (
                <option key={phase} value={phase}>
                  {phase.charAt(0).toUpperCase() + phase.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Component</label>
            <select
              value={selectedComponent}
              onChange={(e) => setSelectedComponent(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 hover:border-gray-300 transition-colors duration-200"
              disabled={!selectedPhase || isSubmitting}
            >
              <option value="">Select a component</option>
              {components.map((component) => (
                <option key={component} value={component}>
                  {component}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Completion Date</label>
            <input
              type="date"
              value={completionDate}
              onChange={(e) => setCompletionDate(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              max={new Date().toISOString().split('T')[0]}
              disabled={!selectedComponent || isSubmitting}
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
                Recording Completion...
              </>
            ) : (
              'Record Completion'
            )}
          </button>
        </form>
      </CardContent>
    </Card>
  );
} 