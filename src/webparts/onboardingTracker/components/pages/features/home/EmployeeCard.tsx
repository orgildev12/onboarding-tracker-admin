import * as React from 'react';
import type { IEmployee } from '../../../../models/Employee';
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
      className="tw-flex tw-flex-col tw-gap-2 tw-p-4 tw-bg-white tw-rounded tw-shadow-sm tw-border-0 tw-text-left tw-cursor-pointer hover:tw-shadow-md focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-brand"
    >
      <div>
        <div className="tw-flex tw-items-center tw-gap-2 tw-text-sm">
          <PageIcon name="Contact" className="tw-text-lg" />
          <span>
            {employee.lastName} <strong>{employee.firstName}</strong>
          </span>
        </div>
        <div className="tw-ml-7 tw-text-xs tw-text-gray-600">{employee.position}</div>
      </div>

      <div className={`tw-flex tw-items-center tw-gap-1 tw-text-xs ${status.cardTextClass}`}>
        <PageIcon name={status.cardIconName} />
        <span>{status.cardLabel}</span>
      </div>

      <ProgressBar
        value={employee.progress}
        fillClass={status.progressClass}
        fillStyle={{ backgroundColor: employee.status === 'delayed' ? '#A10D00' : '#6B7280' }}
      />

      <div className="tw-flex tw-justify-between tw-text-xs">
        <div>
          <div className="tw-font-semibold">Ажилд орох</div>
          <div className="tw-text-gray-600">{employee.hireDate}</div>
        </div>
        <div className="tw-text-right">
          <div className="tw-font-semibold">Жинхлэх</div>
          <div className="tw-text-gray-600">{employee.probationEndDate}</div>
        </div>
      </div>
    </button>
  );
}
