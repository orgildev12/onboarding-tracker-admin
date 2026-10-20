import * as React from 'react';
import type { IOnboardingTrackerProps } from '../../../IOnboardingTrackerProps';
import type { ListItem } from '../../../../services/ListService';
import {
  booleanValue,
  findFieldName,
  findLookupField,
  numberValue,
  readLookupId,
  readValue,
  textValue
} from '../../../../utils/listFields';
import type { IJobOwner, IJobSettingsData, IJobSettingsFields, IJobTask, IJobTaskDraft } from './JobSettingsTypes';
import { DEFAULT_JOB_SETTINGS_FIELDS, EMPTY_JOB_SETTINGS, isOwnedBy } from './JobSettingsTypes';

type JobSettingsServices = Pick<
  IOnboardingTrackerProps,
  'listService' | 'taskGroupsService' | 'jobGroupsService' | 'jobsService' | 'tasksForJobsService'
>;

export interface IJobSettings {
  data: IJobSettingsData;
  loading: boolean;
  error: string;
  reload: () => Promise<void>;
  saveTitle: (kind: 'group' | 'job', id: number | undefined, title: string, groupId?: number) => Promise<void>;
  deleteEntry: (kind: 'group' | 'job', id: number) => Promise<void>;
  setJobGroup: (jobId: number, groupId: number | undefined) => Promise<void>;
  saveJobTask: (owner: IJobOwner, draft: IJobTaskDraft, existing: IJobTask | undefined) => Promise<void>;
  removeJobTask: (owner: IJobOwner, task: IJobTask) => Promise<void>;
  reorderJobTasks: (owner: IJobOwner, sourceId: number, targetId: number) => Promise<void>;
}

const byOrderThenId = (a: { order: number; id: number }, b: { order: number; id: number }): number =>
  a.order - b.order || a.id - b.id;

