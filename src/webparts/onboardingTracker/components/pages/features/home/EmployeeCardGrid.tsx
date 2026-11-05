import * as React from 'react';
import type { IEmployee } from '../../../../models/Employee';
import type { GraphService } from '../../../../services/GraphService';
import EmployeeCard from './EmployeeCard';

export default function EmployeeCardGrid({
  employees,
  graph,
  onSelectEmployee
}: {
  employees: IEmployee[];
  graph: GraphService;
  onSelectEmployee: (employee: IEmployee) => void;
}): React.ReactElement {
  return (
    <div className="tw-grid tw-gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}>
      {employees.map(employee => <EmployeeCard key={employee.id} employee={employee} graph={graph} onClick={onSelectEmployee} />)}
    </div>
  );
}
