export type TaskStatus = 'notStarted' | 'started' | 'delayed' | 'completed' | 'completedLate';

export type TaskResultKind = 'none' | 'date' | 'multipleImages' | 'singleImageWithStatus' | 'forms';

export interface IProcessPerson {
  name: string;
  email: string;
}

export interface IProcessTask {
  id: string;
  taskId: number;
  employeeId: number;
  title: string;
  // set when the task runs after another task (TriggerType ByOtherTask)
  triggerTaskId: number | undefined;
  assignees: IProcessPerson[];
  role: string;
  status: TaskStatus;
  completed: boolean;
  resultKind: TaskResultKind;
  // list holding the result rows (Tasks.TaskFieldTableName)
  resultTable: string;
  timing: IProcessTaskTiming;
}

export interface IProcessTaskTiming {
  // "2026.08.10 → 2026.08.12", '—' when the dates are unknown
  planned: string;
  actual: string;
  // whole days late, 0 when on time
  delayDays: number;
  delayReason: string;
}