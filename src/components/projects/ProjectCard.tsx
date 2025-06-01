import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Project, Resource } from '../../types';
import { format, parseISO } from 'date-fns';

interface ProjectCardProps {
  project: Project;
  quarters: { year: number; quarter: number }[];
  calculateAllocation: (year: number, quarter: number) => number;
  getProjectResources: () => Resource[];
  getAllocation: (resourceId: string, year: number, quarter: number) => number;
  getStatusColor: (status: string) => string;
  getPriorityColor: (priority: string) => string;
  resetTrigger?: number;
}

function DonutChart({ percentage }: { percentage: number }) {
  const radius = 20;
  const circumference = 2 * Math.PI * radius;
  const strokeDasharray = `${(percentage / 100) * circumference} ${circumference}`;
  const getColor = (value: number) => {
    if (value >= 80) return '#22C55E'; // green-500
    if (value >= 50) return '#3B82F6'; // blue-500
    return '#EAB308'; // yellow-500
  };

  return (
    <div className="relative w-[50px] h-[50px] flex items-center justify-center">
      <svg className="transform -rotate-90 w-[50px] h-[50px]">
        <circle
          cx="25"
          cy="25"
          r={radius}
          stroke="#E5E7EB"
          strokeWidth="4"
          fill="none"
        />
        <circle
          cx="25"
          cy="25"
          r={radius}
          stroke={getColor(percentage)}
          strokeWidth="4"
          strokeDasharray={strokeDasharray}
          strokeLinecap="round"
          fill="none"
        />
      </svg>
      <span className="absolute text-xs font-medium">{Math.round(percentage)}%</span>
    </div>
  );
}

export function ProjectCard({
  project,
  quarters,
  calculateAllocation,
  getProjectResources,
  getAllocation,
  getStatusColor,
  getPriorityColor,
  resetTrigger,
}: ProjectCardProps) {
  const [selectedQuarter, setSelectedQuarter] = useState<{
    year: number;
    quarter: number;
  } | null>(null);

  useEffect(() => {
    if (resetTrigger) {
      setSelectedQuarter(null);
    }
  }, [resetTrigger]);

  // Only show 4 quarters
  const visibleQuarters = quarters.slice(0, 4);
  const resources = getProjectResources();

  const handleQuarterClick = (year: number, quarter: number) => {
    setSelectedQuarter(selectedQuarter?.year === year && selectedQuarter?.quarter === quarter
      ? null
      : { year, quarter }
    );
  };

  // Calculate average allocation across visible quarters
  const averageAllocation = visibleQuarters.length > 0
    ? visibleQuarters.reduce((sum, q) => sum + calculateAllocation(q.year, q.quarter), 0) / visibleQuarters.length
    : 0;

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden transition-all duration-200 hover:shadow-lg">
      <div className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1 space-y-2">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{project.name}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                    {project.status}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(project.priority)}`}>
                    {project.priority}
                  </span>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  {format(parseISO(project.start_date), 'MMM d, yyyy')} - {format(parseISO(project.end_date), 'MMM d, yyyy')}
                </p>
              </div>
              <DonutChart percentage={averageAllocation} />
            </div>
            
            {/* Resource count and list */}
            <div className="mt-3">
              <div className="text-sm text-gray-600 mb-2">
                {resources.length} Resource{resources.length !== 1 ? 's' : ''}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {resources.map(resource => (
                  <div
                    key={resource.id}
                    className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full text-xs font-medium"
                  >
                    {resource.name}
                  </div>
                ))}
              </div>
            </div>

            {/* Compact Quarter View */}
            <div className="flex gap-2 mt-3">
              {visibleQuarters.map(({ year, quarter }) => {
                const allocation = calculateAllocation(year, quarter);
                const isSelected = selectedQuarter?.year === year && selectedQuarter?.quarter === quarter;
                
                return (
                  <button
                    key={`${year}-Q${quarter}`}
                    onClick={() => handleQuarterClick(year, quarter)}
                    className={`flex-1 py-1 px-2 rounded text-center transition-all ${
                      isSelected
                        ? 'ring-2 ring-union-red ring-offset-1'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="text-xs font-medium text-gray-600 mb-1">
                      Q{quarter}
                    </div>
                    <div className={`text-xs font-medium rounded-full px-1.5 py-0.5 ${
                      allocation >= 80 ? 'bg-green-100 text-green-800' :
                      allocation >= 50 ? 'bg-blue-100 text-blue-800' :
                      allocation > 0 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {Math.round(allocation)}%
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {selectedQuarter && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg relative">
            <button
              onClick={() => setSelectedQuarter(null)}
              className="absolute top-2 right-2 p-1 hover:bg-gray-200 rounded-full"
            >
              <X className="h-4 w-4 text-gray-500" />
            </button>
            <h4 className="text-sm font-medium text-gray-900 mb-3">
              Q{selectedQuarter.quarter} {selectedQuarter.year} Resource Allocations
            </h4>
            <div className="space-y-2">
              {resources.map(resource => {
                const allocation = getAllocation(resource.id, selectedQuarter.year, selectedQuarter.quarter);
                if (allocation === 0) return null;
                
                return (
                  <div
                    key={resource.id}
                    className="flex items-center justify-between px-3 py-2 rounded-lg bg-white"
                  >
                    <div>
                      <div className="font-medium text-sm">{resource.name}</div>
                      <div className="text-xs text-gray-500">{resource.title}</div>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      allocation >= 80 ? 'bg-orange-100 text-orange-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {allocation}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}