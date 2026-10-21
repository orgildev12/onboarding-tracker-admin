import * as React from 'react';
import type { IEmployee } from '../../../../models/Employee';
import Avatar from '../common/Avatar';
import PageIcon from '../common/PageIcon';
import ProgressBar from '../common/ProgressBar';
import { PROCESS_STATUS_CONFIG } from '../common/statusConfig';

export interface IEmployeeProcessSummaryProps {
  employee: IEmployee;
}

export default function EmployeeProcessSummary({ employee }: IEmployeeProcessSummaryProps): React.ReactElement {
  const status = PROCESS_STATUS_CONFIG[employee.status];

  return (
    <section className="tw-grid tw-grid-cols-1 md:tw-grid-cols-[1.4fr_1.2fr_0.8fr_0.7fr] tw-items-center tw-gap-4 tw-p-4 tw-bg-white tw-rounded-lg tw-shadow-sm">
      <div className="tw-flex tw-items-center tw-gap-3">
        <Avatar sizeClass="tw-w-12 tw-h-12" />
        <div>
          <div className="tw-text-sm tw-font-semibold">{employee.lastName} {employee.firstName}</div>
          <div className="tw-text-xs tw-text-gray-500">{employee.position}</div>
        </div>
      </div>

      <div className="tw-flex tw-flex-col tw-gap-2">
        <div className={`tw-flex tw-items-center tw-gap-1 tw-text-sm ${status.cardTextClass}`}>
          <PageIcon name={status.cardIconName} />
          <span>{status.cardLabel}</span>
          <span className="tw-ml-auto tw-text-xs tw-text-gray-500">{employee.tasksDone ?? 0}/{employee.tasksTotal ?? 0}</span>
        </div>
        <ProgressBar value={employee.progress} fillClass={status.progressClass} fillStyle={status.processProgressStyle} />
      </div>

      <div className="tw-text-center tw-text-sm">
        <div>{employee.hireDate}</div>
        <div className="tw-text-xs tw-text-gray-500">Ажилд орох</div>
      </div>

      <div className="tw-text-center tw-text-sm">
        <div>{employee.probationEndDate}</div>
        <div className="tw-text-xs tw-text-gray-500">Жинхлэх</div>
      </div>
    </section>
  );
}
