import * as React from 'react';
import type { IOnboardingTrackerProps } from '../../../IOnboardingTrackerProps';
import type { IEmployee, IProcessStep, ProcessStatus, StepStatus } from '../../../../models/Employee';
import type { IProcessPerson, IProcessTask, IProcessTaskTiming, TaskResultKind, TaskStatus } from '../../../../models/OnboardingProcess';
import type { IListField, ListItem } from '../../../../services/ListService';
import {
  booleanValue,
  dateOnly,
  findFieldName,
  findLookupField,
  numberValue,
  readLookupId,
  readValue,
  textValue
} from '../../../../utils/listFields';
import { TASK_RESULT_TABLE_BY_TYPE } from '../test/TaskAdminTypes';

export type OnboardingServices = Pick<
  IOnboardingTrackerProps,
  | 'newEmployeesService'
  | 'jobsService'
  | 'tasksForJobsService'
  | 'listService'
  | 'taskGroupsService'
  | 'taskOwnerRolesService'
  | 'taskGroupProcessService'
  | 'taskResultsStatusFieldsService'
  | 'roleOwnersService'
>

export interface IOnboardingData {
  steps: IProcessStep[];
  employees: IEmployee[];
  // employee id -> step key -> tasks
  tasksByEmployee: Record<number, Record<string, IProcessTask[]>>;
}

export interface IOnboardingState {
  data: IOnboardingData;
  loading: boolean;
  error: string;
}

const EMPTY_DATA: IOnboardingData = { steps: [], employees: [], tasksByEmployee: {} };

// Values stored in the Status columns of TaskGroupProcess and TaskResultsStatusFields.
const STEP_STATUS_BY_TEXT: Record<string, StepStatus> = {
  'Хугацаандаа дууссан': 'completedOnTime',
  'Хоцорч дууссан': 'completedLate',
  'Хэвийн үргэлжилж буй': 'inProgress',
  'Хоцорч буй': 'delayed',
  'Эхлээгүй': 'notStarted'
};

const TASK_STATUS_BY_TEXT: Record<string, TaskStatus> = {
  'Эхлээгүй': 'notStarted',
  'Эхлэсэн': 'started',
  'Хоцорч буй': 'delayed',
  'Дууссан': 'completed',
  'Хоцорч дууссан': 'completedLate'
};

const RESULT_KIND_BY_TYPE: Record<string, TaskResultKind> = {
  Check: 'none',
  Date: 'date',
  MultipleImages: 'multipleImages',
  SingleImageWithStatus: 'singleImageWithStatus',
  Forms: 'forms'
};

const byOrderThenId = (a: { order: number; id: number }, b: { order: number; id: number }): number =>
  a.order - b.order || a.id - b.id;

// Expanded Person column: { Id, Title, EMail }
function personValue(value: unknown): IProcessPerson | undefined {
  if (value && typeof value === 'object' && 'Title' in value) {
    const person = value as { Title?: string; EMail?: string };
    return person.Title ? { name: person.Title, email: person.EMail || '' } : undefined;
  }
  return undefined;
}

const displayDate = (value: unknown): string => dateOnly(value).replace(/-/g, '.');

// Calendar day in the browser's time zone; SharePoint returns UTC timestamps.
function localDay(value: unknown): Date | undefined {
  const text = textValue(value);
  const date = text ? new Date(text) : undefined;
  return date && !isNaN(date.getTime()) ? new Date(date.getFullYear(), date.getMonth(), date.getDate()) : undefined;
}

const twoDigits = (value: number): string => (value < 10 ? `0${value}` : String(value));

const formatDay = (day: Date | undefined): string =>
  day ? `${day.getFullYear()}.${twoDigits(day.getMonth() + 1)}.${twoDigits(day.getDate())}` : '';

const daysBetween = (from: Date, to: Date): number => Math.round((to.getTime() - from.getTime()) / 86400000);

