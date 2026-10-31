import * as React from 'react';
import type { IHistoryEmployee } from '../../../../models/HistoryEmployee';
import { getShortName } from '../../../../utils/employeeFormat';
import PageIcon from '../common/PageIcon';
import { HISTORY_RESULT_CONFIG } from './historyConfig';

export interface IHistoryCardProps {
  employee: IHistoryEmployee;
  onClick: (employee: IHistoryEmployee) => void;
}

export default function HistoryCard({ employee, onClick }: IHistoryCardProps): React.ReactElement {
  const result = HISTORY_RESULT_CONFIG[employee.result];

  return (
    <button
      type="button"
      onClick={() => onClick(employee)}
      aria-label={`Open onboarding process for ${employee.firstName} ${employee.lastName}`}
      className={`tw-flex tw-flex-col tw-gap-2 tw-p-4 tw-border tw-border-solid tw-rounded tw-shadow-sm tw-text-left tw-cursor-pointer hover:tw-shadow-md focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-brand ${result.cardClass}`}
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

      <div className={`tw-flex tw-items-center tw-gap-1 tw-text-xs ${result.textClass}`}>
        <PageIcon name={result.iconName} />
        <span>{result.label}</span>
      </div>

      <div className="tw-flex tw-justify-between tw-text-xs">
        <div>
          <div className="tw-font-medium">Ажилд орсон</div>
          <div className="tw-text-gray-500">{employee.hireDate}</div>
        </div>
        <div className="tw-text-right">
          <div className="tw-font-medium">Дууссан</div>
          <div className="tw-text-gray-500">{employee.confirmedDate ?? '...'}</div>
        </div>
      </div>
    </button>
  );
}
