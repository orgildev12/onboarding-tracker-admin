import * as React from 'react';
import type { IOnboardingTrackerProps } from '../../../IOnboardingTrackerProps';
import type { IListField, ListItem } from '../../../../services/ListService';
import {
  booleanValue,
  findFieldName,
  findLookupField,
  numberValue,
  readLookupId,
  readValue,
  textValue
} from '../../../../utils/listFields';
import { selectJobLinks } from '../../../../utils/jobTasks';
import { nthWorkingDay, parseDay, probationEndDate } from '../../../../utils/workingDays';
import type { INewEmployeeRecord } from './NewEmployeeTypes';

export type InternshipPlanServices = Pick<
  IOnboardingTrackerProps,
  'listService' | 'tasksForJobsService' | 'jobsService' | 'newEmployeesService' | 'internshipPlansService' | 'internshipTemplatesService'
>;

export const PLAN_DAYS = 5;
// days shown before "add day" is used
const INITIAL_DAYS = 4;
const DELETE_BATCH_SIZE = 10;

export interface IPlanTask {
  taskId: number;
  title: string;
  trainerId: number | undefined;
}

// Row N of the plan is day N: the task at position N (0-based) is done on the Nth working day.
export interface IPlanDay {
  day: number;
  // the Nth working day from the internship start; undefined until that date is entered
  date: Date | undefined;
}

export interface IInternshipPlan {
  loading: boolean;
  // false while loading or when loading failed; saving is blocked then so a half-known plan is never written
  loaded: boolean;
  saving: boolean;
  error: string;
  notice: string;
  readOnly: boolean;
  // in day order: tasks[0] is day 1
  tasks: IPlanTask[];
  // tasks deliberately left out of the plan, offered for adding back
  removed: IPlanTask[];
  hasJobTasks: boolean;
  // one entry per task
  days: IPlanDay[];
  canAddDay: boolean;
  probationStart: string;
  workStart: string;
  // preview of the date the flow writes into ProbationEndDate
  probationEnd: Date | undefined;
  warning: string;
  setProbationStart: (value: string) => void;
  setWorkStart: (value: string) => void;
  setTrainer: (taskId: number, trainerId: number | undefined) => void;
  removeTask: (taskId: number) => void;
  addTask: (taskId: number) => void;
  // adds the next day together with the next task that is not in the plan yet
  addDay: () => void;
  // start over with the first tasks, one per day
  resetPlan: () => void;
  // drag & drop: the dragged task takes the place of the target task; the days stay where they are
  dropTask: (sourceId: number, targetId: number) => void;
  save: () => Promise<boolean>;
}

const clampDay = (value: number): number => Math.min(PLAN_DAYS, Math.max(1, Math.round(value) || 1));

interface ILoadedPlan {
  // tasks currently in the plan, in day order
  tasks: IPlanTask[];
  // the starting plan of a new employee: the first INITIAL_DAYS tasks
  defaultTasks: IPlanTask[];
  // every internship task in default order; the ones not in `tasks` can be added
  pool: IPlanTask[];
  // tasks deliberately left out of a saved plan (offered for adding back)
  removedIds: number[];
}

