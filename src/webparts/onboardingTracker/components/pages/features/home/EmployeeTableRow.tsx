import * as React from 'react';
import type { IEmployee, IProcessStep } from '../../../../models/Employee';
import { getStepLinks } from '../../../../utils/stepLinks';
import EmployeeIdentity from './EmployeeIdentity';
import StatusBadge from './StatusBadge';
import StepCell from './StepCell';

export interface IEmployeeTableRowProps {
  employee: IEmployee;
  steps: IProcessStep[];
  // indexes into `steps` (and employee.steps) of the columns to show
  visibleIndexes: number[];
  gridTemplateColumns: string;
  onSelectEmployee?: (employee: IEmployee) => void;
}

export default function EmployeeTableRow({ employee, steps, visibleIndexes, gridTemplateColumns, onSelectEmployee }: IEmployeeTableRowProps): React.ReactElement {
  const links = getStepLinks(employee.steps);
  return (
    <div className="tw-grid tw-items-center" style={{ gridTemplateColumns }}>
      <div className="tw-px-6 tw-py-4 tw-border-r tw-border-gray-800">
        <EmployeeIdentity employee={employee} />
      </div>
      <div className="tw-px-4 tw-py-4 tw-text-center tw-border-r tw-border-gray-800">
        <StatusBadge status={employee.status} />
      </div>
      {visibleIndexes.map(i => (
        <StepCell
          key={steps[i].key}
          status={employee.steps[i] ?? 'notStarted'}
          links={links[i] ?? {}}
          onClick={onSelectEmployee ? () => onSelectEmployee(employee) : undefined}
          ariaLabel={`Open onboarding process for ${employee.firstName} ${employee.lastName}: ${steps[i].title}`}
        />
      ))}
    </div>
  );
}
