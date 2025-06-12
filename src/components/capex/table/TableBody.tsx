import { ReactNode } from 'react';
import { twMerge } from 'tailwind-merge';
import { TableColumn } from '../../../types/table';

interface TableBodyProps<T> {
  data: T[];
  columns: TableColumn<T>[];
}

export function TableBody<T extends { id?: string | number }>({ data, columns }: TableBodyProps<T>) {
  const renderValue = (value: unknown): ReactNode => {
    if (value === null || value === undefined) return '';
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      return String(value);
    }
    return '';
  };

  return (
    <>
      {data.map((row, rowIndex) => (
        <tr 
          key={row.id || rowIndex} 
          className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
        >
          {columns.map((col, colIndex) => {
            const value = row[col.key];
            return (
              <td
                key={`${String(col.key)}-${colIndex}`}
                className={twMerge(
                  "px-4 py-2 border border-gray-200",
                  col.className
                )}
              >
                {col.render ? col.render(value, row) : renderValue(value)}
              </td>
            );
          })}
        </tr>
      ))}
    </>
  );
} 