const renderFinancialDetails = (props: { formData: any; handleInputChange: (field: string, value: any) => void }) => {
  const { formData, handleInputChange } = props;
  return (
    <div className="space-y-6">
      {/* Project Identification Section */}
      <div className="space-y-4">
        <h4 className="text-lg font-medium text-gray-900">Project Identification</h4>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              SES Asset Number
            </label>
            <input
              type="text"
              value={formData.sesNumber || ''}
              onChange={(e) => handleInputChange('sesNumber', e.target.value)}
              placeholder="Internal asset tracking number"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upcoming Milestone
            </label>
            <input
              type="text"
              value={formData.upcomingMilestone || ''}
              onChange={(e) => handleInputChange('upcomingMilestone', e.target.value)}
              placeholder="Next key deliverable"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Budget Overview Section */}
      <div className="space-y-4">
        <h4 className="text-lg font-medium text-gray-900">Budget Overview</h4>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Total Budget
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-gray-500">$</span>
              <input
                type="number"
                value={formData.yearly_budget || ''}
                onChange={(e) => handleInputChange('yearly_budget', Number(e.target.value))}
                className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Actual Spend
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-gray-500">$</span>
              <input
                type="number"
                value={formData.yearly_actual || ''}
                onChange={(e) => handleInputChange('yearly_actual', Number(e.target.value))}
                className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Budget utilization display */}
        {(formData.yearly_budget && formData.yearly_actual) && (
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-green-900">
                Remaining Budget: ${((formData.yearly_budget || 0) - (formData.yearly_actual || 0)).toLocaleString()}
              </span>
              <span className="text-sm text-green-700">
                Budget Utilization: {Math.round(((formData.yearly_actual || 0) / (formData.yearly_budget || 1)) * 100)}%
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Financial Notes Section */}
      <div className="space-y-4">
        <label className="block text-sm font-medium text-gray-700">
          Financial Notes
        </label>
        <textarea
          value={formData.financialNotes || ''}
          onChange={(e) => handleInputChange('financialNotes', e.target.value)}
          placeholder="Additional financial information, risks, or notes..."
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
      </div>
    </div>
  );
}; 