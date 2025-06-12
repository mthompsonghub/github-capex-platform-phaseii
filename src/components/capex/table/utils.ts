import { TableColumn, TableColumnGroup, isColumn, isColumnGroup } from '../../../types/table';

export const getLeafColumns = <T>(columns: TableColumnGroup<T>[]): TableColumn<T>[] => {
  const result: TableColumn<T>[] = [];
  
  for (const group of columns) {
    for (const child of group.children) {
      if (isColumnGroup(child) && child.children) {
        result.push(...child.children.filter(isColumn));
      } else if (isColumn(child)) {
        result.push(child);
      }
    }
  }
  
  return result;
}; 