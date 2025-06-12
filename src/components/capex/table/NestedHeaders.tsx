import { TableColumnGroup, TableColumn, isColumnGroup } from '../../../types/table';
import { TableHeader } from './TableHeader';

interface NestedHeadersProps<T> {
  columns: TableColumnGroup<T>[];
  onSort?: (key: keyof T) => void;
}

export function NestedHeaders<T>({ columns, onSort }: NestedHeadersProps<T>) {
  const levels: (TableColumn<T> | TableColumnGroup<T>)[][] = [];
  
  // First level - top groups
  levels.push(columns);
  
  // Second level - subgroups
  const subgroups = columns.flatMap(col => 
    col.children.filter(isColumnGroup)
  );
  if (subgroups.length > 0) {
    levels.push(subgroups);
  }
  
  // Third level - actual columns
  const leafColumns = columns.flatMap(col => 
    col.children.filter((child): child is TableColumn<T> => !isColumnGroup(child))
  );
  if (leafColumns.length > 0) {
    levels.push(leafColumns);
  }

  return (
    <thead>
      {levels.map((level, index) => (
        <TableHeader
          key={index}
          columns={level}
          level={index}
          onSort={onSort}
        />
      ))}
    </thead>
  );
} 