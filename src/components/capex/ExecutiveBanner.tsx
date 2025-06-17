import React from 'react';
import { TrendingUp, DollarSign, BarChart3, Target } from 'lucide-react';
import { CapexProject, ProjectStatus } from '../../types/capex-unified';

interface ExecutiveBannerProps {
  projects: CapexProject[];
}

export const ExecutiveBanner: React.FC<ExecutiveBannerProps> = ({ projects }) => {
  // Calculate KPIs from project data
  const totalBudget = projects.reduce((sum, project) => sum + (project.budget || 0), 0);
  const totalActual = projects.reduce((sum, project) => sum + (project.spent || 0), 0);
  const ytdSpendPercentage = totalBudget > 0 ? (totalActual / totalBudget) * 100 : 0;
  
  // Project status breakdown
  const onTrackCount = projects.filter(p => p.status === 'On Track').length;
  const atRiskCount = projects.filter(p => p.status === 'At Risk').length;
  const impactedCount = projects.filter(p => p.status === 'Impacted').length;
  const totalProjects = projects.length;
  
  // Portfolio health calculation (based on project statuses)
  const portfolioHealthScore = totalProjects > 0 
    ? ((onTrackCount * 100 + atRiskCount * 70 + impactedCount * 30) / totalProjects)
    : 0;

  const getHealthStatus = (score: number) => {
    if (score >= 85) return { text: 'Excellent', color: '#10B981' };
    if (score >= 70) return { text: 'Good', color: '#F59E0B' };
    if (score >= 50) return { text: 'At Risk', color: '#F59E0B' };
    return { text: 'Needs Attention', color: '#EF4444' };
  };

  const healthStatus = getHealthStatus(portfolioHealthScore);

  const formatCurrency = (amount: number): string => {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(0)}K`;
    }
    return `$${amount.toLocaleString()}`;
  };

  return (
    <div className="mb-8">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        
        {/* Card 1: Total CapEx Budget */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Total CapEx Budget</p>
              <p className="text-3xl font-bold text-gray-900">{formatCurrency(totalBudget)}</p>
              <p className="text-sm text-gray-500 mt-2">{totalProjects} active projects</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <DollarSign className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        {/* Card 2: YTD Spend */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600 mb-1">YTD Spend</p>
              <p className="text-3xl font-bold text-gray-900">{formatCurrency(totalActual)}</p>
              <p className="text-sm text-gray-500 mt-1">{ytdSpendPercentage.toFixed(0)}% of budget</p>
              
              {/* Progress Bar */}
              <div className="mt-3">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(ytdSpendPercentage, 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>
            <div className="p-3 bg-green-50 rounded-lg ml-4">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        {/* Card 3: Project Breakdown */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Active Projects</p>
              <p className="text-lg font-semibold text-gray-900 mb-3">
                Total: {totalProjects}
              </p>
              <div className="space-y-1">
                <div className="flex items-center text-sm">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                  <span className="text-gray-700">{onTrackCount} On Track</span>
                </div>
                <div className="flex items-center text-sm">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
                  <span className="text-gray-700">{atRiskCount} At Risk</span>
                </div>
                <div className="flex items-center text-sm">
                  <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                  <span className="text-gray-700">{impactedCount} Impacted</span>
                </div>
              </div>
            </div>
            <div className="p-3 bg-orange-50 rounded-lg">
              <BarChart3 className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>

        {/* Card 4: Portfolio Health */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600 mb-1">Portfolio Health</p>
              <div className="flex items-center mt-3">
                <div className="relative w-16 h-16">
                  {/* Circular Progress Ring */}
                  <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 64 64">
                    <circle
                      cx="32"
                      cy="32"
                      r="28"
                      stroke="#E5E7EB"
                      strokeWidth="6"
                      fill="none"
                    />
                    <circle
                      cx="32"
                      cy="32"
                      r="28"
                      stroke={healthStatus.color}
                      strokeWidth="6"
                      fill="none"
                      strokeDasharray={`${(portfolioHealthScore / 100) * 175.93} 175.93`}
                      strokeLinecap="round"
                      className="transition-all duration-500"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-sm font-bold" style={{ color: healthStatus.color }}>
                      {portfolioHealthScore.toFixed(0)}%
                    </span>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-lg font-semibold" style={{ color: healthStatus.color }}>
                    {healthStatus.text}
                  </p>
                  <p className="text-xs text-gray-500">Overall Status</p>
                </div>
              </div>
            </div>
            <div className="p-3 bg-purple-50 rounded-lg">
              <Target className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};