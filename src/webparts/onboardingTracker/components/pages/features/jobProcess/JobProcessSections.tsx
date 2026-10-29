import * as React from 'react';
import PageIcon from '../common/PageIcon';
import { TRIGGER_LINES_GUTTER, TriggerLines, triggerRowBackground, useTriggerLines } from '../common/TriggerLines';
import type { ITriggerRelation } from '../common/TriggerLines';
import type { IJobProcessSection, IJobProcessTask } from './JobProcessTypes';
import { BY_OTHER_TASK } from './JobProcessTypes';

export interface IJobProcessSectionsProps {
  sections: IJobProcessSection[];
}

const HEADER_CELL = 'tw-px-4 tw-py-3 tw-text-left tw-text-xs tw-font-semibold tw-align-top tw-border-0 tw-border-r tw-border-b tw-border-solid tw-border-[#BFBFBF]';
const BODY_CELL = 'tw-px-4 tw-py-3 tw-align-middle tw-break-words tw-border-0 tw-border-b tw-border-r tw-border-solid tw-border-[#DADADA]';
const dash =  (value: string): string => value || '—';

function startText(task: IJobProcessTask): string {
  if (task.triggerType === BY_OTHER_TASK) {
    return task.triggerTaskTitle || (task.triggerTaskId === undefined ? '—' : `Task ${task.triggerTaskId}`);
  }
  return task.dayShouldBegin ? `${task.dayShouldBegin} дэх хоног` : '—';
}

// "Day should take" for tasks started by another task, otherwise the begin - end days.
function durationText(task: IJobProcessTask): string {
  if (task.triggerType === BY_OTHER_TASK) {
    return task.dayShouldTake ? `${task.dayShouldTake} хоног` : '—';
  }
  if (!task.dayShouldBegin && !task.dayShouldEnd) {
    return '—';
  }
  return task.dayShouldBegin === task.dayShouldEnd || !task.dayShouldEnd
    ? `${dash(task.dayShouldBegin)} дэх хоног`
    : `${dash(task.dayShouldBegin)} - ${dash(task.dayShouldEnd)} дэх хоног`;
}

export default function JobProcessSections({ sections }: IJobProcessSectionsProps): React.ReactElement {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [collapsed, setCollapsed] = React.useState<Record<number, boolean>>({});

  const groupOfTask = React.useMemo(() => {
    const map = new Map<number, number>();
    sections.forEach(section => section.tasks.forEach(task => map.set(task.taskId, section.groupId)));
    return map;
  }, [sections]);
  const relations = React.useMemo(() => {
    const result: ITriggerRelation[] = [];
    sections.forEach(section => section.tasks.forEach(task => {
      if (task.triggerTaskId !== undefined && groupOfTask.has(task.triggerTaskId)) {
        result.push({ sourceId: task.triggerTaskId, targetId: task.taskId });
      }
    }));
    return result;
  }, [sections, groupOfTask]);

  // a collapsed group is represented by its header
  const findAnchor = React.useCallback((container: HTMLElement, taskId: number): Element | undefined => {
    const groupId = groupOfTask.get(taskId);
    const selector = groupId !== undefined && collapsed[groupId]
      ? `[data-group-header="${groupId}"]`
      : `[data-task-id="${taskId}"]`;
    return container.querySelector(selector) ?? undefined;
  }, [groupOfTask, collapsed]);

  const { lines, selectedId, toggleTask, related } = useTriggerLines(containerRef, relations, findAnchor);

  return (
    <div ref={containerRef} className="tw-relative" style={{ paddingRight: TRIGGER_LINES_GUTTER }}>
      {sections.map(section => {
        const isCollapsed = !!collapsed[section.groupId];
        return (
          <section key={section.groupId} className="tw-bg-white">
            <button
              type="button"
              data-group-header={section.groupId}
              aria-expanded={!isCollapsed}
              onClick={() => setCollapsed(current => ({ ...current, [section.groupId]: !current[section.groupId] }))}
              className="tw-flex tw-w-full tw-items-center tw-justify-between tw-border-0 tw-border-b tw-border-solid tw-border-gray-200 tw-bg-white tw-px-4 tw-py-3 tw-text-left tw-text-sm tw-font-semibold tw-cursor-pointer hover:tw-bg-gray-50"
            >
              <span>{section.title || 'Бүлэггүй'}</span>
              <PageIcon name={isCollapsed ? 'ArrowDown' : 'ArrowUp'} className="tw-h-6 tw-w-6 tw-text-[#292D32]" />
            </button>
            {!isCollapsed && (
              <div className="tw-my-4 tw-overflow-x-auto tw-border tw-border-solid tw-border-[#292D32]">
                <table className="tw-w-full tw-min-w-[760px] tw-border-collapse tw-text-xs" style={{ tableLayout: 'fixed' }}>
                  <colgroup>
                    <col style={{ width: '26%' }} />
                    <col style={{ width: '16%' }} />
                    <col style={{ width: '26%' }} />
                    <col style={{ width: '17%' }} />
                    <col />
                  </colgroup>
                  <thead>
                    <tr>
                      <th className={HEADER_CELL}>Ажилууд</th>
                      <th className={HEADER_CELL}>Хариуцагч</th>
                      <th className={HEADER_CELL}>Очих мессеж</th>
                      <th className={HEADER_CELL}>
                        Эхлэх өдөр / Эхлүүлэх ажилбар
                        <span className="tw-block tw-font-normal tw-text-gray-500">(ажлын өдрөөр)</span>
                      </th>
                      <th className={`${HEADER_CELL} tw-border-r-0`}>
                        Зарцуулах хугацаа
                        <span className="tw-block tw-font-normal tw-text-gray-500">(ажлын өдрөөр)</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {section.tasks.map(task => {
                      const background = triggerRowBackground(task.taskId, selectedId, related);
                      return (
                        <tr
                          key={task.taskId}
                          data-task-id={task.taskId}
                          tabIndex={0}
                          style={{ backgroundColor: background }}
                          className="tw-cursor-pointer tw-transition-colors hover:tw-bg-gray-50"
                          onClick={() => toggleTask(task.taskId)}
                          onKeyDown={event => {
                            if (event.key === 'Enter' || event.key === ' ') {
                              event.preventDefault();
                              toggleTask(task.taskId);
                            }
                          }}
                        >
                          <td className={BODY_CELL}>{task.title}</td>
                          <td className={BODY_CELL}>{dash(task.roleTitle)}</td>
                          <td className={`${BODY_CELL} tw-whitespace-pre-wrap`}>{dash(task.bodyText)}</td>
                          <td className={BODY_CELL}>{startText(task)}</td>
                          <td className={`${BODY_CELL} tw-border-r-0`}>{durationText(task)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        );
      })}
      <TriggerLines lines={lines} />
    </div>
  );
}
