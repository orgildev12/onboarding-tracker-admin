import * as React from 'react';
import type { IEmployee, IProcessStep } from '../../../../models/Employee';
import EmployeeTableRow from './EmployeeTableRow';

export interface IEmployeeTableProps {
  employees: IEmployee[];
  steps: IProcessStep[];
  onSelectEmployee?: (employee: IEmployee) => void;
}

export default function EmployeeTable({ employees, steps, onSelectEmployee }: IEmployeeTableProps): React.ReactElement {
  const gridTemplateColumns = `220px 140px repeat(${steps.length}, 150px)`;

  return (
    <div className="tw-overflow-x-auto tw-bg-white tw-rounded tw-shadow-sm">
      <div className="tw-min-w-max tw-py-4">
        <div className="tw-grid tw-items-center tw-border-b tw-border-gray-800" style={{ gridTemplateColumns }}>
          <div className="tw-px-6 tw-py-3 tw-text-sm tw-font-semibold tw-text-center">Шинэ ажилчид</div>
          <div className="tw-px-4 tw-py-3 tw-text-sm tw-font-semibold tw-text-center">Төлөв</div>
          {steps.map(step => (
            <div key={step.key} className="tw-px-2 tw-py-3 tw-text-sm tw-font-semibold tw-text-center">
              {step.title}
            </div>
          ))}
        </div>
        {employees.map(employee => (
          <EmployeeTableRow key={employee.id} employee={employee} steps={steps} gridTemplateColumns={gridTemplateColumns} onSelectEmployee={onSelectEmployee} />
        ))}
      </div>
    </div>
  );
}
