export type ProcessStatus = 'normal' | 'delayed';

export type StepStatus =
  | 'completedOnTime'
  | 'completedLate'
  | 'noProcess'
  | 'inProgress'
  | 'delayed'
  | 'notStarted';

export interface IProcessStep {
  key: string;
  title: string;
}

export interface IEmployee {
  id: number;
  lastName: string;
  firstName: string;
  position: string;
  status: ProcessStatus;
  // 0-100
  progress: number;
  // completed / total tasks the progress is based on
  tasksDone?: number;
  tasksTotal?: number;
  // false while the field plan has not been turned into the full task list (only tasks 1-3 exist);
  // undefined (not loaded from NewEmployee) counts as created
  tasksCreated?: boolean;
  hireDate: string;
  probationEndDate: string;
  // one status per IProcessStep, in the same order
  steps: StepStatus[];
  // "began → ended" text per step, '' when the step has not started
  stepPeriods?: string[];
  // raw HasPassed choice text of the NewEmployee row
  hasPassed?: string;
}
