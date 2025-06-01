import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Resource, Project } from '../../types';

interface ResourceCardProps {
  resource: Resource;
  quarters: { year: number; quarter: number }[];
  utilization: (year: number, quarter: number) => number;
  projectAllocations: (year: number, quarter: number) => Array<{
    project: Project;
    percentage: number;
  }>;
  resetTrigger?: number;
}

function DonutChart({ percentage }: { percentage: number }) {
  const radius = 20;
  const circumference = 2 * Math.PI * radius;
  const strokeDasharray = `${(percentage / 100) * circumference} ${circumference}`;
  const getColor = (value: number) => {
    if (value > 100) return '#EF4444'; // red-500
    if (value >= 80) return '#F97316'; // orange-500
    return '#3B82F6'; // blue-500
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

export function ResourceCard({
  resource,
  quarters,
  utilization,
  projectAllocations,
  resetTrigger,
}: ResourceCardProps) {
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

  const handleQuarterClick = (year: number, quarter: number) => {
    setSelectedQuarter(selectedQuarter?.year === year && selectedQuarter?.quarter === quarter
      ? null
      : { year, quarter }
    );
  };

  // Get all current projects across visible quarters
  const currentProjects = Array.from(new Set(
    visibleQuarters.flatMap(q => 
      projectAllocations(q.year, q.quarter)
        .filter(a => a.percentage > 0)
        .map(a => a.project.name)
    )
  ));

  // Calculate average utilization across visible quarters
  const averageUtilization = visibleQuarters.length > 0
    ? visibleQuarters.reduce((sum, q) => sum + utilization(q.year, q.quarter), 0) / visibleQuarters.length
    : 0;

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden transition-all duration-200 hover:shadow-lg">
      <div className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1 space-y-2">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{resource.name}</h3>
                <p className="text-sm text-gray-600">{resource.title}</p>
                <p className="text-sm text-gray-500">{resource.department}</p>
              </div>
              <DonutChart percentage={averageUtilization} />
            </div>
            
            {/* Always show current projects */}
            {currentProjects.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {currentProjects.map(projectName => (
                  <div
                    key={projectName}
                    className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full text-xs font-medium"
                  >
                    {projectName}
                  </div>
                ))}
              </div>
            )}

            {/* Compact Quarter View */}
            <div className="flex gap-2 mt-3">
              {visibleQuarters.map(({ year, quarter }) => {
                const util = utilization(year, quarter);
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
                      util > 100 ? 'bg-red-100 text-red-800' :
                      util >= 80 ? 'bg-orange-100 text-orange-800' :
                      util > 0 ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {Math.round(util)}%
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
              Q{selectedQuarter.quarter} {selectedQuarter.year} Allocations
            </h4>
            <div className="flex flex-wrap gap-2">
              {projectAllocations(selectedQuarter.year, selectedQuarter.quarter)
                .sort((a, b) => b.percentage - a.percentage)
                .map(({ project, percentage }) => (
                  <div
                    key={project.id}
                    className="inline-flex items-center px-3 py-1.5 rounded-full text-sm bg-gray-100 text-gray-700"
                  >
                    <span className="font-medium mr-2">{project.name}</span>
                    <span>{percentage}%</span>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}