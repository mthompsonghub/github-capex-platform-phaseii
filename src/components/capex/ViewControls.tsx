import React, { useState } from 'react';
import { 
  LayoutGrid, 
  List, 
  Search, 
  Filter, 
  Eye, 
  EyeOff, 
  BarChart3, 
  Download,
  X
} from 'lucide-react';

interface ViewControlsProps {
  viewMode: 'card' | 'table';
  onViewModeChange: (mode: 'card' | 'table') => void;
  showFinancials: boolean;
  onToggleFinancials: () => void;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  onAnalytics: () => void;
  onExport: () => void;
}

export const ViewControls: React.FC<ViewControlsProps> = ({
  viewMode,
  onViewModeChange,
  showFinancials,
  onToggleFinancials,
  searchTerm,
  onSearchChange,
  onAnalytics,
  onExport
}) => {
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [showFilterMenu, setShowFilterMenu] = useState(false);

  const filterOptions = [
    { id: 'on-track', label: 'On Track', color: 'green' },
    { id: 'at-risk', label: 'At Risk', color: 'yellow' },
    { id: 'impacted', label: 'Impacted', color: 'red' },
    { id: 'projects', label: 'Projects', color: 'blue' },
    { id: 'assets', label: 'Asset Purchases', color: 'purple' }
  ];

  const toggleFilter = (filterId: string) => {
    setActiveFilters(prev => 
      prev.includes(filterId) 
        ? prev.filter(id => id !== filterId)
        : [...prev, filterId]
    );
  };

  const clearFilters = () => {
    setActiveFilters([]);
  };

  const getFilterColor = (color: string) => {
    const colors = {
      green: 'bg-green-100 text-green-800 border-green-200',
      yellow: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      red: 'bg-red-100 text-red-800 border-red-200',
      blue: 'bg-blue-100 text-blue-800 border-blue-200',
      purple: 'bg-purple-100 text-purple-800 border-purple-200'
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6 shadow-sm">
      <div className="flex items-center justify-between flex-wrap gap-4">
        
        {/* Left Side Controls */}
        <div className="flex items-center gap-4 flex-wrap">
          
          {/* View Toggle */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => onViewModeChange('card')}
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all ${
                viewMode === 'card'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
              Cards
            </button>
            <button
              onClick={() => onViewModeChange('table')}
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all ${
                viewMode === 'table'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <List className="w-4 h-4" />
              Table
            </button>
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search projects..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm w-64"
            />
          </div>

          {/* Filter Button & Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowFilterMenu(!showFilterMenu)}
              className={`flex items-center gap-2 px-3 py-2 border rounded-lg text-sm font-medium transition-colors ${
                activeFilters.length > 0
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Filter className="w-4 h-4" />
              Filter
              {activeFilters.length > 0 && (
                <span className="ml-1 bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {activeFilters.length}
                </span>
              )}
            </button>

            {/* Filter Dropdown */}
            {showFilterMenu && (
              <div className="absolute top-full left-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                <div className="p-3">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-medium text-gray-900">Filter Projects</h3>
                    {activeFilters.length > 0 && (
                      <button
                        onClick={clearFilters}
                        className="text-xs text-blue-600 hover:text-blue-800"
                      >
                        Clear all
                      </button>
                    )}
                  </div>
                  <div className="space-y-2">
                    {filterOptions.map((option) => (
                      <label key={option.id} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={activeFilters.includes(option.id)}
                          onChange={() => toggleFilter(option.id)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">{option.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Active Filter Chips */}
          {activeFilters.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {activeFilters.map((filterId) => {
                const filter = filterOptions.find(f => f.id === filterId);
                if (!filter) return null;
                
                return (
                  <span
                    key={filterId}
                    className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getFilterColor(filter.color)}`}
                  >
                    {filter.label}
                    <button
                      onClick={() => toggleFilter(filterId)}
                      className="hover:bg-black hover:bg-opacity-10 rounded-full p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Side Controls */}
        <div className="flex items-center gap-3">
          
          {/* Show/Hide Financials Toggle */}
          <button
            onClick={onToggleFinancials}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              showFinancials
                ? 'bg-green-50 text-green-700 border border-green-200'
                : 'bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100'
            }`}
          >
            {showFinancials ? (
              <>
                <Eye className="w-4 h-4" />
                Show Financials
              </>
            ) : (
              <>
                <EyeOff className="w-4 h-4" />
                Hide Financials
              </>
            )}
          </button>

          {/* Analytics Button */}
          <button
            onClick={onAnalytics}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            <BarChart3 className="w-4 h-4" />
            Analytics
          </button>

          {/* Export Button */}
          <button
            onClick={onExport}
            className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>

      </div>

      {/* Close filter menu when clicking outside */}
      {showFilterMenu && (
        <div 
          className="fixed inset-0 z-0" 
          onClick={() => setShowFilterMenu(false)}
        />
      )}
    </div>
  );
};