import React from 'react';
import { Table } from '../common/Table';
import { columnGroups } from './table/config';
import { CapExRecord } from '../../types/capex';
import { TableColumnGroup } from '../../types/table';
import { Loader2 } from 'lucide-react';

interface CapExActualsTableProps {
  data?: CapExRecord[];
  loading?: boolean;
  onExportCsv?: () => void;
  showFinancials?: boolean;
}

export const CapExActualsTable: React.FC<CapExActualsTableProps> = ({
  data = [],
  loading = false,
  onExportCsv,
  showFinancials = true,
}) => {
  const filteredColumnGroups = columnGroups
    .map(group => {
      if (group.title === 'Finance Status' && !showFinancials) {
        return null;
      }
      return group;
    })
    .filter((group): group is TableColumnGroup<CapExRecord> => group !== null);

  return (
    <div className="w-full overflow-hidden">
      <div className="relative">
        {loading && (
          <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          </div>
        )}
        <div className="overflow-x-auto">
          <Table<CapExRecord>
            data={data}
            columnGroups={filteredColumnGroups}
            loading={loading}
            onExportCsv={onExportCsv}
            className="min-w-[1800px] bg-white"
            rowClassName={(record) => {
              let baseClass = "transition-colors hover:bg-gray-50";
              if (record.project_status === 'On Track') {
                baseClass += ' hover:bg-green-50';
              } else if (record.project_status === 'At Risk') {
                baseClass += ' hover:bg-yellow-50';
              } else if (record.project_status === 'Impacted') {
                baseClass += ' hover:bg-red-50';
              }
              return baseClass;
            }}
            headerClassName="bg-gray-100 text-gray-700 font-medium"
            cellClassName={(column) => {
              let baseClass = "px-4 py-2 text-sm border-b border-gray-200";
              if (column.key === 'project_status') {
                baseClass += ' font-medium';
              }
              if (column.key.endsWith('_status') || column.key.includes('completion')) {
                baseClass += ' text-center';
              }
              return baseClass;
            }}
          />
        </div>
      </div>
    </div>
  );
}; 