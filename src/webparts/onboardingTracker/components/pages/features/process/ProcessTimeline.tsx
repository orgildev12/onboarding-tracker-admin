import * as React from 'react';
import type { IEmployee, IProcessStep } from '../../../../models/Employee';
import type { IProcessTask } from '../../../../models/OnboardingProcess';
import ProcessStageAccordion from './ProcessStageAccordion';

export interface IProcessTimelineProps {
  employee: IEmployee;
  steps: IProcessStep[];
  tasksByStep: Record<string, IProcessTask[]>;
}

export default function ProcessTimeline({ employee, steps, tasksByStep }: IProcessTimelineProps): React.ReactElement {
  const [expandedKey, setExpandedKey] = React.useState<string | undefined>('relations');

  return (
    <div className="tw-overflow-hidden tw-rounded-lg tw-shadow-sm">
      {steps.map((step, index) => (
        <ProcessStageAccordion
          key={step.key}
          step={step}
          status={employee.steps[index] ?? 'notStarted'}
          expanded={expandedKey === step.key}
          tasks={tasksByStep[step.key] ?? []}
          onToggle={() => setExpandedKey(expandedKey === step.key ? undefined : step.key)}
        />
      ))}
    </div>
  );
}
