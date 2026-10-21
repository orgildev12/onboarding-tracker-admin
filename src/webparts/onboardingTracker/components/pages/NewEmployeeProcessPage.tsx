import * as React from 'react';
import type { IEmployee } from '../../models/Employee';
import type { IOnboardingTrackerProps } from '../IOnboardingTrackerProps';
import styles from '../OnboardingTracker.module.scss';
import PageIcon from './features/common/PageIcon';
import EmployeeProcessSummary from './features/process/EmployeeProcessSummary';
import ProcessTimeline from './features/process/ProcessTimeline';
import { useOnboardingData } from './features/process/useOnboardingData';

export interface INewEmployeeProcessPageProps extends IOnboardingTrackerProps {
  employee: IEmployee;
  onBack: () => void;
}

export default function NewEmployeeProcessPage(props: INewEmployeeProcessPageProps): React.ReactElement {
  const { onBack, createListService } = props;
  const { data, loading, error } = useOnboardingData(props, props.employee.id);
  const employee = data.employees.filter(e => e.id === props.employee.id)[0];

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

      {error && <p className={styles.error} role="alert">{error}</p>}
      {loading && <p className="tw-text-sm tw-text-gray-500">Ачаалж байна...</p>}

      {employee && (
        <>
          <EmployeeProcessSummary employee={employee} />

          <ProcessTimeline
            employee={employee}
            steps={data.steps}
            tasksByStep={data.tasksByEmployee[employee.id] || {}}
            createListService={createListService}
            graph={props.graphService}
          />
        </>
      )}    </div>
  );
}