function buildTiming(row: IStatusRow, status: TaskStatus): IProcessTaskTiming {
  const range = (from: Date | undefined, to: Date | undefined, open: string): string =>
    from ? `${formatDay(from)} → ${to ? formatDay(to) : open}` : '—';
  const today = localDay(new Date().toISOString()) as Date;
  let delayDays = 0;
  if (row.shouldEnd) {
    if (status === 'completedLate' && row.ended) {
      delayDays = daysBetween(row.shouldEnd, row.ended);
    } else if (status === 'delayed') {
      delayDays = daysBetween(row.shouldEnd, today);
    }
  }
  return {
    planned: range(row.shouldBegin, row.shouldEnd, '…'),
    actual: range(row.began, row.ended, '…'),
    delayDays: status === 'delayed' || status === 'completedLate' ? Math.max(1, delayDays) : 0,
    delayReason: row.delayReason
  };
}

interface ITaskInfo {
  id: number;
  title: string;
  triggerTaskId: number | undefined;
  groupId: number;
  orderInGroup: number;
  roleId: number | undefined;
  type: string;
  tableName: string;
}

interface IStatusRow {
  id: number;
  taskId: number;
  employeeId: number;
  ownerId: number;
  owner: IProcessPerson | undefined;
  isDone: boolean;
  status: string;
  viable: boolean;
  shouldBegin: Date | undefined;
  shouldEnd: Date | undefined;
  began: Date | undefined;
  ended: Date | undefined;
  delayReason: string;
}

