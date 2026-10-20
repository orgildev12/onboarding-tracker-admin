import type { ListItem } from '../../../../services/ListService';

export interface ITaskGroup {
  id: number;
  title: string;
  order: number;
  item: ListItem;
}

export interface ITask {
  id: number;
  title: string;
  triggerType: string;
  dayShouldBegin: string;
  dayShouldEnd: string;
  triggerTaskId: number | undefined;
  dayShouldTake: string;
  handlerType: string;
  taskOwnerRoleId: number | undefined;
  taskType: string;
  taskFieldTableName: string;
  taskDefaultBodyText: string;
  taskGroupId: number;
  taskOrder: number;
  item: ListItem;
}

export interface ITaskDraft {
  title: string;
  triggerType: string;
  dayShouldBegin: string;
  dayShouldEnd: string;
  triggerTaskId: string;
  dayShouldTake: string;
  handlerType: string;
  taskOwnerRoleId: string;
  taskType: string;
  taskFieldTableName: string;
  taskDefaultBodyText: string;
  taskGroupId: number;
}

export interface ITaskGroupDraft {
  title: string;
}

export interface ITaskOwnerRole {
  id: number;
  title: string;
}

export interface ITaskAdminLookups {
  triggerTaskField: string;
  ownerRoleField: string;
  taskGroupField: string;
}

export const TRIGGER_TYPES = ['ByDate', 'ByOtherTask'];
export const HANDLER_TYPES = ['ByTaskOwner', 'BySystem', 'ByOtherSystem'];
export const TASK_TYPES = ['Check', 'Date', 'MultipleImages', 'SingleImageWithStatus', 'Forms'];
export const MAX_TASKS_PER_GROUP = 50;

export const TASK_RESULT_TABLE_BY_TYPE: Record<string, string> = {
  Check: 'TaskResultsStatusFields',
  Date: 'TaskResultsTypeDate',
  MultipleImages: 'TaskResultsTypeMultipleImages',
  SingleImageWithStatus: 'TaskResultsTypeSingleImageWithStatus',
  Forms: 'TaskResultsForms'
};

export const EMPTY_TASK_DRAFT: ITaskDraft = {
  title: '',
  triggerType: 'ByDate',
  dayShouldBegin: '1',
  dayShouldEnd: '1',
  triggerTaskId: '',
  dayShouldTake: '1',
  handlerType: 'ByTaskOwner',
  taskOwnerRoleId: '',
  taskType: 'Check',
  taskFieldTableName: '',
  taskDefaultBodyText: '',
  taskGroupId: 0
};
