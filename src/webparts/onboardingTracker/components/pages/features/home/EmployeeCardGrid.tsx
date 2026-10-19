import * as React from 'react';
import type { IEmployee } from '../../../../models/Employee';
import EmployeeCard from './EmployeeCard';

export default function EmployeeCardGrid({
  employees,
  onSelectEmployee
}: {
  employees: IEmployee[];
  onSelectEmployee: (employee: IEmployee) => void;
}): React.ReactElement {
  return (
    <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 xl:tw-grid-cols-3 tw-gap-4">
      {employees.map(employee => <EmployeeCard key={employee.id} employee={employee} onClick={onSelectEmployee} />)}
    </div>
  );
}
