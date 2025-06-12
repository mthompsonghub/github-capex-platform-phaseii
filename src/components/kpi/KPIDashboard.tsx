import { useMemo, useState } from 'react';
import { Project, ProjectCompletion } from '../../types';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Progress } from '../ui/progress';
import { Spinner } from '../ui/spinner';
import { ErrorMessage } from '../ui/error-message';
import { useKPIStore } from '../../stores/kpiStore';
import { useDataStore } from '../../stores/dataStore';
import { KPICard } from './KPICard';
import { calculateProjectCompletion } from '../../utils/kpiCalculations';
import { Search, SortAsc, SortDesc, Filter } from 'lucide-react';

type SortField = 'name' | 'completion' | 'status';
type SortOrder = 'asc' | 'desc';
type ProjectType = 'all' | 'project' | 'asset_purchase';
type ProjectStatus = 'all' | 'on_track' | 'behind';

interface FilterState {
  search: string;
  projectType: ProjectType;
  status: ProjectStatus;
  sortField: SortField;
  sortOrder: SortOrder;
}

interface KPIDashboardProps {
  project: Project;
  completion: ProjectCompletion[];
  isLoading?: boolean;
  error?: string;
}

const phaseOrder = ['feasibility', 'planning', 'execution', 'close'] as const;

export function KPIDashboard() {
  const { projects } = useDataStore();
  const { targets, actuals } = useKPIStore();
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    projectType: 'all',
    status: 'all',
    sortField: 'name',
    sortOrder: 'asc'
  });

  const projectKPIs = useMemo(() => {
    let filtered = projects.map(project => {
      const projectTargets = Object.values(targets).filter(t => t.project_id === project.id);
      const projectActuals = Object.values(actuals).filter(a => a.project_id === project.id);
      const completion = calculateProjectCompletion(projectTargets, projectActuals);
      
      return {
        project,
        completion,
        isOnTrack: completion.actualPercentage >= completion.expectedPercentage
      };
    });

    // Apply filters
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(({ project }) => 
        project.name.toLowerCase().includes(searchLower)
      );
    }

    if (filters.projectType !== 'all') {
      filtered = filtered.filter(({ project }) => 
        project.project_type === filters.projectType
      );
    }

    if (filters.status !== 'all') {
      filtered = filtered.filter(({ isOnTrack }) => 
        filters.status === 'on_track' ? isOnTrack : !isOnTrack
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      const multiplier = filters.sortOrder === 'asc' ? 1 : -1;
      
      switch (filters.sortField) {
        case 'name':
          return multiplier * a.project.name.localeCompare(b.project.name);
        case 'completion':
          return multiplier * (a.completion.actualPercentage - b.completion.actualPercentage);
        case 'status':
          return multiplier * (Number(a.isOnTrack) - Number(b.isOnTrack));
        default:
          return 0;
      }
    });

    return filtered;
  }, [projects, targets, actuals, filters]);

  const toggleSort = (field: SortField) => {
    setFilters(prev => ({
      ...prev,
      sortField: field,
      sortOrder: prev.sortField === field && prev.sortOrder === 'asc' ? 'desc' : 'asc'
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search projects..."
            value={filters.search}
            onChange={e => setFilters(prev => ({ ...prev, search: e.target.value }))}
            className="pl-10 pr-4 py-2 w-full rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* Filters */}
        <div className="flex gap-4">
          <select
            value={filters.projectType}
            onChange={e => setFilters(prev => ({ ...prev, projectType: e.target.value as ProjectType }))}
            className="px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">All Types</option>
            <option value="project">Projects</option>
            <option value="asset_purchase">Asset Purchases</option>
          </select>

          <select
            value={filters.status}
            onChange={e => setFilters(prev => ({ ...prev, status: e.target.value as ProjectStatus }))}
            className="px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">All Status</option>
            <option value="on_track">On Track</option>
            <option value="behind">Behind Schedule</option>
          </select>
        </div>
      </div>

      {/* Sort Buttons */}
      <div className="flex gap-4">
        <button
          onClick={() => toggleSort('name')}
          className={`flex items-center gap-2 px-4 py-2 rounded-md border ${
            filters.sortField === 'name' ? 'border-primary text-primary' : 'border-gray-300'
          }`}
        >
          Name
          {filters.sortField === 'name' && (
            filters.sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />
          )}
        </button>
        <button
          onClick={() => toggleSort('completion')}
          className={`flex items-center gap-2 px-4 py-2 rounded-md border ${
            filters.sortField === 'completion' ? 'border-primary text-primary' : 'border-gray-300'
          }`}
        >
          Completion
          {filters.sortField === 'completion' && (
            filters.sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />
          )}
        </button>
        <button
          onClick={() => toggleSort('status')}
          className={`flex items-center gap-2 px-4 py-2 rounded-md border ${
            filters.sortField === 'status' ? 'border-primary text-primary' : 'border-gray-300'
          }`}
        >
          Status
          {filters.sortField === 'status' && (
            filters.sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projectKPIs.map(({ project, completion, isOnTrack }) => (
          <KPICard
            key={project.id}
            project={project}
            completion={completion}
            isOnTrack={isOnTrack}
          />
        ))}
      </div>

      {/* Empty State */}
      {projectKPIs.length === 0 && (
        <div className="text-center py-12">
          <Filter className="h-12 w-12 mx-auto text-gray-400" />
          <h3 className="mt-4 text-lg font-medium">No matching projects</h3>
          <p className="mt-2 text-gray-500">Try adjusting your filters or search term</p>
        </div>
      )}
    </div>
  );
} 