async function loadPlanTasks(services: InternshipPlanServices, employee: INewEmployeeRecord): Promise<ILoadedPlan> {
  const { listService, tasksForJobsService, jobsService, internshipPlansService, internshipTemplatesService } = services;
  const jobId = employee.jobId;
  if (jobId === undefined) {
    return { tasks: [], defaultTasks: [], pool: [], removedIds: [] };
  }
  const planFields = await internshipPlansService.getFields();
  const [taskItems, linkItems, linkFields, jobItems, jobFields, planItems, templateItems, templateFields] = await Promise.all([
    listService.getAllItems(),
    tasksForJobsService.getAllItems(),
    tasksForJobsService.getFields(),
    jobsService.getItems(1, `Id eq ${jobId}`),
    jobsService.getFields(),
    internshipPlansService.getAllItems(`${findLookupField(planFields, ['NewEmployeeID', 'NewEmployee'], 'NewEmployeeID')} eq ${employee.id}`),
    // the template list is optional; without it Tasks.DayShouldBegin is the default
    internshipTemplatesService.getAllItems().catch((): ListItem[] => []),
    internshipTemplatesService.getFields().catch((): IListField[] => [])
  ]);

  const internshipTasks = new Map<number, { title: string; dayShouldBegin: number }>();
  taskItems.forEach(item => {
    if (booleanValue(item.IsInternshipTask)) {
      internshipTasks.set(numberValue(item.Id), { title: textValue(item.Title), dayShouldBegin: numberValue(item.DayShouldBegin, 1) });
    }
  });

  const linkTask = findLookupField(linkFields, ['TaskID', 'Task'], 'TaskID');
  const linkJobGroup = findLookupField(linkFields, ['JobGroupID', 'JobGroup'], 'JobGroupID');
  const linkJob = findLookupField(linkFields, ['JobID', 'Job'], 'JobID');
  const linkOrder = findFieldName(linkFields, ['TaskOrder'], 'TaskOrder');
  const links = linkItems.map(item => ({
    id: numberValue(item.Id),
    taskId: readLookupId(item, linkTask, ['TaskID', 'Task']) || 0,
    jobGroupId: readLookupId(item, linkJobGroup, ['JobGroupID', 'JobGroup']),
    jobId: readLookupId(item, linkJob, ['JobID', 'Job']),
    order: numberValue(readValue(item, [linkOrder, 'TaskOrder']))
  }));
  const jobGroupOnJob = findLookupField(jobFields, ['JobGroupID', 'JobGroup'], 'JobGroupID');
  const jobGroupId = jobItems.length > 0 ? readLookupId(jobItems[0], jobGroupOnJob, ['JobGroupID', 'JobGroup']) : undefined;

  const seen = new Set<number>();
  const jobTaskIds = selectJobLinks(links, jobId, jobGroupId)
    .sort((a, b) => a.order - b.order || a.id - b.id)
    .filter(link => {
      if (!link.taskId || seen.has(link.taskId) || !internshipTasks.has(link.taskId)) {
        return false;
      }
      seen.add(link.taskId);
      return true;
    })
    .map(link => link.taskId);

  const planTask = findLookupField(planFields, ['TaskID', 'Task'], 'TaskID');
  const planDay = findFieldName(planFields, ['WhichDay'], 'WhichDay');
  const planTrainer = `${findFieldName(planFields, ['Trainer'], 'Trainer')}Id`;
  const savedByTask = new Map<number, { id: number; day: number; trainerId: number | undefined }>();
  planItems.forEach(item => {
    const taskId = readLookupId(item, planTask, ['TaskID', 'Task']);
    const id = numberValue(item.Id);
    const existing = taskId === undefined ? undefined : savedByTask.get(taskId);
    if (taskId !== undefined && (!existing || id > existing.id)) {
      const trainer = numberValue(readValue(item, [planTrainer]), 0);
      savedByTask.set(taskId, { id, day: clampDay(numberValue(readValue(item, [planDay, 'WhichDay']), 1)), trainerId: trainer > 0 ? trainer : undefined });
    }
  });

  const templateTask = findLookupField(templateFields, ['TaskID', 'Task'], 'TaskID');
  const templateJob = findLookupField(templateFields, ['JobID', 'Job'], 'JobID');
  const templateJobGroup = findLookupField(templateFields, ['JobGroupID', 'JobGroup'], 'JobGroupID');
  const templateDayField = findFieldName(templateFields, ['WhichDay'], 'WhichDay');
  const templates = templateItems.map(item => ({
    taskId: readLookupId(item, templateTask, ['TaskID', 'Task']),
    jobId: readLookupId(item, templateJob, ['JobID', 'Job']),
    jobGroupId: readLookupId(item, templateJobGroup, ['JobGroupID', 'JobGroup']),
    day: numberValue(readValue(item, [templateDayField, 'WhichDay']), 0)
  }));
  const defaultDay = (taskId: number): number => {
    const rows = templates.filter(row => row.taskId === taskId && row.day > 0);
    const row = rows.filter(item => item.jobId === jobId)[0] ||
      rows.filter(item => jobGroupId !== undefined && item.jobGroupId === jobGroupId)[0];
    return clampDay(row ? row.day : (internshipTasks.get(taskId) as { dayShouldBegin: number }).dayShouldBegin);
  };

  // Any internship task can be put in the plan (the flow builds the tasks from the plan rows alone);
  // the job's own ones come first, the others can be added. Each group follows its default day.
  const byDefaultDay = (ids: number[]): number[] => ids
    .map((taskId, index) => ({ taskId, index, day: defaultDay(taskId) }))
    .sort((a, b) => a.day - b.day || a.index - b.index)
    .map(entry => entry.taskId);
  const otherTaskIds = Array.from(internshipTasks.keys()).filter(taskId => !seen.has(taskId)).sort((a, b) => a - b);
  const allTaskIds = byDefaultDay(jobTaskIds).concat(byDefaultDay(otherTaskIds));

  // a saved plan keeps its order (day, then creation order of the rows);
  // tasks without a row were deliberately left out and stay out until added back
  const saved = allTaskIds.filter(taskId => savedByTask.has(taskId))
    .sort((a, b) => {
      const rowA = savedByTask.get(a) as { id: number; day: number };
      const rowB = savedByTask.get(b) as { id: number; day: number };
      return rowA.day - rowB.day || rowA.id - rowB.id;
    });
  const titleOf = (taskId: number): string => (internshipTasks.get(taskId) as { title: string }).title;
  const hasSavedPlan = planItems.length > 0;
  // a first plan starts with the first INITIAL_DAYS internship tasks, one per day; the rest come with "add day"
  const defaultTasks: IPlanTask[] = allTaskIds.slice(0, INITIAL_DAYS)
    .map(taskId => ({ taskId, title: titleOf(taskId), trainerId: undefined }));
  const tasks: IPlanTask[] = hasSavedPlan
    ? saved.map(taskId => ({ taskId, title: titleOf(taskId), trainerId: (savedByTask.get(taskId) as { trainerId: number | undefined }).trainerId }))
    : defaultTasks;
  return {
    tasks,
    defaultTasks,
    pool: allTaskIds.map(taskId => ({ taskId, title: titleOf(taskId), trainerId: undefined })),
    removedIds: hasSavedPlan ? allTaskIds.filter(taskId => !savedByTask.has(taskId)) : []
  };
}

