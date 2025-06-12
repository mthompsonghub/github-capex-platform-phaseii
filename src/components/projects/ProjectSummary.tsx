import { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar, Filter } from 'lucide-react';
import { useDateStore } from '../../stores/dateStore';
import { useDataStore } from '../../stores/dataStore';
import { Project } from '../../types';
import { SearchBar } from '../SearchBar';
import { ProjectCard } from './ProjectCard';
import Fuse from 'fuse.js';
import { parseISO, differenceInQuarters, startOfQuarter } from 'date-fns';

type StatusFilter = 'All' | 'Active' | 'Inactive' | 'Planned' | 'Completed' | 'On Hold';
type PriorityFilter = 'All' | 'Critical' | 'High' | 'Medium' | 'Low';

export function ProjectSummary() {
  const { getQuarterRange, setDisplayOffset, displayOffset, resetView, resetTrigger } = useDateStore();
  const { projects, resources, allocations } = useDataStore();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('All');
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>('All');
  const [searchResults, setSearchResults] = useState<Project[]>(projects);

  const fuse = new Fuse(projects, {
    keys: ['name', 'status', 'priority'],
    threshold: 0.3,
  });

  const handleSearch = (term: string) => {
    if (!term.trim()) {
      setSearchResults(projects);
      return;
    }
    const results = fuse.search(term).map(result => result.item);
    setSearchResults(results);
  };

  const quarterGroups = getQuarterRange();
  const quarters = quarterGroups.flatMap(group => 
    group.quarters.map(q => ({ year: group.year, quarter: q.quarter }))
  );

  const calculateProjectAllocation = (projectId: string, year: number, quarter: number) => {
    const project = projects.find(p => p.id === projectId);
    if (!project) return 0;

    const projectStartDate = parseISO(project.start_date);
    const targetQuarterDate = new Date(year, (quarter - 1) * 3, 1);
    const projectQuarterNumber = Math.floor(differenceInQuarters(targetQuarterDate, startOfQuarter(projectStartDate))) + 1;

    const projectAllocations = allocations.filter(
      a => a.project_id === projectId && a.project_quarter_number === projectQuarterNumber
    );

    if (projectAllocations.length === 0) return 0;
    return projectAllocations.reduce((sum, a) => sum + a.percentage, 0) / projectAllocations.length;
  };

  const getProjectResources = (projectId: string) => {
    const resourceIds = new Set(
      allocations
        .filter(a => a.project_id === projectId)
        .map(a => a.resource_id)
    );
    return resources.filter(r => resourceIds.has(r.id));
  };

  const getAllocation = (projectId: string, resourceId: string, year: number, quarter: number) => {
    const project = projects.find(p => p.id === projectId);
    if (!project) return 0;

    const projectStartDate = parseISO(project.start_date);
    const targetQuarterDate = new Date(year, (quarter - 1) * 3, 1);
    const projectQuarterNumber = Math.floor(differenceInQuarters(targetQuarterDate, startOfQuarter(projectStartDate))) + 1;

    const allocation = allocations.find(
      a => a.project_id === projectId &&
           a.resource_id === resourceId &&
           a.project_quarter_number === projectQuarterNumber
    );
    return allocation?.percentage || 0;
  };

  const handleNavigate = (direction: 'prev' | 'next') => {
    setDisplayOffset(displayOffset + (direction === 'prev' ? -1 : 1));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'bg-green-100 text-green-800';
      case 'Planned': return 'bg-blue-100 text-blue-800';
      case 'On Hold': return 'bg-orange-100 text-orange-800';
      case 'Completed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Critical': return 'bg-red-100 text-red-800';
      case 'High': return 'bg-orange-100 text-orange-800';
      case 'Medium': return 'bg-yellow-100 text-yellow-800';
      case 'Low': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredProjects = searchResults
    .filter(project => {
      if (statusFilter !== 'All' && project.status !== statusFilter) return false;
      if (priorityFilter !== 'All' && project.priority !== priorityFilter) return false;
      return true;
    })
    .sort((a, b) => {
      const priorityOrder = { Critical: 0, High: 1, Medium: 2, Low: 3 };
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;
      
      const statusOrder = { Active: 0, Planned: 1, 'On Hold': 2, Completed: 3 };
      const statusDiff = statusOrder[a.status] - statusOrder[b.status];
      if (statusDiff !== 0) return statusDiff;
      
      return a.name.localeCompare(b.name);
    });

  const statusCounts = {
    'All': projects.length,
    'Active': projects.filter(p => p.status === 'Active').length,
    'Inactive': projects.filter(p => p.status === 'Inactive').length,
    'Planned': projects.filter(p => p.status === 'Planned').length,
    'Completed': projects.filter(p => p.status === 'Completed').length,
    'On Hold': projects.filter(p => p.status === 'On Hold').length,
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => handleNavigate('prev')}
            className="p-2 rounded-full hover:bg-gray-100"
          >
            <ChevronLeft className="h-5 w-5 text-gray-600" />
          </button>
          <button
            onClick={() => handleNavigate('next')}
            className="p-2 rounded-full hover:bg-gray-100"
          >
            <ChevronRight className="h-5 w-5 text-gray-600" />
          </button>
          <button
            onClick={resetView}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-union-red hover:bg-union-red-dark"
          >
            <Calendar className="mr-2 h-4 w-4" />
            Current View
          </button>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              className="border rounded px-2 py-1"
            >
              <option value="All">All</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="Planned">Planned</option>
              <option value="Completed">Completed</option>
              <option value="On Hold">On Hold</option>
            </select>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value as PriorityFilter)}
              className="border-gray-300 rounded-md text-sm"
            >
              <option value="All">All Priorities</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>
        </div>
      </div>

      <SearchBar 
        onSearch={handleSearch} 
        placeholder="Search projects by name, status, or priority..."
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredProjects.map(project => (
          <ProjectCard
            key={project.id}
            project={project}
            quarters={quarters}
            calculateAllocation={(year, quarter) => calculateProjectAllocation(project.id, year, quarter)}
            getProjectResources={() => getProjectResources(project.id)}
            getAllocation={(resourceId, year, quarter) => getAllocation(project.id, resourceId, year, quarter)}
            getStatusColor={getStatusColor}
            getPriorityColor={getPriorityColor}
            resetTrigger={resetTrigger}
          />
        ))}
      </div>
    </div>
  );
}