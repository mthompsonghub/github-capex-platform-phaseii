import { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Project, Resource, ProjectCompletion } from '../../types';
import { KPIDashboard } from '../kpi/KPIDashboard';
import { KPITargetForm } from '../kpi/KPITargetForm';
import { KPIActualForm } from '../kpi/KPIActualForm';
import { getProjectKPIs, createKPITarget, createKPIActual } from '../../lib/kpi';
import { toast } from 'react-hot-toast';

interface ProjectCardProps {
  project: Project;
  quarters: { year: number; quarter: number; }[];
  calculateAllocation: (year: number, quarter: number) => number;
  getProjectResources: () => Resource[];
  getAllocation: (resourceId: string, year: number, quarter: number) => number;
  getStatusColor: (status: string) => string;
  getPriorityColor: (priority: string) => string;
  resetTrigger: number;
}

export function ProjectCard({
  project,
  quarters,
  calculateAllocation,
  getProjectResources,
  getAllocation,
  getStatusColor,
  getPriorityColor,
  resetTrigger
}: ProjectCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showKPIForms, setShowKPIForms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [kpiData, setKPIData] = useState<{
    targets: any[];
    actuals: any[];
    completion: ProjectCompletion[];
  }>({ targets: [], actuals: [], completion: [] });

  useEffect(() => {
    if (isExpanded) {
      loadKPIData();
    }
  }, [isExpanded, project.id]);

  const loadKPIData = async () => {
    setIsLoading(true);
    setError(undefined);
    try {
      const data = await getProjectKPIs(project.id);
      setKPIData(data);
    } catch (error) {
      console.error('Error loading KPI data:', error);
      setError('Failed to load KPI data. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTarget = async (target: any) => {
    try {
      await createKPITarget(target);
      await loadKPIData();
      toast.success('KPI target set successfully');
    } catch (error) {
      console.error('Error creating KPI target:', error);
      toast.error('Failed to set KPI target');
    }
  };

  const handleCreateActual = async (actual: any) => {
    try {
      await createKPIActual(actual);
      await loadKPIData();
      toast.success('KPI completion recorded successfully');
    } catch (error) {
      console.error('Error creating KPI actual:', error);
      toast.error('Failed to record KPI completion');
    }
  };

  const resources = getProjectResources();

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6 space-y-4">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-lg font-semibold">{project.name}</h3>
          <div className="flex space-x-2 mt-2">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
              {project.status}
            </span>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(project.priority)}`}>
              {project.priority}
            </span>
            <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
              {project.project_type === 'project' ? 'Project' : 'Asset Purchase'}
            </span>
          </div>
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-1 hover:bg-gray-100 rounded-full"
        >
          {isExpanded ? (
            <ChevronUp className="h-5 w-5 text-gray-500" />
          ) : (
            <ChevronDown className="h-5 w-5 text-gray-500" />
          )}
        </button>
      </div>

      {isExpanded && (
        <div className="space-y-4">
          <div className="border-t pt-4">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Project Timeline</h4>
            <div className="grid grid-cols-4 gap-2">
              {quarters.map(({ year, quarter }) => {
                const allocation = calculateAllocation(year, quarter);
                return (
                  <div
                    key={`${year}-${quarter}`}
                    className="text-center p-2 text-xs"
                    style={{
                      backgroundColor: `rgba(239, 68, 68, ${allocation / 100})`,
                      color: allocation > 50 ? 'white' : 'black'
                    }}
                  >
                    {`Q${quarter} ${year}`}
                    <br />
                    {`${Math.round(allocation)}%`}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="border-t pt-4">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Resources</h4>
            <div className="space-y-2">
              {resources.map(resource => (
                <div key={resource.id} className="flex items-center justify-between text-sm">
                  <span>{resource.name}</span>
                  <div className="flex space-x-2">
                    {quarters.map(({ year, quarter }) => {
                      const allocation = getAllocation(resource.id, year, quarter);
                      return (
                        <span
                          key={`${resource.id}-${year}-${quarter}`}
                          className="w-12 text-center"
                          style={{ color: allocation > 0 ? 'black' : 'gray' }}
                        >
                          {allocation}%
                        </span>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t pt-4">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-sm font-medium text-gray-900">KPI Tracking</h4>
              <button
                onClick={() => setShowKPIForms(!showKPIForms)}
                className="text-sm text-blue-600 hover:text-blue-800"
                disabled={isLoading || !!error}
              >
                {showKPIForms ? 'Hide Forms' : 'Show Forms'}
              </button>
            </div>
            
            <KPIDashboard 
              project={project} 
              completion={kpiData.completion}
              isLoading={isLoading}
              error={error}
            />

            {showKPIForms && !isLoading && !error && (
              <div className="mt-4 space-y-4">
                <KPITargetForm
                  project={project}
                  onSubmit={handleCreateTarget}
                />
                <KPIActualForm
                  project={project}
                  targets={kpiData.targets}
                  onSubmit={handleCreateActual}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}