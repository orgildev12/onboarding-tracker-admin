import * as React from 'react';
import type { IHistoryEmployee } from '../../../../models/HistoryEmployee';
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
      className={`tw-flex tw-flex-col tw-gap-3 tw-p-4 md:tw-p-5 tw-border tw-border-solid tw-rounded-lg tw-text-left tw-cursor-pointer hover:tw-shadow-md focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-brand ${result.cardClass}`}
    >
      <div className="tw-flex tw-items-center tw-gap-3">
        <PageIcon name="Contact" className="tw-text-2xl tw-flex-shrink-0" />
        <div>
          <div className="tw-text-sm">
            {employee.lastName} <strong>{employee.firstName}</strong>
          </div>
          <div className="tw-text-xs tw-text-gray-600">{employee.position}</div>
        </div>
      </div>

      <div className={`tw-flex tw-items-center tw-gap-1 tw-text-xs ${result.textClass}`}>
        <PageIcon name={result.iconName} />
        <span>{result.label}</span>
      </div>

      <div className="tw-flex tw-justify-between tw-text-xs">
        <div>
          <div className="tw-font-semibold">Ажилд орсон</div>
          <div className="tw-text-gray-600">{employee.hireDate}</div>
        </div>
        <div className="tw-text-right">
          <div className="tw-font-semibold">Дууссан</div>
          <div className="tw-text-gray-600">{employee.confirmedDate ?? '...'}</div>
        </div>
      </div>
    </button>
  );
}
