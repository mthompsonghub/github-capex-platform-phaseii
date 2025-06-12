import React from 'react';
import { TableProps, TableColumn, TableColumnGroup } from '../../types/table';
import { twMerge } from 'tailwind-merge';

const isColumnGroup = <T,>(item: TableColumn<T> | TableColumnGroup<T>): item is TableColumnGroup<T> => {
  return 'children' in item;
};

const flattenColumns = <T,>(columnGroups: TableColumnGroup<T>[]): TableColumn<T>[] => {
  const result: TableColumn<T>[] = [];
  
  const flatten = (items: (TableColumn<T> | TableColumnGroup<T>)[]) => {
    items.forEach(item => {
      if (isColumnGroup(item)) {
        flatten(item.children);
      } else {
        result.push(item);
      }
    });
  };
  
  flatten(columnGroups);
  return result;
};

const getHeaderRows = <T,>(columnGroups: TableColumnGroup<T>[]): (TableColumn<T> | TableColumnGroup<T>)[][] => {
  const rows: (TableColumn<T> | TableColumnGroup<T>)[][] = [];
  let maxDepth = 0;

  const getDepth = (items: (TableColumn<T> | TableColumnGroup<T>)[]): number => {
    let depth = 1;
    items.forEach(item => {
      if (isColumnGroup(item)) {
        depth = Math.max(depth, getDepth(item.children) + 1);
      }
    });
    return depth;
  };

  const fillRows = (
    items: (TableColumn<T> | TableColumnGroup<T>)[],
    depth: number,
    parentSpans: { [key: number]: number } = {}
  ) => {
    rows[depth] = rows[depth] || [];
    
    items.forEach((item, index) => {
      if (isColumnGroup(item)) {
        rows[depth].push(item);
        const colSpan = flattenColumns([item as TableColumnGroup<T>]).length;
        fillRows(item.children, depth + 1, { ...parentSpans, [depth]: colSpan });
      } else {
        if (depth === 0) {
          rows[depth].push(item);
        } else {
          const rowSpan = maxDepth - depth;
          const extendedItem = {
            ...item,
            rowSpan: rowSpan > 0 ? rowSpan : undefined,
          };
          rows[depth].push(extendedItem);
        }
      }
    });
  };

  maxDepth = getDepth(columnGroups);
  fillRows(columnGroups, 0);

  return rows;
};

export const Table = <T,>({
  data = [],
  columnGroups = [],
  loading = false,
  onExportCsv,
  className,
  rowClassName,
  headerClassName,
  cellClassName,
}: TableProps<T>) => {
  if (!Array.isArray(data) || !Array.isArray(columnGroups)) {
    console.error('Table: Invalid data or columnGroups provided', { data, columnGroups });
    return null;
  }

  const columns = flattenColumns(columnGroups);
  const headerRows = getHeaderRows(columnGroups);
  
  const renderHeaderCell = (item: TableColumn<T> | TableColumnGroup<T>, rowIndex: number) => {
    const colSpan = isColumnGroup(item) ? flattenColumns([item]).length : undefined;
    const rowSpan = (item as any).rowSpan;
    
    return (
      <th
        key={isColumnGroup(item) ? item.title : item.key}
        colSpan={colSpan}
        rowSpan={rowSpan}
        className={twMerge(
          'px-4 py-2 text-sm font-medium text-gray-900 bg-gray-50 border-b border-gray-200',
          headerClassName,
          !isColumnGroup(item) && item.className
        )}
        style={{ width: !isColumnGroup(item) ? item.width : undefined }}
      >
        {isColumnGroup(item) ? item.title : item.title}
      </th>
    );
  };

  const renderDataCell = (column: TableColumn<T>, record: T) => {
    const value = record ? (record as any)[column.key] : undefined;
    const content = column.render ? column.render(value, record) : value;
    
    return (
      <td
        key={column.key}
        className={twMerge(
          'px-4 py-2 text-sm text-gray-900 border-b border-gray-200',
          cellClassName?.(column),
          column.className
        )}
      >
        {content}
      </td>
    );
  };

  if (columns.length === 0) {
    return (
      <div className="text-center p-4 text-gray-500">
        No columns configured
      </div>
    );
  }

  return (
    <div className={twMerge('relative overflow-x-auto', className)}>
      {loading && (
        <div className="absolute inset-0 bg-white bg-opacity-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
        </div>
      )}
      
      <table className="w-full border-collapse">
        <thead>
          {headerRows.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {row.map((item) => renderHeaderCell(item, rowIndex))}
            </tr>
          ))}
        </thead>
        <tbody>
          {data.length > 0 ? (
            data.map((record, index) => (
              <tr 
                key={index}
                className={rowClassName?.(record)}
              >
                {columns.map(column => renderDataCell(column, record))}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={columns.length} className="text-center p-4 text-gray-500">
                No data available
              </td>
            </tr>
          )}
        </tbody>
      </table>
      
      {onExportCsv && data.length > 0 && (
        <button
          onClick={onExportCsv}
          className="mt-4 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Export to CSV
        </button>
      )}
    </div>
  );
}; 