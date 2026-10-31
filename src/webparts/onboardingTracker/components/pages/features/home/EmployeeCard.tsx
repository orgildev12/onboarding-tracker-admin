import * as React from 'react';
import type { IEmployee } from '../../../../models/Employee';
import { getShortName } from '../../../../utils/employeeFormat';
import ProgressBar from '../common/ProgressBar';
import PageIcon from '../common/PageIcon';
import { PROCESS_STATUS_CONFIG } from '../common/statusConfig';

export default function EmployeeCard({ employee, onClick }: { employee: IEmployee; onClick: (employee: IEmployee) => void }): React.ReactElement {
  const status = PROCESS_STATUS_CONFIG[employee.status];

  return (
    <button
      type="button"
      onClick={() => onClick(employee)}
      aria-label={`Open onboarding process for ${employee.firstName} ${employee.lastName}`}
      className="tw-flex tw-flex-col tw-gap-2 tw-p-4 tw-bg-white tw-rounded tw-shadow-sm tw-border tw-border-solid tw-border-line-light tw-text-left tw-cursor-pointer hover:tw-shadow-md focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-brand"
    >
      <div className="tw-flex tw-items-center tw-gap-2">
        <PageIcon name="Contact" className="tw-shrink-0 tw-text-2xl" />
        <div className="tw-min-w-0">
          <div className="tw-text-sm tw-font-semibold tw-leading-tight">
            {getShortName(employee)}
          </div>
          <div className="tw-text-xs tw-font-semibold tw-text-gray-500">{employee.position}</div>
        </div>
      </div>

      <div className={`tw-flex tw-items-center tw-gap-1 tw-text-xs ${status.cardTextClass}`}>
        <PageIcon name={status.cardIconName} />
        <span>{status.cardLabel}</span>
      </div>

      <ProgressBar
        value={employee.progress}
        fillClass={status.progressClass}
        fillStyle={{ backgroundColor: employee.status === 'delayed' ? '#A10D00' : '#605E5C' }}
      />

      <div className="tw-flex tw-justify-between tw-text-xs">
        <div>
          <div className="tw-font-medium">Ажилд орох</div>
          <div className="tw-text-gray-500">{employee.hireDate}</div>
        </div>
        <div className="tw-text-right">
          <div className="tw-font-medium">Жинхлэх</div>
          <div className="tw-text-gray-500">{employee.probationEndDate}</div>
        </div>
      </div>
    </button>
  );
}
