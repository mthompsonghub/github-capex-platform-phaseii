import { KPITarget, KPIActual, Project } from '../types';
import Papa from 'papaparse';

interface KPIExportRow {
  project_name: string;
  project_type: string;
  phase: string;
  component: string;
  target_date: string;
  completion_date: string | null;
  status: string;
  days_variance: number | null;
}

export function exportKPIData(
  projects: Project[],
  targets: Record<string, KPITarget>,
  actuals: Record<string, KPIActual>
): string {
  const exportRows: KPIExportRow[] = [];
  const projectMap = new Map(projects.map(p => [p.id, p]));

  // Convert targets and actuals to arrays
  const targetsList = Object.values(targets);
  const actualsList = Object.values(actuals);

  // Create a map of actuals by project and phase for quick lookup
  const actualsMap = new Map<string, KPIActual>();
  actualsList.forEach(actual => {
    const key = `${actual.project_id}-${actual.phase}-${actual.component}`;
    actualsMap.set(key, actual);
  });

  // Process each target
  targetsList.forEach(target => {
    const project = projectMap.get(target.project_id);
    if (!project) return;

    const key = `${target.project_id}-${target.phase}-${target.component}`;
    const actual = actualsMap.get(key);
    
    const targetDate = new Date(target.target_date);
    const completionDate = actual ? new Date(actual.completion_date) : null;
    
    let status: string;
    let daysVariance: number | null = null;
    
    if (!actual) {
      status = 'Not Started';
    } else {
      daysVariance = Math.round((completionDate!.getTime() - targetDate.getTime()) / (1000 * 60 * 60 * 24));
      if (daysVariance <= 0) {
        status = 'Completed On Time';
      } else {
        status = `Delayed by ${daysVariance} days`;
      }
    }

    exportRows.push({
      project_name: project.name,
      project_type: project.project_type,
      phase: target.phase,
      component: target.component,
      target_date: target.target_date,
      completion_date: actual?.completion_date || null,
      status,
      days_variance: daysVariance
    });
  });

  // Sort by project name, phase, and component
  exportRows.sort((a, b) => {
    if (a.project_name !== b.project_name) return a.project_name.localeCompare(b.project_name);
    if (a.phase !== b.phase) return a.phase.localeCompare(b.phase);
    return a.component.localeCompare(b.component);
  });

  // Convert to CSV
  return Papa.unparse(exportRows, {
    header: true,
    columns: [
      'project_name',
      'project_type',
      'phase',
      'component',
      'target_date',
      'completion_date',
      'status',
      'days_variance'
    ]
  });
} 