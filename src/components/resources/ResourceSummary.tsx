import { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { useDateStore } from '../../stores/dateStore';
import { useDataStore } from '../../stores/dataStore';
import { SearchBar } from '../SearchBar';
import { ResourceCard } from './ResourceCard';
import Fuse from 'fuse.js';
import { parseISO, differenceInQuarters, startOfQuarter } from 'date-fns';

export function ResourceSummary() {
  const { getQuarterRange, setDisplayOffset, displayOffset, resetView, resetTrigger } = useDateStore();
  const { resources, projects, allocations } = useDataStore();
  const [searchResults, setSearchResults] = useState(resources);

  const quarterGroups = getQuarterRange();
  const quarters = quarterGroups.flatMap(group => 
    group.quarters.map(q => ({ year: group.year, quarter: q.quarter }))
  );

  const fuse = new Fuse(resources, {
    keys: ['name', 'title', 'department'],
    threshold: 0.3,
    distance: 100
  });

  const handleSearch = (term: string) => {
    if (!term.trim()) {
      setSearchResults(resources);
      return;
    }
    const results = fuse.search(term).map(result => result.item);
    setSearchResults(results);
  };

  const calculateUtilization = (resourceId: string, year: number, quarter: number) => {
    const resourceAllocations = allocations.filter(a => a.resource_id === resourceId);
    
    return resourceAllocations.reduce((total, allocation) => {
      const project = projects.find(p => p.id === allocation.project_id);
      if (!project) return total;

      const projectStartDate = parseISO(project.start_date);
      const targetQuarterDate = new Date(year, (quarter - 1) * 3, 1);
      const projectQuarterNumber = Math.floor(differenceInQuarters(targetQuarterDate, startOfQuarter(projectStartDate))) + 1;

      if (allocation.project_quarter_number === projectQuarterNumber) {
        return total + allocation.percentage;
      }
      return total;
    }, 0);
  };

  const getProjectAllocations = (resourceId: string, year: number, quarter: number) => {
    return allocations
      .filter(a => a.resource_id === resourceId)
      .map(allocation => {
        const project = projects.find(p => p.id === allocation.project_id);
        if (!project) return null;

        const projectStartDate = parseISO(project.start_date);
        const targetQuarterDate = new Date(year, (quarter - 1) * 3, 1);
        const projectQuarterNumber = Math.floor(differenceInQuarters(targetQuarterDate, startOfQuarter(projectStartDate))) + 1;

        if (allocation.project_quarter_number === projectQuarterNumber) {
          return {
            project,
            percentage: allocation.percentage
          };
        }
        return null;
      })
      .filter((a): a is NonNullable<typeof a> => a !== null)
      .sort((a, b) => b.percentage - a.percentage);
  };

  const handleNavigate = (direction: 'prev' | 'next') => {
    setDisplayOffset(displayOffset + (direction === 'prev' ? -1 : 1));
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
      </div>

      <SearchBar 
        onSearch={handleSearch}
        placeholder="Search by name, title, or department..."
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {searchResults.map(resource => (
          <ResourceCard
            key={resource.id}
            resource={resource}
            quarters={quarters}
            utilization={(year, quarter) => calculateUtilization(resource.id, year, quarter)}
            projectAllocations={(year, quarter) => getProjectAllocations(resource.id, year, quarter)}
            resetTrigger={resetTrigger}
          />
        ))}
      </div>
    </div>
  );
}