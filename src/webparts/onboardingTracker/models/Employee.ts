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
  hireDate: string;
  probationEndDate: string;
  // one status per IProcessStep, in the same order
  steps: StepStatus[];
  // "began → ended" text per step, '' when the step has not started
  stepPeriods?: string[];
}
