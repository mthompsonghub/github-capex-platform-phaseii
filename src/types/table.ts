import { ReactNode } from 'react';
import { CapExActual } from './capex';

export interface TableColumn<T = any> {
  key: string;
  title: string;
  width?: number;
  render?: (value: any, record: T) => ReactNode;
  sorter?: boolean;
  className?: string;
}

export interface TableColumnGroup<T = any> {
  title: string;
  children: (TableColumn<T> | TableColumnGroup<T>)[];
}

export interface TableProps<T = any> {
  data: T[];
  columnGroups: TableColumnGroup<T>[];
  loading?: boolean;
  onExportCsv?: () => void;
  className?: string;
  rowClassName?: (record: T) => string;
  headerClassName?: string;
  cellClassName?: (column: TableColumn<T>) => string;
}

export interface TableState {
  searchText: string;
  filters: Record<string, string[]>;
  sortColumn?: string;
  sortDirection: 'asc' | 'desc';
  currentPage: number;
  pageSize: number;
}

export type CapExTableColumn = TableColumn<CapExActual>;
export type CapExTableColumnGroup = TableColumnGroup<any>;

// Type guards
export const isColumnGroup = <T>(col: TableColumn<T> | TableColumnGroup<T>): col is TableColumnGroup<T> => {
  return 'children' in col && Array.isArray(col.children);
};

export const isColumn = <T>(col: TableColumn<T> | TableColumnGroup<T>): col is TableColumn<T> => {
  return 'key' in col && !('children' in col);
};

// Helper functions
export const getLeafColumns = <T>(columns: TableColumnGroup<T>[]): TableColumn<T>[] => {
  const result: TableColumn<T>[] = [];
  
  for (const group of columns) {
    for (const child of group.children) {
      if (isColumnGroup(child)) {
        result.push(...child.children.filter(isColumn));
      } else if (isColumn(child)) {
        result.push(child);
      }
    }
  }
  
  return result;
}; 