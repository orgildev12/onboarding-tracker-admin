import * as React from 'react';
import type { IEmployee } from '../../../../models/Employee';
import { getShortName } from '../../../../utils/employeeFormat';
import Avatar from '../common/Avatar';

export default function EmployeeIdentity({ employee }: { employee: IEmployee }): React.ReactElement {
  return (
    <div className="tw-flex tw-items-center tw-gap-3">
      <Avatar />
      <div>
        <div className="tw-text-sm tw-font-semibold">{getShortName(employee)}</div>
        <div className="tw-text-xs tw-text-gray-600">{employee.position}</div>
      </div>
    </div>
  );
}
