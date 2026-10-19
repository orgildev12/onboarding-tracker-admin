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
  hireDate: string;
  probationEndDate: string;
  // one status per IProcessStep, in the same order
  steps: StepStatus[];
}
