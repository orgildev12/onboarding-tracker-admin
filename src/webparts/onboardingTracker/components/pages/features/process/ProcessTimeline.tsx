import * as React from 'react';
import type { IEmployee, IProcessStep } from '../../../../models/Employee';
import type { IProcessTask } from '../../../../models/OnboardingProcess';
import type { ListService } from '../../../../services/ListService';
import type { GraphService } from '../../../../services/GraphService';
import ProcessStageAccordion from './ProcessStageAccordion';
import { TRIGGER_LINES_GUTTER, TriggerLines, useTriggerLines } from '../common/TriggerLines';
import type { ITriggerRelation } from '../common/TriggerLines';

export interface IProcessTimelineProps {
  employee: IEmployee;
  steps: IProcessStep[];
  tasksByStep: Record<string, IProcessTask[]>;
  createListService: (listName: string) => ListService;
  graph: GraphService;
}

export default function ProcessTimeline({ employee, steps, tasksByStep, createListService, graph }: IProcessTimelineProps): React.ReactElement {
  // all stages start collapsed
  const [expandedKey, setExpandedKey] = React.useState<string | undefined>(undefined);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const stepOfTask = React.useMemo(() => {
    const map = new Map<number, string>();
    steps.forEach(step => (tasksByStep[step.key] ?? []).forEach(task => map.set(task.taskId, step.key)));
    return map;
  }, [steps, tasksByStep]);
  const relations = React.useMemo(() => {
    const result: ITriggerRelation[] = [];
    steps.forEach(step => (tasksByStep[step.key] ?? []).forEach(task => {
      if (task.triggerTaskId !== undefined && stepOfTask.has(task.triggerTaskId)) {
        result.push({ sourceId: task.triggerTaskId, targetId: task.taskId });
      }
    }));
    return result;
  }, [steps, tasksByStep, stepOfTask]);

  // a collapsed stage is represented by its header
  const findAnchor = React.useCallback((container: HTMLElement, taskId: number): Element | undefined => {
    const stepKey = stepOfTask.get(taskId);
    const selector = stepKey !== undefined && stepKey === expandedKey
      ? `[data-task-id="${taskId}"]`
      : `[data-group-header="${stepKey}"]`;
    return container.querySelector(selector) ?? undefined;
  }, [stepOfTask, expandedKey]);

  const { lines, selectedId, toggleTask, related } = useTriggerLines(containerRef, relations, findAnchor);

  return (
    <div ref={containerRef} className="tw-relative" style={{ paddingRight: TRIGGER_LINES_GUTTER }}>
      <div className="tw-overflow-hidden tw-rounded-lg tw-shadow-sm">
        {steps.map((step, index) => (tasksByStep[step.key] ?? []).length === 0 ? undefined : (
          <ProcessStageAccordion
            key={step.key}
            step={step}
            status={employee.steps[index] ?? 'notStarted'}
            period={employee.stepPeriods ? employee.stepPeriods[index] : ''}
            expanded={expandedKey === step.key}
            tasks={tasksByStep[step.key] ?? []}
            createListService={createListService}
            graph={graph}
            selectedTaskId={selectedId}
            relatedTaskIds={related}
            onSelectTask={toggleTask}
            onToggle={() => setExpandedKey(expandedKey === step.key ? undefined : step.key)}
          />
        ))}
      </div>
      <TriggerLines lines={lines} />
    </div>
  );
}