async function loadOnboardingData(
  services: OnboardingServices,
  employeeId: number | undefined,
  isHistory: boolean | undefined
): Promise<IOnboardingData> {
  const {
    newEmployeesService, jobsService, tasksForJobsService, listService, taskGroupsService,
    taskOwnerRolesService, taskGroupProcessService, taskResultsStatusFieldsService, roleOwnersService
  } = services;

  const [
    employeeFields, employeeItems, jobItems, jobFields, linkItems, linkFields, taskItems, taskFields,
    groupItems, groupFields, roleItems, processFields, statusFields, users, roleOwnerFields
  ] = await Promise.all([
    newEmployeesService.getFields(),
    employeeId === undefined ? newEmployeesService.getAllItems() : newEmployeesService.getItems(1, `Id eq ${employeeId}`),
    jobsService.getItems(),
    jobsService.getFields(),
    tasksForJobsService.getAllItems(),
    tasksForJobsService.getFields(),
    listService.getAllItems(),
    listService.getFields(),
    taskGroupsService.getItems(),
    taskGroupsService.getFields(),
    taskOwnerRolesService.getItems(),
    taskGroupProcessService.getFields(),
    taskResultsStatusFieldsService.getFields(),
    newEmployeesService.getSiteUsers(),
    roleOwnersService.getFields()
  ]);

  const processEmployeeField = findLookupField(processFields, ['NewEmployeeID', 'NewEmployee'], 'NewEmployeeId');
  const statusEmployeeField = findLookupField(statusFields, ['NewEmployeeID', 'NewEmployee'], 'NewEmployeeId');
  const statusOwnerName = findFieldName(statusFields, ['TaskOwnerEmployee'], 'TaskOwnerEmployee');
  const roleOwnerName = findFieldName(roleOwnerFields, ['Employee', 'RoleOwner', 'Owner'], 'Employee');
  const isPerson = (fields: IListField[], name: string): boolean =>
    fields.some(field => field.InternalName === name && field.TypeAsString.indexOf('User') === 0);
  // Employees to show. IsHistory is compared here (not in the query) so rows where it was never set count as "no".
  const historyField = findFieldName(employeeFields, ['IsHistory'], 'IsHistory');
  const visibleItems = employeeId === undefined && isHistory !== undefined
    ? employeeItems.filter(item => booleanValue(readValue(item, [historyField])) === isHistory)
    : employeeItems;
  const visibleIds = visibleItems.map(item => numberValue(item.Id));
  const statusPersons = isPerson(statusFields, statusOwnerName) ? [statusOwnerName] : [];

  // Status/process rows grow by ~50 per employee, so never read them for "everyone" with a single $top:
  // - one employee: filter on that employee;
  // - active employees (home page): one indexed query per visible employee;
  // - history (or no filter): read every page of the list.
  const loadPerEmployee = (service: OnboardingServices['taskGroupProcessService'], field: string, persons: string[] = []): Promise<ListItem[]> =>
    employeeId !== undefined
      ? service.getAllItems(`${field} eq ${employeeId}`, persons)
      : isHistory === false
        ? service.getItemsForIds(field, visibleIds, persons)
        : service.getAllItems(undefined, persons);

  const [processItems, statusItems, roleOwnerItems] = await Promise.all([
    loadPerEmployee(taskGroupProcessService, processEmployeeField),
    loadPerEmployee(taskResultsStatusFieldsService, statusEmployeeField, statusPersons),
    roleOwnersService.getItems(5000, undefined, isPerson(roleOwnerFields, roleOwnerName) ? [roleOwnerName] : [])
  ]);

  const groupOrderField = findFieldName(groupFields, ['Order'], 'Order');
  const groups = groupItems
    .map(item => ({
      id: numberValue(item.Id),
      title: textValue(item.Title),
      order: numberValue(readValue(item, [groupOrderField, 'Order']))
    }))
    .sort(byOrderThenId);
  const steps: IProcessStep[] = groups.map(group => ({ key: String(group.id), title: group.title }));

  const taskGroupField = findLookupField(taskFields, ['TaskGroupID', 'TaskGroup'], 'TaskGroupId');
  const ownerRoleField = findLookupField(taskFields, ['TaskOwnerRoleID', 'TaskOwnerRole'], 'TaskOwnerRoleId');
  const taskOrderField = findFieldName(taskFields, ['TaskOrderInTheGroup'], 'TaskOrderInTheGroup');
  const triggerTaskField = findLookupField(taskFields, ['TriggerTaskID', 'TriggerTask'], 'TriggerTaskId');
  const taskInfo = new Map<number, ITaskInfo>();
  taskItems.forEach(item => {
    const id = numberValue(item.Id);
    const type = textValue(item.TaskType);
    taskInfo.set(id, {
      id,
      title: textValue(item.Title),
      triggerTaskId: textValue(item.TriggerType) === 'ByOtherTask'
        ? readLookupId(item, triggerTaskField, ['TriggerTaskID', 'TriggerTask'])
        : undefined,
      groupId: readLookupId(item, taskGroupField, ['TaskGroupID', 'TaskGroup']) || 0,
      orderInGroup: numberValue(readValue(item, [taskOrderField, 'TaskOrderInTheGroup'])),
      roleId: readLookupId(item, ownerRoleField, ['TaskOwnerRoleID', 'TaskOwnerRole']),
      type,
      tableName: textValue(item.TaskFieldTableName) || TASK_RESULT_TABLE_BY_TYPE[type] || ''
    });
  });

  const roleTitles = new Map<number, string>(roleItems.map(item => [numberValue(item.Id), textValue(item.Title)]));
  const userTitles = new Map<number, string>(users.map(user => [user.Id, user.Title]));
  const roleOwnerLookup = findLookupField(roleOwnerFields, ['TaskOwnerRoleID', 'TaskOwnerRole'], 'TaskOwnerRoleId');
  const ownersByRole = new Map<number, IProcessPerson[]>();
  roleOwnerItems.forEach(item => {
    const roleId = readLookupId(item, roleOwnerLookup, ['TaskOwnerRoleID', 'TaskOwnerRole']);
    const person = personValue(readValue(item, [roleOwnerName]));
    if (roleId && person) {
      ownersByRole.set(roleId, [...(ownersByRole.get(roleId) || []), person]);
    }
  });

  // Task order comes from TasksForJobs: the job's own rows, otherwise its job group's rows.
  const jobGroupOnJob = findLookupField(jobFields, ['JobGroupID', 'JobGroup'], 'JobGroupId');
  const jobs = new Map(jobItems.map(item => [
    numberValue(item.Id),
    { title: textValue(item.Title), jobGroupId: readLookupId(item, jobGroupOnJob, ['JobGroupID', 'JobGroup']) }
  ]));
  const linkTaskField = findLookupField(linkFields, ['TaskID', 'Task'], 'TaskId');
  const linkJobGroupField = findLookupField(linkFields, ['JobGroupID', 'JobGroup'], 'JobGroupId');
  const linkJobField = findLookupField(linkFields, ['JobID', 'Job'], 'JobId');
  const linkOrderField = findFieldName(linkFields, ['TaskOrder'], 'TaskOrder');
  const links = linkItems.map(item => ({
    taskId: readLookupId(item, linkTaskField, ['TaskID', 'Task']) || 0,
    jobGroupId: readLookupId(item, linkJobGroupField, ['JobGroupID', 'JobGroup']),
    jobId: readLookupId(item, linkJobField, ['JobID', 'Job']),
    order: numberValue(readValue(item, [linkOrderField, 'TaskOrder']))
  }));
  const tasksForJob = (jobId: number | undefined): number[] => {
    let rows = links.filter(link => jobId !== undefined && link.jobId === jobId);
    if (rows.length === 0) {
      const jobGroupId = jobId === undefined ? undefined : jobs.get(jobId)?.jobGroupId;
      rows = links.filter(link => jobGroupId !== undefined && link.jobGroupId === jobGroupId);
    }
    const seen = new Set<number>();
    return rows
      .sort((a, b) => a.order - b.order || a.taskId - b.taskId)
      .filter(link => {
        if (!link.taskId || seen.has(link.taskId)) {
          return false;
        }
        seen.add(link.taskId);
        return true;
      })
      .map(link => link.taskId);
  };

  const statusTaskField = findLookupField(statusFields, ['TaskID', 'Task'], 'TaskId');
  const statusOwnerField = `${statusOwnerName}Id`;
  const statusIsDoneField = findFieldName(statusFields, ['IsDone'], 'IsDone');
  const statusStatusField = findFieldName(statusFields, ['Status'], 'Status');
  const statusViableField = findFieldName(statusFields, ['IsViableAction'], 'IsViableAction');
  const statusDateField = (name: string): string => findFieldName(statusFields, [name], name);
  const statusReasonField = findFieldName(statusFields, ['DelayReason', 'ReasonForDelay', 'Reason', 'Cause'], '');
  const statusRowsByEmployee = new Map<number, IStatusRow[]>();
  statusItems.forEach(item => {
    const ownerId = numberValue(readValue(item, [statusOwnerField]), 0);
    const row: IStatusRow = {
      id: numberValue(item.Id),
      taskId: readLookupId(item, statusTaskField, ['TaskID', 'Task']) || 0,
      employeeId: readLookupId(item, statusEmployeeField, ['NewEmployeeID', 'NewEmployee']) || 0,
      ownerId,
      owner: personValue(readValue(item, [statusOwnerName])) ||
        (userTitles.has(ownerId) ? { name: userTitles.get(ownerId) || '', email: '' } : undefined),
      isDone: booleanValue(readValue(item, [statusIsDoneField])),
      status: textValue(readValue(item, [statusStatusField])).trim(),
      // IsViableAction defaults to true; only an explicit false hides the task
      viable: readValue(item, [statusViableField, 'IsViableAction']) !== false,
      shouldBegin: localDay(readValue(item, [statusDateField('DateShouldBegin')])),
      shouldEnd: localDay(readValue(item, [statusDateField('DateShouldEnd')])),
      began: localDay(readValue(item, [statusDateField('DateBegan')])),
      ended: localDay(readValue(item, [statusDateField('DateEnded')])),
      delayReason: statusReasonField ? textValue(readValue(item, [statusReasonField])).trim() : ''
    };
    if (row.employeeId) {
      statusRowsByEmployee.set(row.employeeId, [...(statusRowsByEmployee.get(row.employeeId) || []), row]);
    }
  });

  const processGroupField = findLookupField(processFields, ['TaskGroupID', 'TaskGroup'], 'TaskGroupId');
  const processStatusField = findFieldName(processFields, ['Status'], 'Status');
  const processBeganField = findFieldName(processFields, ['DateBegan'], 'DateBegan');
  const processEndedField = findFieldName(processFields, ['DateEnded'], 'DateEnded');
  const processByEmployee = new Map<number, Map<number, { status: StepStatus; period: string }>>();
  processItems.forEach(item => {
    const employee = readLookupId(item, processEmployeeField, ['NewEmployeeID', 'NewEmployee']);
    const group = readLookupId(item, processGroupField, ['TaskGroupID', 'TaskGroup']);
    if (!employee || !group) {
      return;
    }
    const began = displayDate(readValue(item, [processBeganField, 'DateBegan']));
    const ended = displayDate(readValue(item, [processEndedField, 'DateEnded']));
    const process = processByEmployee.get(employee) || new Map();
    process.set(group, {
      status: STEP_STATUS_BY_TEXT[textValue(readValue(item, [processStatusField, 'Status'])).trim()] || 'notStarted',
      period: began ? `${began} → ${ended || '…'}` : ''
    });
    processByEmployee.set(employee, process);
  });

  const employeeNameFields = {
    firstName: findFieldName(employeeFields, ['FirstName'], 'FirstName'),
    lastName: findFieldName(employeeFields, ['LastName'], 'LastName'),
    probationStart: findFieldName(employeeFields, ['ProbationStartDate'], 'ProbationStartDate'),
    probationEnd: findFieldName(employeeFields, ['ProbationEndDate'], 'ProbationEndDate'),
    job: findLookupField(employeeFields, ['JobID', 'Job'], 'JobId'),
    isHistory: findFieldName(employeeFields, ['IsHistory'], 'IsHistory'),
    hasPassed: findFieldName(employeeFields, ['HasPassed', 'IsPassed'], 'HasPassed')
  };

  const tasksByEmployee: IOnboardingData['tasksByEmployee'] = {};
  const employees: IEmployee[] = visibleItems.map(item => {
    const id = numberValue(item.Id);
    const jobId = readLookupId(item, employeeNameFields.job, ['JobID', 'Job']);
    const rows = statusRowsByEmployee.get(id) || [];
    const viableRows = rows.filter(row => row.viable);
    const rowByTask = new Map<number, IStatusRow>();
    viableRows.forEach(row => {
      const existing = rowByTask.get(row.taskId);
      if (!existing || row.id > existing.id) {
        rowByTask.set(row.taskId, row);
      }
    });
    const nonViableTasks = new Set(rows.filter(row => !row.viable).map(row => row.taskId));
    const assignedTaskIds = tasksForJob(jobId);
    const taskIds = (assignedTaskIds.length > 0
      ? assignedTaskIds
      : Array.from(rowByTask.keys()).sort((a, b) =>
        (taskInfo.get(a)?.orderInGroup ?? 0) - (taskInfo.get(b)?.orderInGroup ?? 0) || a - b))
      .filter(taskId => taskInfo.has(taskId) && (!nonViableTasks.has(taskId) || rowByTask.has(taskId)));

    const tasksByStep: Record<string, IProcessTask[]> = {};
    const groupsWithTasks = new Set<number>();
    taskIds.forEach(taskId => {
      const info = taskInfo.get(taskId);
      if (!info) {
        return;
      }
      const row = rowByTask.get(taskId);
      const status = row ? TASK_STATUS_BY_TEXT[row.status] || (row.isDone ? 'completed' : 'notStarted') : 'notStarted';
      const key = String(info.groupId);
      groupsWithTasks.add(info.groupId);
      tasksByStep[key] = [
        ...(tasksByStep[key] || []),
        {
          id: row ? String(row.id) : `${id}-${taskId}`,
          taskId: info.id,
          employeeId: id,
          title: info.title,
          triggerTaskId: info.triggerTaskId,
          assignees: row && row.owner ? [row.owner] : info.roleId ? ownersByRole.get(info.roleId) || [] : [],
          role: info.roleId ? roleTitles.get(info.roleId) || '' : '',
          status,
          completed: !!row && (row.isDone || status === 'completed' || status === 'completedLate'),
          resultKind: RESULT_KIND_BY_TYPE[info.type] || 'none',
          resultTable: info.tableName,
          timing: row
            ? buildTiming(row, status)
            : { planned: '—', actual: '—', delayDays: 0, delayReason: '' }
        }
      ];
    });
    tasksByEmployee[id] = tasksByStep;

    const process = processByEmployee.get(id);
    const stepStatuses = groups.map<StepStatus>(group => {
      const entry = process?.get(group.id);
      if (entry) {
        return entry.status;
      }
      return groupsWithTasks.has(group.id) ? 'notStarted' : 'noProcess';
    });
    const tasks = Object.keys(tasksByStep).reduce<IProcessTask[]>((all, key) => all.concat(tasksByStep[key]), []);
    const done = tasks.filter(task => task.completed).length;
    const isDelayed = stepStatuses.indexOf('delayed') !== -1 || tasks.some(task => task.status === 'delayed');
    const job = jobId === undefined ? undefined : jobs.get(jobId);
    const processStatus: ProcessStatus = isDelayed ? 'delayed' : 'normal';

    return {
      id,
      lastName: textValue(readValue(item, [employeeNameFields.lastName])),
      firstName: textValue(readValue(item, [employeeNameFields.firstName])),
      position: job ? job.title : '',
      status: processStatus,
      tasksDone: done,
      tasksTotal: tasks.length,
      progress: tasks.length === 0 ? 0 : Math.round((done / tasks.length) * 100),
      hireDate: displayDate(readValue(item, [employeeNameFields.probationStart])),
      probationEndDate: displayDate(readValue(item, [employeeNameFields.probationEnd])),
      steps: stepStatuses,
      stepPeriods: groups.map(group => process?.get(group.id)?.period || ''),
      hasPassed: textValue(readValue(item, [employeeNameFields.hasPassed])).trim()
    };
  });

  return { steps, employees, tasksByEmployee };
}

