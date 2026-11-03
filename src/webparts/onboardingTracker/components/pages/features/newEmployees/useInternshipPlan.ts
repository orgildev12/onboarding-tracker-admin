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
const DELETE_BATCH_SIZE = 10;

export interface IPlanTask {
  taskId: number;
  title: string;
  // 1..PLAN_DAYS; a task sits on exactly one day
  day: number;
  trainerId: number | undefined;
}

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
  tasks: IPlanTask[];
  // internship tasks of the job that are currently left out of the plan
  removed: IPlanTask[];
  hasJobTasks: boolean;
  days: IPlanDay[];
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
  moveDay: (taskId: number, delta: number) => void;
  moveInDay: (taskId: number, delta: number) => void;
  save: () => Promise<boolean>;
}

const clampDay = (value: number): number => Math.min(PLAN_DAYS, Math.max(1, Math.round(value) || 1));

interface ILoadedPlan {
  // tasks currently in the plan
  tasks: IPlanTask[];
  // every internship task of the employee's job with its default day; the ones not in `tasks` can be added back
  pool: IPlanTask[];
}

async function loadPlanTasks(services: InternshipPlanServices, employee: INewEmployeeRecord): Promise<ILoadedPlan> {
  const { listService, tasksForJobsService, jobsService, internshipPlansService, internshipTemplatesService } = services;
  const jobId = employee.jobId;
  if (jobId === undefined) {
    return { tasks: [], pool: [] };
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

  // tasks that already have a saved row keep the saved order (rows are created in plan order), the rest follow;
  // once a plan was saved, tasks without a row were deliberately left out and stay out until added back
  const saved = jobTaskIds.filter(taskId => savedByTask.has(taskId))
    .sort((a, b) => (savedByTask.get(a)?.id ?? 0) - (savedByTask.get(b)?.id ?? 0));
  const unsaved = jobTaskIds.filter(taskId => !savedByTask.has(taskId));
  const titleOf = (taskId: number): string => (internshipTasks.get(taskId) as { title: string }).title;
  return {
    tasks: (planItems.length > 0 ? saved : saved.concat(unsaved)).map(taskId => {
      const row = savedByTask.get(taskId);
      return {
        taskId,
        title: titleOf(taskId),
        day: row ? row.day : defaultDay(taskId),
        trainerId: row ? row.trainerId : undefined
      };
    }),
    pool: jobTaskIds.map(taskId => ({ taskId, title: titleOf(taskId), day: defaultDay(taskId), trainerId: undefined }))
  };
}

export function useInternshipPlan(services: InternshipPlanServices, employee: INewEmployeeRecord, onSaved: () => void): IInternshipPlan {
  const { newEmployeesService, internshipPlansService } = services;
  const [tasks, setTasks] = React.useState<IPlanTask[]>([]);
  const [pool, setPool] = React.useState<IPlanTask[]>([]);
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
      .then(result => { if (!cancelled) { setTasks(result.tasks); setPool(result.pool); setLoaded(true); } })
      .catch((e: Error) => { if (!cancelled) { setError(e.message); } })
      .then(() => { if (!cancelled) { setLoading(false); } }, () => undefined);
    return () => { cancelled = true; };
    // reloaded only for another employee; a refresh after saving must not discard what is on screen
  }, [employee.id]);

  const startDay = parseDay(probationStart);
  const workDay = parseDay(workStart);
  const days: IPlanDay[] = [];
  for (let day = 1; day <= PLAN_DAYS; day++) {
    days.push({ day, date: startDay ? nthWorkingDay(startDay, day) : undefined });
  }
  const lastPlanDay = days[PLAN_DAYS - 1].date;
  const warning = workDay && lastPlanDay && workDay < lastPlanDay
    ? 'Үндсэн ажил эхлэх өдөр нь дадлагын 5 дахь ажлын өдрөөс өмнө байна.'
    : '';

  const setTrainer = (taskId: number, trainerId: number | undefined): void =>
    setTasks(current => current.map(task => (task.taskId === taskId ? { ...task, trainerId } : task)));

  const removeTask = (taskId: number): void =>
    setTasks(current => current.filter(task => task.taskId !== taskId));

  // an added-back task starts from its default day, at the end of that day
  const addTask = (taskId: number): void =>
    setTasks(current => {
      const entry = pool.filter(task => task.taskId === taskId)[0];
      return entry && !current.some(task => task.taskId === taskId) ? current.concat(entry) : current;
    });
  const removed = pool.filter(entry => !tasks.some(task => task.taskId === entry.taskId));

  const moveDay = (taskId: number, delta: number): void =>
    setTasks(current => {
      const task = current.filter(item => item.taskId === taskId)[0];
      const day = task ? clampDay(task.day + delta) : 0;
      if (!task || day === task.day) {
        return current;
      }
      // goes to the end of the target day
      return current.filter(item => item.taskId !== taskId).concat({ ...task, day });
    });

  const moveInDay = (taskId: number, delta: number): void =>
    setTasks(current => {
      const index = current.findIndex(item => item.taskId === taskId);
      if (index === -1) {
        return current;
      }
      const peers = current.map((task, i) => ({ task, i })).filter(entry => entry.task.day === current[index].day);
      const other = peers[peers.findIndex(entry => entry.i === index) + delta];
      if (!other) {
        return current;
      }
      const next = current.slice();
      next[index] = current[other.i];
      next[other.i] = current[index];
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
      for (let day = 1; day <= PLAN_DAYS; day++) {
        for (const task of tasks.filter(item => item.day === day)) {
          await internshipPlansService.createItem({
            Title: `${owner} - ${task.title}`,
            [employeeField]: employee.id,
            [taskField]: task.taskId,
            [dayField]: String(day),
            [trainerField]: task.trainerId ?? null
          });
        }
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
    loading, loaded, saving, error, notice, readOnly, tasks, removed, hasJobTasks: pool.length > 0, days, probationStart, workStart,
    probationEnd: startDay ? probationEndDate(startDay) : undefined,
    warning, setProbationStart, setWorkStart, setTrainer, removeTask, addTask, moveDay, moveInDay, save
  };
}
