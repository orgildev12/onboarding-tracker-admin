import * as React from 'react';
import type { IEmployee, IProcessStep } from '../../../../models/Employee';
import EmployeeTableRow from './EmployeeTableRow';

export interface IEmployeeTableProps {
  employees: IEmployee[];
  steps: IProcessStep[];
  onSelectEmployee?: (employee: IEmployee) => void;
}

export default function EmployeeTable({ employees, steps, onSelectEmployee }: IEmployeeTableProps): React.ReactElement {
  // a step nobody has a process for is not shown at all
  const visibleIndexes = steps
    .map((_, i) => i)
    .filter(i => employees.length === 0 || employees.some(employee => employee.steps[i] !== 'noProcess'));
  const gridTemplateColumns = `220px 140px repeat(${visibleIndexes.length}, 150px)`;

  return (
    <div className="tw-overflow-x-auto tw-bg-white tw-rounded tw-shadow-sm tw-border tw-border-solid tw-border-line-light">
      <div className="tw-min-w-max tw-py-4">
        <div className="tw-grid tw-items-center tw-border-b tw-border-gray-800" style={{ gridTemplateColumns }}>
          <div className="tw-px-6 tw-py-3 tw-text-sm tw-font-semibold tw-text-center">Шинэ ажилчид</div>
          <div className="tw-px-4 tw-py-3 tw-text-sm tw-font-semibold tw-text-center">Төлөв</div>
          {visibleIndexes.map(i => (
            <div key={steps[i].key} className="tw-px-2 tw-py-3 tw-text-sm tw-font-semibold tw-text-center">
              {steps[i].title}
            </div>
          ))}
        </div>
        {employees.map(employee => (
          <EmployeeTableRow key={employee.id} employee={employee} steps={steps} visibleIndexes={visibleIndexes} gridTemplateColumns={gridTemplateColumns} onSelectEmployee={onSelectEmployee} />
        ))}
      </div>
    </div>
  );
}
