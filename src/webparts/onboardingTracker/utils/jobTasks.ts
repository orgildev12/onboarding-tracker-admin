export interface IJobLinkRow {
  jobId: number | undefined;
  jobGroupId: number | undefined;
}

// TaskID of "Ажилд авах шийдвэр гаргах" (making the hiring decision). Tasks with Tasks.StartsByDecision = yes
// are treated as if triggered by this task, for jobs whose TasksForJobs includes it.
export const DECISION_TASK_ID = 27;

// A job follows its own TasksForJobs rows, otherwise (when it has none) the rows of its job group.
export function selectJobLinks<T extends IJobLinkRow>(links: T[], jobId: number | undefined, jobGroupId: number | undefined): T[] {
  const own = links.filter(link => jobId !== undefined && link.jobId === jobId);
  if (own.length > 0) {
    return own;
  }
  return links.filter(link => jobGroupId !== undefined && link.jobGroupId === jobGroupId);
}
