import * as React from 'react';
import type { IEmployee } from '../../models/Employee';
import { DUMMY_STEPS } from '../../data/dummyEmployees';
import { DUMMY_PROCESS_TASKS } from '../../data/dummyProcessTasks';
import PageIcon from './features/common/PageIcon';
import EmployeeProcessSummary from './features/process/EmployeeProcessSummary';
import ProcessTimeline from './features/process/ProcessTimeline';

export interface INewEmployeeProcessPageProps {
  employee: IEmployee;
  onBack: () => void;
}

export default function NewEmployeeProcessPage({ employee, onBack }: INewEmployeeProcessPageProps): React.ReactElement {
  return (
    <div className="tw-flex tw-flex-col tw-gap-4 tw-bg-surface tw-p-4 tw-min-h-full">
      <div className="tw-flex tw-items-center tw-gap-3">
        <button
          type="button"
          onClick={onBack}
          aria-label="Буцах"
          className="tw-flex tw-h-8 tw-w-8 tw-items-center tw-justify-center tw-rounded tw-border-0 tw-bg-white tw-text-gray-700 hover:tw-bg-gray-100"
        >
          <PageIcon name="ArrowLeft" />
        </button>
        <h1 className="tw-m-0 tw-text-lg tw-font-semibold">Onboarding process tracker</h1>
      </div>

      <EmployeeProcessSummary employee={employee} />

      <ProcessTimeline
        employee={employee}
        steps={DUMMY_STEPS}
        tasksByStep={{ relations: DUMMY_PROCESS_TASKS }}
      />
    </div>
  );
}