export function useJobSettings(services: JobSettingsServices): IJobSettings {
  const { listService, taskGroupsService, jobGroupsService, jobsService, tasksForJobsService } = services;
  const [data, setData] = React.useState<IJobSettingsData>(EMPTY_JOB_SETTINGS);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const fieldsRef = React.useRef<IJobSettingsFields>(DEFAULT_JOB_SETTINGS_FIELDS);

  const fetchData = React.useCallback(async (): Promise<IJobSettingsData> => {
    const [
      jobGroupItems, jobItems, jobFields, linkFields, linkItems,
      taskItems, taskFields, taskGroupItems, taskGroupFields
    ] = await Promise.all([
      jobGroupsService.getItems(),
      jobsService.getItems(),
      jobsService.getFields(),
      tasksForJobsService.getFields(),
      tasksForJobsService.getItems(),
      listService.getItems(),
      listService.getFields(),
      taskGroupsService.getItems(),
      taskGroupsService.getFields()
    ]);

    const fields: IJobSettingsFields = {
      jobGroupOnJob: findLookupField(jobFields, ['JobGroupID', 'JobGroup'], DEFAULT_JOB_SETTINGS_FIELDS.jobGroupOnJob),
      taskId: findLookupField(linkFields, ['TaskID', 'Task'], DEFAULT_JOB_SETTINGS_FIELDS.taskId),
      jobGroupId: findLookupField(linkFields, ['JobGroupID', 'JobGroup'], DEFAULT_JOB_SETTINGS_FIELDS.jobGroupId),
      jobId: findLookupField(linkFields, ['JobID', 'Job'], DEFAULT_JOB_SETTINGS_FIELDS.jobId),
      otherTaskId: findLookupField(linkFields, ['OtherActionID', 'OtherAction', 'OtherTaskID', 'OtherTask'], ''),
      taskOrder: findFieldName(linkFields, ['TaskOrder'], DEFAULT_JOB_SETTINGS_FIELDS.taskOrder),
      bodyText: findFieldName(linkFields, ['TaskBodyText'], ''),
      hasNewEmployeeInfo: findFieldName(linkFields, ['HasNewEmployeeInfo'], '')
    };
    fieldsRef.current = fields;

    const taskGroupLookup = findLookupField(taskFields, ['TaskGroupID', 'TaskGroup'], 'TaskGroupID');
    const taskOrderField = findFieldName(taskFields, ['TaskOrderInTheGroup'], 'TaskOrderInTheGroup');
    const taskGroupOrderField = findFieldName(taskGroupFields, ['Order'], 'Order');
    const taskGroups = taskGroupItems.map(item => ({
      id: numberValue(item.Id),
      title: textValue(item.Title),
      order: numberValue(readValue(item, [taskGroupOrderField, 'Order']))
    }));
    const taskGroupById = (id: number | undefined): { title: string; order: number } | undefined =>
      taskGroups.filter(group => group.id === id)[0];

    // default order: by task group order, then by order inside the group
    const catalog = taskItems
      .map(item => {
        const group = taskGroupById(readLookupId(item, taskGroupLookup, ['TaskGroupID', 'TaskGroup']));
        return {
          id: numberValue(item.Id),
          title: textValue(item.Title),
          taskGroupTitle: group ? group.title : '',
          defaultBodyText: textValue(item.TaskDefaultBodyText),
          order: (group ? group.order : 0) * 1000 + numberValue(readValue(item, [taskOrderField, 'TaskOrderInTheGroup']))
        };
      })
      .sort(byOrderThenId)
      .map(({ id, title, taskGroupTitle, defaultBodyText }) => ({ id, title, taskGroupTitle, defaultBodyText }));

    return {
      groups: jobGroupItems.map(item => ({ id: numberValue(item.Id), title: textValue(item.Title) })),
      jobs: jobItems.map(item => ({
        id: numberValue(item.Id),
        title: textValue(item.Title),
        jobGroupId: readLookupId(item, fields.jobGroupOnJob, ['JobGroupID', 'JobGroup'])
      })),
      catalog,
      jobTasks: linkItems
        .map(item => ({
          id: numberValue(item.Id),
          taskId: readLookupId(item, fields.taskId, ['TaskID', 'Task']) || 0,
          jobGroupId: readLookupId(item, fields.jobGroupId, ['JobGroupID', 'JobGroup']),
          jobId: readLookupId(item, fields.jobId, ['JobID', 'Job']),
          order: numberValue(readValue(item, [fields.taskOrder, 'TaskOrder'])),
          bodyText: textValue(readValue(item, [fields.bodyText, 'TaskBodyText'])),
          hasNewEmployeeInfo: booleanValue(readValue(item, [fields.hasNewEmployeeInfo, 'HasNewEmployeeInfo'])),
          otherTaskId: readLookupId(item, fields.otherTaskId || 'OtherActionID', ['OtherActionID', 'OtherAction', 'OtherTaskID', 'OtherTask'])
        }))
        .sort(byOrderThenId)
    };
  }, [listService, taskGroupsService, jobGroupsService, jobsService, tasksForJobsService]);

  const reload = React.useCallback(async (): Promise<void> => {
    setLoading(true);
    setError('');
    try {
      setData(await fetchData());
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [fetchData]);

  React.useEffect(() => {
    reload().catch(() => undefined);
  }, [reload]);

  // Runs a change, then always reloads. Failures are shown on the page and re-thrown so dialogs can show them too.
  const mutate = async (action: () => Promise<void>): Promise<void> => {
    setLoading(true);
    setError('');
    let failure: Error | undefined;
    try {
      await action();
    } catch (e) {
      failure = e as Error;
    }
    try {
      setData(await fetchData());
    } catch (e) {
      const reloadError = e as Error;
      failure = failure ? new Error(`${failure.message}\n${reloadError.message}`) : reloadError;
    }
    setLoading(false);
    setError(failure ? failure.message : '');
    if (failure) {
      throw failure;
    }
  };

  const ownerField = (owner: IJobOwner): string =>
    owner.kind === 'group' ? fieldsRef.current.jobGroupId : fieldsRef.current.jobId;

  // A new job / job group starts with every task in the Tasks list.
  const seedTasks = async (owner: IJobOwner, catalogIds: number[]): Promise<void> => {
    const fields = fieldsRef.current;
    for (let index = 0; index < catalogIds.length; index++) {
      const payload: ListItem = {
        [fields.taskId]: catalogIds[index],
        [ownerField(owner)]: owner.id,
        [fields.taskOrder]: index + 1
      };
      if (fields.hasNewEmployeeInfo) {
        payload[fields.hasNewEmployeeInfo] = false;
      }
      await tasksForJobsService.createItem(payload);
    }
  };

  const saveTitle: IJobSettings['saveTitle'] = (kind, id, title, groupId) => mutate(async () => {
    const service = kind === 'group' ? jobGroupsService : jobsService;
    if (id !== undefined) {
      await service.updateItem(id, { Title: title });
      return;
    }
    const fields: ListItem = { Title: title };
    if (kind === 'job' && groupId !== undefined) {
      fields[fieldsRef.current.jobGroupOnJob] = groupId;
    }
    const newId = await service.createItemWithId(fields);
    // a job in a job group follows the group's tasks, so only groups and group-less jobs get their own
    if (kind === 'group' || groupId === undefined) {
      await seedTasks({ kind, id: newId }, data.catalog.map(task => task.id));
    }
  });

  const deleteEntry: IJobSettings['deleteEntry'] = (kind, id) => mutate(async () => {
    if (kind === 'group' && data.jobs.some(job => job.jobGroupId === id)) {
      throw new Error('Энэ job group-д ажлын байр хамаарч байна. Эхлээд ажлын байрыг бүлгээс хасна уу.');
    }
    const own = data.jobTasks.filter(task => (kind === 'group' ? task.jobGroupId : task.jobId) === id);
    for (const task of own) {
      await tasksForJobsService.deleteItem(task.id);
    }
    await (kind === 'group' ? jobGroupsService : jobsService).deleteItem(id);
  });

  // A job in a job group follows the group's tasks, so its own task rows are erased.
  // A job leaving its group gets the default task list again.
  const setJobGroup: IJobSettings['setJobGroup'] = (jobId, groupId) => mutate(async () => {
    await jobsService.updateItem(jobId, { [fieldsRef.current.jobGroupOnJob]: groupId === undefined ? null : groupId });
    const own = data.jobTasks.filter(task => task.jobId === jobId);
    if (groupId !== undefined) {
      for (const task of own) {
        await tasksForJobsService.deleteItem(task.id);
      }
    } else if (own.length === 0) {
      await seedTasks({ kind: 'job', id: jobId }, data.catalog.map(task => task.id));
    }
  });

  const renumber = async (tasks: IJobTask[]): Promise<void> => {
    const orderField = fieldsRef.current.taskOrder;
    for (let index = 0; index < tasks.length; index++) {
      if (tasks[index].order !== index + 1) {
        await tasksForJobsService.updateItem(tasks[index].id, { [orderField]: index + 1 });
      }
    }
  };

  const ownerTasks = (owner: IJobOwner): IJobTask[] =>
    data.jobTasks.filter(task => isOwnedBy(task, owner)).sort(byOrderThenId);

  const saveJobTask: IJobSettings['saveJobTask'] = (owner, draft, existing) => mutate(async () => {
    const fields = fieldsRef.current;
    const payload: ListItem = {};
    // optional columns are only written when they exist in the list
    if (fields.bodyText) {
      payload[fields.bodyText] = draft.bodyText;
    }
    if (fields.hasNewEmployeeInfo) {
      payload[fields.hasNewEmployeeInfo] = draft.hasNewEmployeeInfo;
    }
    if (fields.otherTaskId) {
      payload[fields.otherTaskId] = draft.otherTaskId === undefined ? null : draft.otherTaskId;
    } else if (draft.otherTaskId !== undefined) {
      throw new Error('"TasksForJobs" жагсаалтад OtherActionID багана олдсонгүй. Эхлээд тухайн баганыг үүсгэнэ үү.');
    }
    if (existing) {
      await tasksForJobsService.updateItem(existing.id, payload);
      return;
    }
    payload[fields.taskId] = draft.taskId;
    payload[ownerField(owner)] = owner.id;
    payload[fields.taskOrder] = ownerTasks(owner).reduce((max, task) => Math.max(max, task.order), 0) + 1;
    await tasksForJobsService.createItem(payload);
  });

  const removeJobTask: IJobSettings['removeJobTask'] = (owner, task) => mutate(async () => {
    await tasksForJobsService.deleteItem(task.id);
    await renumber(ownerTasks(owner).filter(item => item.id !== task.id));
  });

  const reorderJobTasks: IJobSettings['reorderJobTasks'] = (owner, sourceId, targetId) => mutate(async () => {
    const tasks = ownerTasks(owner);
    const from = tasks.findIndex(task => task.id === sourceId);
    const to = tasks.findIndex(task => task.id === targetId);
    if (from < 0 || to < 0) {
      return;
    }
    const [moved] = tasks.splice(from, 1);
    tasks.splice(to, 0, moved);
    await renumber(tasks);
  });

  return { data, loading, error, reload, saveTitle, deleteEntry, setJobGroup, saveJobTask, removeJobTask, reorderJobTasks };
}
