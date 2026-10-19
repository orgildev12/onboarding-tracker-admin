import * as React from 'react';
import type { IProcessStep, StepStatus } from '../../../../models/Employee';
import type { IProcessTask } from '../../../../models/OnboardingProcess';
import StatusNode from '../common/StatusNode';
import PageIcon from '../common/PageIcon';
import { STEP_STATUS_CONFIG } from '../common/statusConfig';
import ProcessTaskTable from './ProcessTaskTable';

export interface IProcessStageAccordionProps {
  step: IProcessStep;
  status: StepStatus;
  expanded: boolean;
  tasks: IProcessTask[];
  onToggle: () => void;
}

export default function ProcessStageAccordion(props: IProcessStageAccordionProps): React.ReactElement {
  const { step, status, expanded, tasks, onToggle } = props;
  const statusLabel = STEP_STATUS_CONFIG[status].label;
  const isNotStarted = status === 'notStarted';

  return (
    <section className="tw-bg-white">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        className="tw-grid tw-w-full tw-grid-cols-[minmax(0,1fr)_minmax(180px,0.7fr)_24px] tw-items-center tw-gap-4 tw-border-0 tw-border-b tw-border-gray-200 tw-bg-white tw-px-4 tw-py-2 tw-text-left hover:tw-bg-gray-50"
      >
        <span className="tw-flex tw-items-center tw-gap-3">
          <StatusNode status={status} sizeClass="tw-w-5 tw-h-5" />
          <span>
            <span className="tw-block tw-text-sm tw-font-semibold">{step.title}</span>
            <span className="tw-block tw-text-xs tw-text-gray-500">{statusLabel}</span>
          </span>
        </span>
        <span className="tw-text-xs">
          <span className="tw-block tw-font-semibold">{isNotStarted ? 'Эхлээгүй' : 'Зарцуулсан хугацаа'}</span>
          <span className="tw-block tw-text-gray-500">{isNotStarted ? '—' : '2026.08.10 → 2026.08.10'}</span>
        </span>
        <PageIcon name={expanded ? 'ArrowUp' : 'ArrowDown'} className="tw-text-gray-600" />
      </button>
      {expanded && (
        tasks.length > 0
          ? <ProcessTaskTable tasks={tasks} />
          : <div className="tw-border-b tw-border-gray-200 tw-p-4 tw-pl-12 tw-text-sm tw-text-gray-500">Энэ үе шатны ажлын мэдээлэл одоогоор байхгүй.</div>
      )}
    </section>
  );
}
