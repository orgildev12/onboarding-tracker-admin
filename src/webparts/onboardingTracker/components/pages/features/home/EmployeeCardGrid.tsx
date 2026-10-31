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
    <div className="tw-grid tw-gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}>
      {employees.map(employee => <EmployeeCard key={employee.id} employee={employee} onClick={onSelectEmployee} />)}
    </div>
  );
}
