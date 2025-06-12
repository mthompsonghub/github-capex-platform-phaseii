import { twMerge } from 'tailwind-merge';
import { TableColumn, TableColumnGroup, isColumn, isColumnGroup } from '../../../types/table';

interface TableHeaderProps<T> {
  columns: (TableColumn<T> | TableColumnGroup<T>)[];
  level?: number;
  onSort?: (key: keyof T) => void;
}

export function TableHeader<T>({ columns, level = 0, onSort }: TableHeaderProps<T>) {
  return (
    <tr className={twMerge(
      "bg-gray-100 text-gray-700",
      level === 0 ? "font-bold" : level === 1 ? "font-semibold" : "font-medium"
    )}>
      {columns.map((col, index) => {
        if (isColumnGroup(col)) {
          let colspan = 0;
          for (const child of col.children) {
            if (isColumnGroup(child)) {
              colspan += child.children.filter(isColumn).length;
            } else {
              colspan += 1;
            }
          }
          return (
            <th
              key={`${col.title}-${index}`}
              colSpan={colspan}
              className="px-4 py-2 text-center border border-gray-200"
            >
              {col.title}
            </th>
          );
        }
        
        if (isColumn(col)) {
          return (
            <th
              key={`${col.title}-${index}`}
              className={twMerge(
                "px-4 py-2 text-center border border-gray-200",
                col.className
              )}
              onClick={() => col.sorter && onSort?.(col.key)}
              style={{ width: col.width }}
            >
              {col.title}
            </th>
          );
        }
        
        return null;
      })}
    </tr>
  );
} 