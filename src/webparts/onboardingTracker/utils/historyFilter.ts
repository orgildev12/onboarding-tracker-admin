import type { HistoryFilter, IHistoryEmployee } from '../models/HistoryEmployee';

export function filterHistory(
  employees: IHistoryEmployee[],
  query: string,
  filter: HistoryFilter
): IHistoryEmployee[] {
  const text = query.trim().toLowerCase();
  return employees.filter(employee => {
    if (filter !== 'all' && employee.result !== filter) {
      return false;
    }
    if (!text) {
      return true;
    }
    return `${employee.lastName} ${employee.firstName} ${employee.position}`.toLowerCase().indexOf(text) !== -1;
  });
}