// Loads every new employee, or only `employeeId` (cheaper) when given.
// `isHistory` limits the list to finished (true) or active (false) employees; leave it out for no filtering.
export function useOnboardingData(services: OnboardingServices, employeeId?: number, isHistory?: boolean): IOnboardingState {
  const {
    newEmployeesService, jobsService, tasksForJobsService, listService, taskGroupsService,
    taskOwnerRolesService, taskGroupProcessService, taskResultsStatusFieldsService, roleOwnersService
  } = services;
  const [state, setState] = React.useState<IOnboardingState>({ data: EMPTY_DATA, loading: true, error: '' });

  React.useEffect(() => {
    let cancelled = false;
    setState(previous => ({ ...previous, loading: true, error: '' }));
    loadOnboardingData(
      {
        newEmployeesService, jobsService, tasksForJobsService, listService, taskGroupsService,
        taskOwnerRolesService, taskGroupProcessService, taskResultsStatusFieldsService, roleOwnersService
      },
      employeeId,
      isHistory
    )
      .then(data => { if (!cancelled) { setState({ data, loading: false, error: '' }); } })
      .catch((e: Error) => { if (!cancelled) { setState({ data: EMPTY_DATA, loading: false, error: e.message }); } });
    return () => { cancelled = true; };
  }, [
    newEmployeesService, jobsService, tasksForJobsService, listService, taskGroupsService,
    taskOwnerRolesService, taskGroupProcessService, taskResultsStatusFieldsService, roleOwnersService, employeeId, isHistory
  ]);

  return state;
}
