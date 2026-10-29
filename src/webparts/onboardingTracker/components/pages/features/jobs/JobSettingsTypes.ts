export interface IJobGroup {
  id: number;
  title: string;
}

export interface IJob {
  id: number;
  title: string;
  jobGroupId: number | undefined;
  departmentId: number | undefined;
}

// A row of the Departments list: either a Gazar (isGazar) or a Heltes that belongs to a Gazar (gazarId).
export interface IDepartment {
  id: number;
  title: string;
  isGazar: boolean;
  gazarId: number | undefined;
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
  departments: IDepartment[];
}

export interface IJobSettingsFields {
  jobGroupOnJob: string;
  department: string;
  taskId: string;
  jobGroupId: string;
  jobId: string;
  otherTaskId: string;
  taskOrder: string;
  bodyText: string;
  hasNewEmployeeInfo: string;
}

export const EMPTY_JOB_SETTINGS: IJobSettingsData = {
  groups: [], jobs: [], catalog: [], jobTasks: [], departments: []
};

export const DEFAULT_JOB_SETTINGS_FIELDS: IJobSettingsFields = {
  jobGroupOnJob: 'JobGroupID',
  department: 'DepartmentID',
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
