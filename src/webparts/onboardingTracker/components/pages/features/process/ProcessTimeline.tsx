import * as React from 'react';
import type { IEmployee, IProcessStep } from '../../../../models/Employee';
import type { IProcessTask } from '../../../../models/OnboardingProcess';
import type { ListService } from '../../../../services/ListService';
import type { GraphService } from '../../../../services/GraphService';
import ProcessStageAccordion from './ProcessStageAccordion';

export interface IProcessTimelineProps {
  employee: IEmployee;
  steps: IProcessStep[];
  tasksByStep: Record<string, IProcessTask[]>;
  createListService: (listName: string) => ListService;
  graph: GraphService;
}

export default function ProcessTimeline({ employee, steps, tasksByStep, createListService, graph }: IProcessTimelineProps): React.ReactElement {
  const firstStepWithTasks = steps.filter(step => (tasksByStep[step.key] ?? []).length > 0)[0];
  const [expandedKey, setExpandedKey] = React.useState<string | undefined>(firstStepWithTasks ? firstStepWithTasks.key : undefined);

  return (
    <div className="tw-overflow-hidden tw-rounded-lg tw-shadow-sm">
      {steps.map((step, index) => (
        <ProcessStageAccordion
          key={step.key}
          step={step}
          status={employee.steps[index] ?? 'notStarted'}
          period={employee.stepPeriods ? employee.stepPeriods[index] : ''}
          expanded={expandedKey === step.key}
          tasks={tasksByStep[step.key] ?? []}
          createListService={createListService}
          graph={graph}
          onToggle={() => setExpandedKey(expandedKey === step.key ? undefined : step.key)}
        />
      ))}
    </div>
  );
}
