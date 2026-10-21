import * as React from 'react';
import type { IProcessStep, StepStatus } from '../../../../models/Employee';
import type { IProcessTask } from '../../../../models/OnboardingProcess';
import type { ListService } from '../../../../services/ListService';
import type { GraphService } from '../../../../services/GraphService';
import StatusNode from '../common/StatusNode';
import PageIcon from '../common/PageIcon';
import { STEP_STATUS_CONFIG } from '../common/statusConfig';
import ProcessTaskTable from './ProcessTaskTable';

export interface IProcessStageAccordionProps {
  step: IProcessStep;
  status: StepStatus;
  // "began → ended" text, '' when not started
  period: string;
  expanded: boolean;
  tasks: IProcessTask[];
  createListService: (listName: string) => ListService;
  graph: GraphService;
  onToggle: () => void;
}

export default function ProcessStageAccordion(props: IProcessStageAccordionProps): React.ReactElement {
  const { step, status, period, expanded, tasks, createListService, graph, onToggle } = props;
  const statusStyle = STEP_STATUS_CONFIG[status];
  const statusLabel = statusStyle.label;
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
          <StatusNode status={status} sizeClass="tw-w-7 tw-h-7" />
          <span>
            <span className="tw-block tw-text-sm tw-font-semibold">{step.title}</span>
            <span className={`tw-block tw-text-xs ${statusStyle.textClass}`}>{statusLabel}</span>
          </span>
        </span>
        <span className="tw-text-xs">
          <span className="tw-block tw-font-semibold">{isNotStarted ? 'Эхлээгүй' : 'Зарцуулсан хугацаа'}</span>
          <span className="tw-block tw-text-gray-500">{isNotStarted ? '—' : period || '—'}</span>
        </span>
        <PageIcon name={expanded ? 'ArrowUp' : 'ArrowDown'} className="tw-h-6 tw-w-6 tw-text-[#292D32]" />
      </button>
      {expanded && (
        tasks.length > 0
          ? <ProcessTaskTable tasks={tasks} createListService={createListService} graph={graph} />
          : <div className="tw-border-b tw-border-gray-200 tw-p-4 tw-pl-12 tw-text-sm tw-text-gray-500">Энэ үе шатны ажлын мэдээлэл одоогоор байхгүй.</div>
      )}
    </section>
  );
}
