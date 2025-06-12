import React, { useState, useEffect } from 'react';
import { Project, ProjectCompletion } from '../../types';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Spinner } from '../ui/spinner';
import { ErrorMessage } from '../ui/error-message';
import { getProjectKPIs } from '../../lib/kpi';

interface KPIOverviewProps {
  projects: Project[];
}

interface ProjectKPIStatus {
  project: Project;
  completion: ProjectCompletion[];
  overallCompletion: number;
  isLoading: boolean;
  error?: string;
}

export function KPIOverview({ projects }: KPIOverviewProps) {
  const [projectStatuses, setProjectStatuses] = useState<ProjectKPIStatus[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'behind' | 'ontrack' | 'ahead'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'completion' | 'status'>('completion');

  useEffect(() => {
    const loadAllProjectKPIs = async () => {
      const initialStatuses = projects.map(project => ({
        project,
        completion: [],
        overallCompletion: 0,
        isLoading: true
      }));
      setProjectStatuses(initialStatuses);

      const updatedStatuses = await Promise.all(
        projects.map(async (project) => {
          try {
            const data = await getProjectKPIs(project.id);
            const overallCompletion = calculateOverallCompletion(data.completion);
            return {
              project,
              completion: data.completion,
              overallCompletion,
              isLoading: false
            };
          } catch (error) {
            return {
              project,
              completion: [],
              overallCompletion: 0,
              isLoading: false,
              error: 'Failed to load KPI data'
            };
          }
        })
      );

      setProjectStatuses(updatedStatuses);
    };

    loadAllProjectKPIs();
  }, [projects]);

  const calculateOverallCompletion = (completion: ProjectCompletion[]): number => {
    if (completion.length === 0) return 0;
    return completion.reduce((sum, c) => sum + c.completion_ratio, 0) / completion.length * 100;
  };

  const getCompletionColor = (completion: number) => {
    if (completion >= 100) return 'bg-green-500';
    if (completion >= 80) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getStatusBadge = (completion: number, target: number) => {
    const ratio = completion / target;
    if (ratio >= 1.1) return <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">Ahead</span>;
    if (ratio >= 0.9) return <span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">On Track</span>;
    return <span className="px-2 py-1 rounded-full text-xs bg-red-100 text-red-800">Behind</span>;
  };

  const filteredProjects = projectStatuses.filter(status => {
    if (selectedFilter === 'all') return true;
    if (!status.completion.length) return false;

    const ratio = status.overallCompletion / 100;
    switch (selectedFilter) {
      case 'ahead': return ratio >= 1.1;
      case 'ontrack': return ratio >= 0.9 && ratio < 1.1;
      case 'behind': return ratio < 0.9;
      default: return true;
    }
  });

  const sortedProjects = [...filteredProjects].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.project.name.localeCompare(b.project.name);
      case 'completion':
        return b.overallCompletion - a.overallCompletion;
      case 'status':
        return b.project.status.localeCompare(a.project.status);
      default:
        return 0;
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">KPI Overview</h2>
        <div className="flex space-x-4">
          <select
            value={selectedFilter}
            onChange={(e) => setSelectedFilter(e.target.value as any)}
            className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="all">All Projects</option>
            <option value="behind">Behind Schedule</option>
            <option value="ontrack">On Track</option>
            <option value="ahead">Ahead of Schedule</option>
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="completion">Sort by Completion</option>
            <option value="name">Sort by Name</option>
            <option value="status">Sort by Status</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sortedProjects.map((status) => (
          <Card key={status.project.id}>
            <CardHeader>
              <CardTitle className="flex justify-between items-start">
                <span className="text-lg">{status.project.name}</span>
                <span className="text-sm font-normal">
                  {status.project.project_type === 'project' ? 'Project' : 'Asset Purchase'}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {status.isLoading ? (
                <div className="flex justify-center py-4">
                  <Spinner size="lg" />
                </div>
              ) : status.error ? (
                <ErrorMessage message={status.error} />
              ) : (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-2xl font-bold">
                      {Math.round(status.overallCompletion)}%
                    </span>
                    {getStatusBadge(status.overallCompletion, 100)}
                  </div>
                  <div className="h-2 rounded-full bg-gray-200 overflow-hidden">
                    <div
                      className={`h-full transition-all ${getCompletionColor(status.overallCompletion)}`}
                      style={{ width: `${Math.min(status.overallCompletion, 110)}%` }}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    {status.completion.map((phase) => (
                      <div key={phase.phase} className="text-sm">
                        <div className="font-medium capitalize">{phase.phase}</div>
                        <div className="text-gray-500">
                          {Math.round(phase.completion_ratio * 100)}%
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
} 