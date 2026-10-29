import * as React from 'react';
import type { IOnboardingTrackerProps } from '../IOnboardingTrackerProps';
import JobGroupMembers from './features/jobs/JobGroupMembers';
import JobSidebar from './features/jobs/JobSidebar';
import JobTaskEditor from './features/jobs/JobTaskEditor';
import JobTaskTable from './features/jobs/JobTaskTable';
import TitleDialog from './features/jobs/TitleDialog';
import type { IJob, IJobGroup, IJobOwner, IJobTask, IJobTaskDraft } from './features/jobs/JobSettingsTypes';
import { isOwnedBy } from './features/jobs/JobSettingsTypes';
import { useJobSettings } from './features/jobs/useJobSettings';

type JobSettingsPageProps = Pick<
  IOnboardingTrackerProps,
  'listService' | 'taskGroupsService' | 'jobGroupsService' | 'jobsService' | 'tasksForJobsService' | 'departmentsService'
>;

interface ITitleDialogState {
  kind: 'group' | 'job';
  item: IJobGroup | IJob | undefined;
}

interface ITaskDialogState {
  task: IJobTask | undefined;
}

export default function JobSettingsPage(props: JobSettingsPageProps): React.ReactElement {
  const settings = useJobSettings(props);
  const { data, loading, error } = settings;
  const [selected, setSelected] = React.useState<IJobOwner | undefined>();
  const [titleDialog, setTitleDialog] = React.useState<ITitleDialogState | undefined>();
  const [taskDialog, setTaskDialog] = React.useState<ITaskDialogState | undefined>();

  // keep a valid selection: first group by default, and drop it if the item disappears
  const owner: IJobOwner | undefined = React.useMemo(() => {
    const exists = selected && (selected.kind === 'group'
      ? data.groups.some(group => group.id === selected.id)
      : data.jobs.some(job => job.id === selected.id));
    if (selected && exists) {
      return selected;
    }
    return data.groups.length > 0 ? { kind: 'group', id: data.groups[0].id } : undefined;
  }, [selected, data.groups, data.jobs]);

  const ownerTasks = owner ? data.jobTasks.filter(task => isOwnedBy(task, owner)) : [];
  const usedTaskIds = ownerTasks.map(task => task.taskId);
  const availableTasks = data.catalog.filter(task => usedTaskIds.indexOf(task.id) === -1);
  const selectedGroup = owner && owner.kind === 'group' ? data.groups.filter(group => group.id === owner.id)[0] : undefined;
  const selectedJob = owner && owner.kind === 'job' ? data.jobs.filter(job => job.id === owner.id)[0] : undefined;

  const saveTitle = async (title: string, groupId: number | undefined, departmentId: number | undefined): Promise<void> => {
    if (!titleDialog) {
      return;
    }
    await settings.saveTitle(titleDialog.kind, titleDialog.item ? titleDialog.item.id : undefined, title, groupId, departmentId);
    setTitleDialog(undefined);
  };

  const deleteEntry = (): void => {
    if (!titleDialog || !titleDialog.item) {
      return;
    }
    const { kind, item } = titleDialog;
    if (!window.confirm(`"${item.title}" болон түүний task-уудыг устгах уу? Үүнийг буцаах боломжгүй.`)) {
      return;
    }
    setTitleDialog(undefined);
    settings.deleteEntry(kind, item.id).catch(() => undefined);
  };

  const saveTask = async (draft: IJobTaskDraft): Promise<void> => {
    if (!owner || !taskDialog) {
      return;
    }
    await settings.saveJobTask(owner, draft, taskDialog.task);
    setTaskDialog(undefined);
  };

  const removeTask = (task: IJobTask): void => {
    if (!owner || !window.confirm('Энэ task-ийг хасах уу?')) {
      return;
    }
    settings.removeJobTask(owner, task).catch(() => undefined);
  };

  const assignJobToGroup = (jobId: number, groupId: number | undefined): void => {
    const ownCount = data.jobTasks.filter(task => task.jobId === jobId).length;
    if (groupId !== undefined && ownCount > 0 &&
      !window.confirm(`Энэ ажлын байрны өөрийн ${ownCount} task устгагдаж, бүлгийн task-ийг дагана. Үргэлжлүүлэх үү?`)) {
      return;
    }
    settings.setJobGroup(jobId, groupId).catch(() => undefined);
  };

  const heading = selectedGroup
    ? `Job group: ${selectedGroup.title}`
    : selectedJob ? `Job: ${selectedJob.title}` : '';

  return (
    <div className="tw-flex tw-min-h-full tw-flex-col md:tw-flex-row tw-bg-white">
      <JobSidebar
        groups={data.groups}
        jobs={data.jobs}
        departments={data.departments}
        selectedKind={owner ? owner.kind : undefined}
        selectedId={owner ? owner.id : undefined}
        disabled={loading}
        onSelect={(kind, id) => setSelected({ kind, id })}
        onEdit={(kind, item) => setTitleDialog({ kind, item })}
        onAdd={kind => setTitleDialog({ kind, item: undefined })}
      />

      <section className="tw-min-w-0 tw-flex-1 tw-px-6 tw-py-6 md:tw-px-8">
        {error && <p className="tw-whitespace-pre-wrap tw-text-sm tw-text-red-700" role="alert">{error}</p>}
        {loading && <p className="tw-text-sm tw-text-gray-500">Ачаалж байна...</p>}
        {!loading && !owner && <p className="tw-text-sm tw-text-gray-500">Job group эсвэл Job нэмнэ үү.</p>}

        {owner && (
          <>
            <h2 className="tw-m-0 tw-mb-4 tw-text-base tw-font-semibold">{heading}</h2>
            {selectedGroup && (
              <JobGroupMembers
                members={data.jobs.filter(job => job.jobGroupId === selectedGroup.id)}
                unassignedJobs={data.jobs.filter(job => job.jobGroupId === undefined)}
                disabled={loading}
                onAssign={jobId => assignJobToGroup(jobId, selectedGroup.id)}
                onUnassign={jobId => assignJobToGroup(jobId, undefined)}
              />
            )}
            {selectedJob && (
              <label className="tw-mb-2 tw-flex tw-items-center tw-gap-2 tw-text-sm">
                <span>Job group:</span>
                <select
                  disabled={loading}
                  value={selectedJob.jobGroupId === undefined ? '' : selectedJob.jobGroupId}
                  onChange={event => assignJobToGroup(selectedJob.id, event.target.value ? Number(event.target.value) : undefined)}
                  className="tw-rounded tw-border tw-border-solid tw-border-gray-300 tw-px-2 tw-py-1 tw-text-sm"
                >
                  <option value="">-</option>
                  {data.groups.map(group => <option key={group.id} value={group.id}>{group.title}</option>)}
                </select>
              </label>
            )}
            {selectedJob && selectedJob.jobGroupId !== undefined ? (
              <p className="tw-text-sm tw-text-gray-600">
                Энэ ажлын байр job group-д хамаарах тул өөрийн task-гүй. Job group-ийн task-ийг дагана.
              </p>
            ) : (
            <JobTaskTable
              tasks={ownerTasks}
              catalog={data.catalog}
              disabled={loading}
              canAdd={availableTasks.length > 0}
              onAdd={() => setTaskDialog({ task: undefined })}
              onEdit={task => setTaskDialog({ task })}
              onRemove={removeTask}
              onReorder={(sourceId, targetId) => {
                settings.reorderJobTasks(owner, sourceId, targetId).catch(() => undefined);
              }}
            />
            )}
          </>
        )}
      </section>

      {titleDialog && (
        <TitleDialog
          heading={`${titleDialog.kind === 'group' ? 'Job group' : 'Job'} ${titleDialog.item ? 'засах' : 'нэмэх'}`}
          initialTitle={titleDialog.item ? titleDialog.item.title : ''}
          groups={titleDialog.kind === 'job' && !titleDialog.item ? data.groups : undefined}
          department={titleDialog.kind === 'job' ? {
            departments: data.departments,
            initialDepartmentId: titleDialog.item ? (titleDialog.item as IJob).departmentId : undefined
          } : undefined}
          onSave={saveTitle}
          onDelete={titleDialog.item ? deleteEntry : undefined}
          onCancel={() => setTitleDialog(undefined)}
        />
      )}
      {taskDialog && (
        <JobTaskEditor
          task={taskDialog.task}
          availableTasks={availableTasks}
          catalog={data.catalog}
          onSave={saveTask}
          onCancel={() => setTaskDialog(undefined)}
        />
      )}
    </div>
  );
}
