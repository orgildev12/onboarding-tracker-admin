import type { IDepartment, IJob, IJobGroup, IJobOwner } from '../jobs/JobSettingsTypes';

// A row of the Tasks list with everything the read-only job view needs.
export interface IProcessCatalogTask {
  id: number;
  title: string;
  taskGroupId: number;
  roleTitle: string;
  defaultBodyText: string;
  triggerType: string;
  triggerTaskId: number | undefined;
  dayShouldBegin: string;
  dayShouldEnd: string;
  dayShouldTake: string;
}

export interface IProcessTaskGroup {
  id: number;
  title: string;
  order: number;
}

// A TasksForJobs row (the task assigned to a job or job group).
export interface IProcessLink {
  id: number;
  taskId: number;
  jobGroupId: number | undefined;
  jobId: number | undefined;
  order: number;
  bodyText: string;
}

export interface IJobProcessData {
  groups: IJobGroup[];
  jobs: IJob[];
  departments: IDepartment[];
  taskGroups: IProcessTaskGroup[];
  catalog: IProcessCatalogTask[];
  links: IProcessLink[];
}

export const EMPTY_JOB_PROCESS: IJobProcessData = {
  groups: [], jobs: [], departments: [], taskGroups: [], catalog: [], links: []
};

export interface IJobProcessTask {
  taskId: number;
  title: string;
  roleTitle: string;
  // the job's own TaskBodyText, otherwise the task's default text
  bodyText: string;
  triggerType: string;
  // set only for ByOtherTask tasks
  triggerTaskId: number | undefined;
  triggerTaskTitle: string;
  dayShouldBegin: string;
  dayShouldEnd: string;
  dayShouldTake: string;
}

export interface IJobProcessSection {
  groupId: number;
  title: string;
  tasks: IJobProcessTask[];
}

export const BY_OTHER_TASK = 'ByOtherTask';

// A job follows its own tasks, otherwise (when it has none) its job group's tasks; a job group uses its own.
export function resolveLinks(data: IJobProcessData, owner: IJobOwner): IProcessLink[] {
  if (owner.kind === 'group') {
    return data.links.filter(link => link.jobGroupId === owner.id);
  }
  const own = data.links.filter(link => link.jobId === owner.id);
  if (own.length > 0) {
    return own;
  }
  const job = data.jobs.filter(item => item.id === owner.id)[0];
  return job && job.jobGroupId !== undefined
    ? data.links.filter(link => link.jobGroupId === job.jobGroupId)
    : [];
}

// Tasks of the owner, grouped by task group (in the task groups' order), each group in the owner's task order.
export function buildSections(data: IJobProcessData, owner: IJobOwner): IJobProcessSection[] {
  const catalogById = new Map(data.catalog.map(task => [task.id, task]));
  const seen = new Set<number>();
  const links = resolveLinks(data, owner)
    .slice()
    .sort((a, b) => a.order - b.order || a.id - b.id)
    .filter(link => {
      if (!link.taskId || seen.has(link.taskId) || !catalogById.has(link.taskId)) {
        return false;
      }
      seen.add(link.taskId);
      return true;
    });

  const sections = new Map<number, IJobProcessSection>();
  links.forEach(link => {
    const task = catalogById.get(link.taskId) as IProcessCatalogTask;
    const group = data.taskGroups.filter(item => item.id === task.taskGroupId)[0];
    let section = sections.get(task.taskGroupId);
    if (!section) {
      section = { groupId: task.taskGroupId, title: group ? group.title : '', tasks: [] };
      sections.set(task.taskGroupId, section);
    }
    const isTriggered = task.triggerType === BY_OTHER_TASK;
    const trigger = isTriggered && task.triggerTaskId !== undefined ? catalogById.get(task.triggerTaskId) : undefined;
    section.tasks.push({
      taskId: task.id,
      title: task.title,
      roleTitle: task.roleTitle,
      bodyText: link.bodyText.trim() ? link.bodyText : task.defaultBodyText,
      triggerType: task.triggerType,
      triggerTaskId: isTriggered ? task.triggerTaskId : undefined,
      triggerTaskTitle: trigger ? trigger.title : '',
      dayShouldBegin: task.dayShouldBegin,
      dayShouldEnd: task.dayShouldEnd,
      dayShouldTake: task.dayShouldTake
    });
  });

  const groupOrder = (section: IJobProcessSection): number => {
    const group = data.taskGroups.filter(item => item.id === section.groupId)[0];
    return group ? group.order : Number.MAX_SAFE_INTEGER;
  };
  return Array.from(sections.values()).sort((a, b) => groupOrder(a) - groupOrder(b) || a.groupId - b.groupId);
}
