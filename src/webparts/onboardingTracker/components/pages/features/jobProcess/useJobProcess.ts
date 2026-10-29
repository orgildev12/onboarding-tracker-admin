import * as React from 'react';
import type { IOnboardingTrackerProps } from '../../../IOnboardingTrackerProps';
import {
  booleanValue,
  findFieldName,
  findLookupField,
  numberValue,
  readLookupId,
  readValue,
  textValue
} from '../../../../utils/listFields';
import type { IJobProcessData } from './JobProcessTypes';
import { EMPTY_JOB_PROCESS } from './JobProcessTypes';

export type JobProcessServices = Pick<
  IOnboardingTrackerProps,
  'listService' | 'taskGroupsService' | 'taskOwnerRolesService' | 'jobGroupsService' | 'jobsService' |
  'tasksForJobsService' | 'departmentsService'
>;

export interface IJobProcess {
  data: IJobProcessData;
  loading: boolean;
  error: string;
}

async function fetchJobProcess(services: JobProcessServices): Promise<IJobProcessData> {
  const {
    listService, taskGroupsService, taskOwnerRolesService, jobGroupsService, jobsService, tasksForJobsService, departmentsService
  } = services;
  const [
    jobGroupItems, jobItems, jobFields, linkFields, linkItems, taskItems, taskFields,
    taskGroupItems, taskGroupFields, roleItems, departmentItems, departmentFields
  ] = await Promise.all([
    jobGroupsService.getAllItems(),
    jobsService.getAllItems(),
    jobsService.getFields(),
    tasksForJobsService.getFields(),
    tasksForJobsService.getAllItems(),
    listService.getAllItems(),
    listService.getFields(),
    taskGroupsService.getAllItems(),
    taskGroupsService.getFields(),
    taskOwnerRolesService.getAllItems(),
    departmentsService.getAllItems(),
    departmentsService.getFields()
  ]);

  const jobGroupOnJob = findLookupField(jobFields, ['JobGroupID', 'JobGroup'], 'JobGroupID');
  const jobDepartment = findLookupField(jobFields, ['DepartmentID', 'Department'], 'DepartmentID');
  const linkTask = findLookupField(linkFields, ['TaskID', 'Task'], 'TaskID');
  const linkJobGroup = findLookupField(linkFields, ['JobGroupID', 'JobGroup'], 'JobGroupID');
  const linkJob = findLookupField(linkFields, ['JobID', 'Job'], 'JobID');
  const linkOrder = findFieldName(linkFields, ['TaskOrder'], 'TaskOrder');
  const linkBody = findFieldName(linkFields, ['TaskBodyText'], 'TaskBodyText');
  const taskGroupLookup = findLookupField(taskFields, ['TaskGroupID', 'TaskGroup'], 'TaskGroupID');
  const taskRoleLookup = findLookupField(taskFields, ['TaskOwnerRoleID', 'TaskOwnerRole'], 'TaskOwnerRoleID');
  const triggerTaskLookup = findLookupField(taskFields, ['TriggerTaskID', 'TriggerTask'], 'TriggerTaskID');
  const taskGroupOrder = findFieldName(taskGroupFields, ['Order'], 'Order');
  const isGazarField = findFieldName(departmentFields, ['IsGazar'], 'IsGazar');
  const gazarLookup = findLookupField(departmentFields, ['GazarID', 'Gazar'], 'GazarID');

  const roleTitles = new Map<number, string>(roleItems.map(item => [numberValue(item.Id), textValue(item.Title)]));

  return {
    groups: jobGroupItems.map(item => ({ id: numberValue(item.Id), title: textValue(item.Title) })),
    jobs: jobItems.map(item => ({
      id: numberValue(item.Id),
      title: textValue(item.Title),
      jobGroupId: readLookupId(item, jobGroupOnJob, ['JobGroupID', 'JobGroup']),
      departmentId: readLookupId(item, jobDepartment, ['DepartmentID', 'Department'])
    })),
    departments: departmentItems.map(item => ({
      id: numberValue(item.Id),
      title: textValue(item.Title),
      isGazar: booleanValue(readValue(item, [isGazarField, 'IsGazar'])),
      gazarId: readLookupId(item, gazarLookup, ['GazarID', 'Gazar'])
    })),
    taskGroups: taskGroupItems.map(item => ({
      id: numberValue(item.Id),
      title: textValue(item.Title),
      order: numberValue(readValue(item, [taskGroupOrder, 'Order']))
    })),
    catalog: taskItems.map(item => {
      const roleId = readLookupId(item, taskRoleLookup, ['TaskOwnerRoleID', 'TaskOwnerRole']);
      return {
        id: numberValue(item.Id),
        title: textValue(item.Title),
        taskGroupId: readLookupId(item, taskGroupLookup, ['TaskGroupID', 'TaskGroup']) || 0,
        roleTitle: roleId === undefined ? '' : roleTitles.get(roleId) || '',
        defaultBodyText: textValue(item.TaskDefaultBodyText),
        triggerType: textValue(item.TriggerType),
        triggerTaskId: readLookupId(item, triggerTaskLookup, ['TriggerTaskID', 'TriggerTask']),
        dayShouldBegin: textValue(item.DayShouldBegin),
        dayShouldEnd: textValue(item.DayShouldEnd),
        dayShouldTake: textValue(item.DayShouldTake)
      };
    }),
    links: linkItems.map(item => ({
      id: numberValue(item.Id),
      taskId: readLookupId(item, linkTask, ['TaskID', 'Task']) || 0,
      jobGroupId: readLookupId(item, linkJobGroup, ['JobGroupID', 'JobGroup']),
      jobId: readLookupId(item, linkJob, ['JobID', 'Job']),
      order: numberValue(readValue(item, [linkOrder, 'TaskOrder'])),
      bodyText: textValue(readValue(item, [linkBody, 'TaskBodyText']))
    }))
  };
}

// Read-only counterpart of useJobSettings.
export function useJobProcess(services: JobProcessServices): IJobProcess {
  const {
    listService, taskGroupsService, taskOwnerRolesService, jobGroupsService, jobsService, tasksForJobsService, departmentsService
  } = services;
  const [data, setData] = React.useState<IJobProcessData>(EMPTY_JOB_PROCESS);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    fetchJobProcess({
      listService, taskGroupsService, taskOwnerRolesService, jobGroupsService, jobsService, tasksForJobsService, departmentsService
    })
      .then(result => {
        if (!cancelled) {
          setData(result);
        }
      })
      .catch((e: Error) => {
        if (!cancelled) {
          setError(e.message);
        }
      })
      .then(() => {
        if (!cancelled) {
          setLoading(false);
        }
      }, () => undefined);
    return () => {
      cancelled = true;
    };
  }, [listService, taskGroupsService, taskOwnerRolesService, jobGroupsService, jobsService, tasksForJobsService, departmentsService]);

  return { data, loading, error };
}
