import * as React from 'react';
import type { IHistoryEmployee } from '../../../../models/HistoryEmployee';
import HistoryCard from './HistoryCard';

export interface IHistoryCardGridProps {
  employees: IHistoryEmployee[];
  onSelectEmployee: (employee: IHistoryEmployee) => void;
}

export default function HistoryCardGrid({ employees, onSelectEmployee }: IHistoryCardGridProps): React.ReactElement {
  if (employees.length === 0) {
    return <p className="tw-m-0 tw-text-sm tw-text-gray-500">Илэрц олдсонгүй</p>;
  }

  return (
    <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 lg:tw-grid-cols-3 tw-gap-5">
      {employees.map(employee => <HistoryCard key={employee.id} employee={employee} onClick={onSelectEmployee} />)}
    </div>
  );
}
