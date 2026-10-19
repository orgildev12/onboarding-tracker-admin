export type TaskStatus = 'completedLate' | 'delayed' | 'notStarted';

export interface IProcessTask {
  id: string;
  title: string;
  assignee: string;
  role: string;
  status: TaskStatus;
  completed: boolean;
  result?: string;
}
