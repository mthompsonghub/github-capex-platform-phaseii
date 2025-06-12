import React from 'react';
import { CapExRecord } from '../../types/capex';
import { FileText, Package, Boxes } from 'lucide-react';

interface CapExSummaryCardsProps {
  data: CapExRecord[];
}

export const CapExSummaryCards: React.FC<CapExSummaryCardsProps> = ({ data }) => {
  const totalProjects = data.filter(item => item.section === 'Projects').length;
  const totalAssetPurchases = data.filter(item => item.section === 'Asset Purchases').length;
  const totalItems = data.length;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-red-100 rounded-lg">
            <FileText className="w-6 h-6 text-red-600" />
          </div>
          <div>
            <h3 className="text-lg font-medium text-gray-900">Total Projects</h3>
            <p className="mt-1 text-3xl font-bold text-red-600">{totalProjects}</p>
          </div>
        </div>
        <p className="mt-2 text-sm text-gray-500">Active capital projects in progress</p>
      </div>
      
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-red-100 rounded-lg">
            <Package className="w-6 h-6 text-red-600" />
          </div>
          <div>
            <h3 className="text-lg font-medium text-gray-900">Asset Purchases</h3>
            <p className="mt-1 text-3xl font-bold text-red-600">{totalAssetPurchases}</p>
          </div>
        </div>
        <p className="mt-2 text-sm text-gray-500">Equipment and asset acquisitions</p>
      </div>
      
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-red-100 rounded-lg">
            <Boxes className="w-6 h-6 text-red-600" />
          </div>
          <div>
            <h3 className="text-lg font-medium text-gray-900">Total Items</h3>
            <p className="mt-1 text-3xl font-bold text-red-600">{totalItems}</p>
          </div>
        </div>
        <p className="mt-2 text-sm text-gray-500">Combined projects and purchases</p>
      </div>
    </div>
  );
}; 