import * as React from 'react';
import { PersonaSize } from '@fluentui/react/lib/Persona';
import type { IProcessTask, TaskResultKind } from '../../../../models/OnboardingProcess';
import type { ListService } from '../../../../services/ListService';
import type { GraphService } from '../../../../services/GraphService';
import UserPersona from '../newEmployees/UserPersona';
import ProcessResultDialog from './ProcessResultDialog';
import TaskStatusPill from './TaskStatusPill';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const CHAIN_IMAGE: string = require('../../../../assets/chain.png');

// Chain picture: 18px wide, 43px tall, consecutive pictures overlap by ~13% so the links join.
const CHAIN_WIDTH = 18;
const CHAIN_HEIGHT = 43;
const CHAIN_OVERLAP = 5.7;
const CHAIN_COLUMN_WIDTH = 32;
// Upper estimate of a row's height, used only to decide how many chain pictures to render.
const CHAIN_MAX_ROW_HEIGHT = 120;

const RESULT_LABELS: Record<TaskResultKind, string> = {
  none: '',
  date: 'Огноо харах',
  multipleImages: 'Зураг харах',
  singleImageWithStatus: 'Хариу харах',
  forms: 'Асуумж харах'
};

const HEADER_CELL = 'tw-px-4 tw-py-6 tw-text-left tw-text-xs tw-font-semibold tw-border-0 tw-border-r tw-border-solid tw-border-[#BFBFBF]';
const BODY_CELL = 'tw-px-4 tw-py-3 tw-align-middle tw-border-0 tw-border-b tw-border-r tw-border-solid tw-border-[#DADADA]';

export interface IProcessTaskTableProps {
  tasks: IProcessTask[];
  createListService: (listName: string) => ListService;
  graph: GraphService;
}

// A task that is triggered by the task right above it is joined to it with a chain.
const isChainedToPrevious = (tasks: IProcessTask[], index: number): boolean =>
  index > 0 && index < tasks.length && tasks[index].triggerTaskId !== undefined && tasks[index].triggerTaskId === tasks[index - 1].taskId;

// Enough pictures to fill a merged cell of `rows` rows; the cell clips whatever does not fit.
function ChainLinks({ rows }: { rows: number }): React.ReactElement {
  const count = Math.ceil((rows * CHAIN_MAX_ROW_HEIGHT) / (CHAIN_HEIGHT - CHAIN_OVERLAP));
  const links: React.ReactElement[] = [];
  for (let i = 0; i < count; i++) {
    links.push(
      <img
        key={i}
        src={CHAIN_IMAGE}
        alt=""
        width={CHAIN_WIDTH}
        height={CHAIN_HEIGHT}
        style={{ display: 'block', flexShrink: 0, marginTop: i === 0 ? 0 : -CHAIN_OVERLAP }}
      />
    );
  }
  return <>{links}</>;
}

export default function ProcessTaskTable({ tasks, createListService, graph }: IProcessTaskTableProps): React.ReactElement {
  const [resultTask, setResultTask] = React.useState<IProcessTask | undefined>();

  // Number of rows a chain cell must span when row `index` starts a linked run, otherwise 1.
  const chainRows = (index: number): number => {
    let end = index;
    while (isChainedToPrevious(tasks, end + 1)) {
      end++;
    }
    return end - index + 1;
  };

  return (
    <div className="tw-p-2">
      {resultTask && (
        <ProcessResultDialog task={resultTask} createListService={createListService} onClose={() => setResultTask(undefined)} />
      )}
      <div className="tw-overflow-x-auto tw-border tw-border-solid tw-border-[#292D32]">
        <table className="tw-w-full tw-min-w-[800px] tw-border-collapse tw-text-xs" style={{ tableLayout: 'fixed' }}>
          <colgroup>
            <col style={{ width: CHAIN_COLUMN_WIDTH }} />
            <col style={{ width: '34%' }} />
            <col style={{ width: '28%' }} />
            <col style={{ width: '16%' }} />
            <col />
          </colgroup>
          <thead>
            <tr style={{ backgroundColor: 'rgba(241, 89, 0, 0.25)' }}>
              <th colSpan={2} className={HEADER_CELL}>Ажилууд</th>
              <th className={HEADER_CELL}>Хариуцагч</th>
              <th className={HEADER_CELL}>Төлөв</th>
              <th className={`${HEADER_CELL} tw-border-r-0`}>Үр дүн</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((task, index) => {
              return (
                <tr key={task.id}>
                  {!isChainedToPrevious(tasks, index) && (
                    chainRows(index) > 1
                      ? (
                        <td rowSpan={chainRows(index)} className={`${BODY_CELL} tw-relative tw-overflow-hidden tw-p-0`}>
                          <div aria-hidden="true" className="tw-absolute tw-inset-0 tw-flex tw-flex-col tw-items-center tw-overflow-hidden">
                            <ChainLinks rows={chainRows(index)} />
                          </div>
                        </td>
                      )
                      : <td className={`${BODY_CELL} tw-p-0`} />
                  )}
                  <td className={BODY_CELL}>
                    <label className="tw-flex tw-items-center tw-gap-3">
                      <input type="checkbox" checked={task.completed} readOnly className="tw-m-0 tw-h-4 tw-w-4 tw-shrink-0 tw-accent-[#6B6B6B]" />
                      <span>{task.title}</span>
                    </label>
                  </td>
                  <td className={BODY_CELL}>
                    {task.assignees.length === 0 && <div className="tw-text-gray-500">{task.role}</div>}
                    {task.assignees.map(person => (
                      <UserPersona
                        key={person.email || person.name}
                        graph={graph}
                        name={person.name}
                        email={person.email}
                        secondaryText={task.role}
                        size={PersonaSize.size40}
                      />
                    ))}
                  </td>
                  <td className={BODY_CELL}>
                    <TaskStatusPill status={task.status} timing={task.timing} />
                  </td>
                  <td className={`${BODY_CELL} tw-border-r-0`}>
                    {task.resultKind !== 'none' && (
                      <button
                        type="button"
                        disabled={!task.completed}
                        onClick={() => setResultTask(task)}
                        className="tw-border tw-border-solid tw-border-brand tw-bg-white tw-px-4 tw-py-2 tw-text-xs tw-text-brand disabled:tw-border-gray-300 disabled:tw-text-gray-400"
                      >
                        {RESULT_LABELS[task.resultKind]}
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
