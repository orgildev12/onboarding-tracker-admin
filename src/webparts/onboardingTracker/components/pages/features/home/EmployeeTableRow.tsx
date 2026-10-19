import * as React from 'react';
import type { IEmployee, IProcessStep } from '../../../../models/Employee';
import { getStepLinks } from '../../../../utils/stepLinks';
import EmployeeIdentity from './EmployeeIdentity';
import StatusBadge from './StatusBadge';
import StepCell from './StepCell';

export interface IEmployeeTableRowProps {
  employee: IEmployee;
  steps: IProcessStep[];
  gridTemplateColumns: string;
}

export default function EmployeeTableRow({ employee, steps, gridTemplateColumns }: IEmployeeTableRowProps): React.ReactElement {
  const links = getStepLinks(employee.steps);
  return (
    <div className="tw-grid tw-items-center" style={{ gridTemplateColumns }}>
      <div className="tw-px-6 tw-py-4 tw-border-r tw-border-gray-800">
        <EmployeeIdentity employee={employee} />
      </div>
      <div className="tw-px-4 tw-py-4 tw-text-center tw-border-r tw-border-gray-800">
        <StatusBadge status={employee.status} />
      </div>
      {steps.map((step, i) => (
        <StepCell key={step.key} status={employee.steps[i] ?? 'notStarted'} links={links[i] ?? {}} />
      ))}
    </div>
  );
}
