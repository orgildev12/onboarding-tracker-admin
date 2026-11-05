import * as React from 'react';
import type { IEmployee } from '../../../../models/Employee';
import type { GraphService } from '../../../../services/GraphService';
import EmployeeAvatar from '../common/EmployeeAvatar';
import PageIcon from '../common/PageIcon';
import ProgressBar from '../common/ProgressBar';
import { PROCESS_STATUS_CONFIG } from '../common/statusConfig';
import EmployeeInfoDialog from './EmployeeInfoDialog';
import type { EmployeeProfileServices } from './useEmployeeProfile';

export interface IEmployeeProcessSummaryProps {
  employee: IEmployee;
  services: EmployeeProfileServices;
  graph: GraphService;
}

export default function EmployeeProcessSummary({ employee, services, graph }: IEmployeeProcessSummaryProps): React.ReactElement {
  const status = PROCESS_STATUS_CONFIG[employee.status];
  const [infoOpen, setInfoOpen] = React.useState(false);

  return (
    <>
      <section className="tw-grid tw-grid-cols-1 md:tw-grid-cols-[1.4fr_1.2fr_1fr_auto] tw-items-center tw-gap-4 tw-p-4 tw-bg-white tw-rounded-lg tw-shadow-sm">
        <div className="tw-flex tw-items-center tw-gap-3">
          <EmployeeAvatar graph={graph} email={employee.workEmail} sizeClass="tw-w-10 tw-h-10" />
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

        <div className="tw-flex tw-items-start tw-justify-center tw-gap-3 tw-text-sm">
          <div className="tw-text-center">
            <div>{employee.hireDate}</div>
            <div className="tw-text-xs tw-text-gray-500">Ажилд орох</div>
          </div>
          <PageIcon name="ArrowRight" className="tw-mt-0.5 tw-text-gray-400" />
          <div className="tw-text-right">
            <div>{employee.probationEndDate}</div>
            <div className="tw-text-xs tw-text-gray-500">Жинхлэх</div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setInfoOpen(true)}
          className="tw-flex tw-items-center tw-gap-1 tw-justify-self-end tw-whitespace-nowrap tw-border-0 tw-bg-transparent tw-p-0 tw-text-sm tw-font-medium tw-text-ink tw-no-underline tw-cursor-pointer hover:tw-text-brand hover:tw-underline"
        >
          Ажилтны мэдээлэл харах
          <PageIcon name="ArrowRight" />
        </button>
      </section>

      {infoOpen && <EmployeeInfoDialog services={services} employee={employee} graph={graph} onClose={() => setInfoOpen(false)} />}
    </>
  );
}

