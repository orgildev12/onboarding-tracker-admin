export interface IJobLinkRow {
  jobId: number | undefined;
  jobGroupId: number | undefined;
}

// A job follows its own TasksForJobs rows, otherwise (when it has none) the rows of its job group.
export function selectJobLinks<T extends IJobLinkRow>(links: T[], jobId: number | undefined, jobGroupId: number | undefined): T[] {
  const own = links.filter(link => jobId !== undefined && link.jobId === jobId);
  if (own.length > 0) {
    return own;
  }
  return links.filter(link => jobGroupId !== undefined && link.jobGroupId === jobGroupId);
}
