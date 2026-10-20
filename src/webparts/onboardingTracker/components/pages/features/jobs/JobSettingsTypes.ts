export interface IJobGroup {
  id: number;
  title: string;
}

export interface IJob {
  id: number;
  title: string;
  jobGroupId: number | undefined;
}

// A task from the Tasks list, used to pick tasks for a job / job group.
export interface ICatalogTask {
  id: number;
  title: string;
  taskGroupTitle: string;
  defaultBodyText: string;
}

export interface IJobTask {
  id: number;
  taskId: number;
  jobGroupId: number | undefined;
  jobId: number | undefined;
  order: number;
  bodyText: string;
  hasNewEmployeeInfo: boolean;
  otherTaskId: number | undefined;
}

export interface IJobTaskDraft {
  taskId: number;
  bodyText: string;
  hasNewEmployeeInfo: boolean;
  otherTaskId: number | undefined;
}

export type JobOwnerKind = 'group' | 'job';

export interface IJobOwner {
  kind: JobOwnerKind;
  id: number;
}

export interface IJobSettingsData {
  groups: IJobGroup[];
  jobs: IJob[];
  catalog: ICatalogTask[];
  jobTasks: IJobTask[];
}

export interface IJobSettingsFields {
  jobGroupOnJob: string;
  taskId: string;
  jobGroupId: string;
  jobId: string;
  otherTaskId: string;
  taskOrder: string;
  bodyText: string;
  hasNewEmployeeInfo: string;
}

export const EMPTY_JOB_SETTINGS: IJobSettingsData = { groups: [], jobs: [], catalog: [], jobTasks: [] };

export const DEFAULT_JOB_SETTINGS_FIELDS: IJobSettingsFields = {
  jobGroupOnJob: 'JobGroupID',
  taskId: 'TaskID',
  jobGroupId: 'JobGroupID',
  jobId: 'JobID',
  otherTaskId: 'OtherTaskID',
  taskOrder: 'TaskOrder',
  bodyText: 'TaskBodyText',
  hasNewEmployeeInfo: 'HasNewEmployeeInfo'
};

export function isOwnedBy(task: IJobTask, owner: IJobOwner): boolean {
  return owner.kind === 'group' ? task.jobGroupId === owner.id : task.jobId === owner.id;
}