export function useInternshipPlan(services: InternshipPlanServices, employee: INewEmployeeRecord, onSaved: () => void): IInternshipPlan {
  const { newEmployeesService, internshipPlansService } = services;
  const [tasks, setTasks] = React.useState<IPlanTask[]>([]);
  const [pool, setPool] = React.useState<IPlanTask[]>([]);
  const [defaultTasks, setDefaultTasks] = React.useState<IPlanTask[]>([]);
  const [removedIds, setRemovedIds] = React.useState<number[]>([]);
  const [probationStart, setProbationStart] = React.useState(employee.probationStartDate);
  const [workStart, setWorkStart] = React.useState(employee.workStartDate);
  const [loading, setLoading] = React.useState(true);
  const [loaded, setLoaded] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState('');
  const [notice, setNotice] = React.useState('');
  const readOnly = employee.tasksCreated;

  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoaded(false);
    setError('');
    loadPlanTasks(services, employee)
      .then(result => {
        if (!cancelled) {
          setTasks(result.tasks);
          setPool(result.pool);
          setDefaultTasks(result.defaultTasks);
          setRemovedIds(result.removedIds);
          setLoaded(true);
        }
      })
      .catch((e: Error) => { if (!cancelled) { setError(e.message); } })
      .then(() => { if (!cancelled) { setLoading(false); } }, () => undefined);
    return () => { cancelled = true; };
    // reloaded only for another employee; a refresh after saving must not discard what is on screen
  }, [employee.id]);

  const startDay = parseDay(probationStart);
  const workDay = parseDay(workStart);
  // Day N is simply row N: the day list is fixed and the tasks are laid over it in order.
  const days: IPlanDay[] = tasks.map((_task, index) => {
    const day = Math.min(index + 1, PLAN_DAYS);
    return { day, date: startDay ? nthWorkingDay(startDay, day) : undefined };
  });
  const lastPlanDay = days.length > 0 ? days[days.length - 1].date : undefined;
  const warning = workDay && lastPlanDay && workDay < lastPlanDay
    ? 'Үндсэн ажил эхлэх өдөр нь дадлагын сүүлийн ажлын өдрөөс өмнө байна.'
    : '';

  const setTrainer = (taskId: number, trainerId: number | undefined): void =>
    setTasks(current => current.map(task => (task.taskId === taskId ? { ...task, trainerId } : task)));

  // removing a task closes its row, so the days below move up
  const removeTask = (taskId: number): void => {
    setTasks(current => current.filter(task => task.taskId !== taskId));
    setRemovedIds(current => (current.indexOf(taskId) === -1 ? current.concat(taskId) : current));
  };

  const appendTask = (taskId: number): void => {
    const entry = pool.filter(task => task.taskId === taskId)[0];
    if (!entry) {
      return;
    }
    setTasks(current => (current.some(task => task.taskId === taskId) || current.length >= PLAN_DAYS
      ? current
      : current.concat(entry)));
    setRemovedIds(current => current.filter(id => id !== taskId));
  };
  const removed = removedIds
    .map(taskId => pool.filter(entry => entry.taskId === taskId)[0])
    .filter((entry): entry is IPlanTask => entry !== undefined && !tasks.some(task => task.taskId === entry.taskId));

  const nextTask = pool.filter(entry => !tasks.some(task => task.taskId === entry.taskId))[0];
  const canAddDay = tasks.length < PLAN_DAYS && nextTask !== undefined;
  const addDay = (): void => {
    if (canAddDay) {
      appendTask(nextTask.taskId);
    }
  };
  const addTask = (taskId: number): void => appendTask(taskId);

  // back to the starting plan: the first tasks, one per day, no trainers
  const resetPlan = (): void => {
    setTasks(defaultTasks);
    setRemovedIds([]);
  };

  // the dragged task takes the target's place; the day rows themselves never move
  const dropTask = (sourceId: number, targetId: number): void =>
    setTasks(current => {
      const from = current.findIndex(task => task.taskId === sourceId);
      const to = current.findIndex(task => task.taskId === targetId);
      if (from === -1 || to === -1 || from === to) {
        return current;
      }
      const next = current.slice();
      next.splice(to, 0, next.splice(from, 1)[0]);
      return next;
    });

  const save = async (): Promise<boolean> => {
    setError('');
    setNotice('');
    if (readOnly || !loaded) {
      return false;
    }
    if (!startDay || !workDay) {
      setError('Талбараар ажиллаж эхлэх болон үндсэн ажил эхлэх өдрийг оруулна уу.');
      return false;
    }
    if (workDay < startDay) {
      setError('Үндсэн ажил эхлэх өдөр нь талбараар ажиллаж эхлэх өдрөөс өмнө байж болохгүй.');
      return false;
    }
    setSaving(true);
    try {
      const [employeeFields, planFields, current] = await Promise.all([
        newEmployeesService.getFields(),
        internshipPlansService.getFields(),
        newEmployeesService.getItems(1, `Id eq ${employee.id}`)
      ]);
      const tasksCreatedField = findFieldName(employeeFields, ['TasksCreated'], 'TasksCreated');
      if (current.length > 0 && booleanValue(readValue(current[0], [tasksCreatedField]))) {
        throw new Error('Task-ууд үүссэн тул төлөвлөгөөг өөрчлөх боломжгүй.');
      }

      const employeeField = findLookupField(planFields, ['NewEmployeeID', 'NewEmployee'], 'NewEmployeeID');
      const taskField = findLookupField(planFields, ['TaskID', 'Task'], 'TaskID');
      const dayField = findFieldName(planFields, ['WhichDay'], 'WhichDay');
      const trainerField = `${findFieldName(planFields, ['Trainer'], 'Trainer')}Id`;

      // 1. drop the saved plan, 2. write the new one; the dates (which start the task flow) only follow if both worked
      const existing = await internshipPlansService.getAllItems(`${employeeField} eq ${employee.id}`);
      for (let i = 0; i < existing.length; i += DELETE_BATCH_SIZE) {
        await Promise.all(existing.slice(i, i + DELETE_BATCH_SIZE).map(row => internshipPlansService.deleteItem(numberValue(row.Id))));
      }
      const owner = `${employee.lastName} ${employee.firstName}`.trim();
      for (let index = 0; index < tasks.length; index++) {
        const task = tasks[index];
        await internshipPlansService.createItem({
          Title: `${owner} - ${task.title}`,
          [employeeField]: employee.id,
          [taskField]: task.taskId,
          [dayField]: String(Math.min(index + 1, PLAN_DAYS)),
          [trainerField]: task.trainerId ?? null
        });
      }

      await newEmployeesService.updateItem(employee.id, {
        [findFieldName(employeeFields, ['ProbationStartDate'], 'ProbationStartDate')]: new Date(probationStart).toISOString(),
        [findFieldName(employeeFields, ['WorkStartDate'], 'WorkStartDate')]: new Date(workStart).toISOString()
      });
      setNotice('Хадгалагдлаа. Task-ууд 1–2 минутын дотор үүснэ.');
      onSaved();
      return true;
    } catch (e) {
      setError((e as Error).message);
      return false;
    } finally {
      setSaving(false);
    }
  };

  return {
    loading, loaded, saving, error, notice, readOnly, tasks, removed, hasJobTasks: pool.length > 0, days, canAddDay, probationStart, workStart,
    probationEnd: startDay ? probationEndDate(startDay) : undefined,
    warning, setProbationStart, setWorkStart, setTrainer, removeTask, addTask, addDay, resetPlan, dropTask, save
  };
}
