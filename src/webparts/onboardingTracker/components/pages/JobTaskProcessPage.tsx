import * as React from 'react';
import { Icon } from '@fluentui/react/lib/Icon';
import type { IOnboardingTrackerProps } from '../IOnboardingTrackerProps';
import JobSidebar from './features/jobs/JobSidebar';
import type { IJobOwner } from './features/jobs/JobSettingsTypes';
import JobProcessSections from './features/jobProcess/JobProcessSections';
import { buildSections } from './features/jobProcess/JobProcessTypes';
import { useJobProcess } from './features/jobProcess/useJobProcess';
import { CONSOLIDATED_SHEET_BASE64, CONSOLIDATED_SHEET_FILE_NAME } from '../../assets/consolidatedSheet';
import { downloadBase64File } from '../../utils/downloadFile';

const XLSX_MIME_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

type JobTaskProcessPageProps = Pick<
  IOnboardingTrackerProps,
  'listService' | 'taskGroupsService' | 'taskOwnerRolesService' | 'jobGroupsService' | 'jobsService' |
  'tasksForJobsService' | 'departmentsService'
>;

// Read-only view of the tasks of a job / job group, with the effective message, trigger and timing of every task.
export default function JobTaskProcessPage(props: JobTaskProcessPageProps): React.ReactElement {
  const { data, loading, error } = useJobProcess(props);
  const [selected, setSelected] = React.useState<IJobOwner | undefined>();
  const [showMembers, setShowMembers] = React.useState(false);

  // keep a valid selection: first group by default
  const owner: IJobOwner | undefined = React.useMemo(() => {
    const exists = selected && (selected.kind === 'group'
      ? data.groups.some(group => group.id === selected.id)
      : data.jobs.some(job => job.id === selected.id));
    if (selected && exists) {
      return selected;
    }
    return data.groups.length > 0 ? { kind: 'group', id: data.groups[0].id } : undefined;
  }, [selected, data.groups, data.jobs]);

  const sections = React.useMemo(() => owner ? buildSections(data, owner) : [], [data, owner]);
  const selectedGroup = owner && owner.kind === 'group' ? data.groups.filter(group => group.id === owner.id)[0] : undefined;
  const selectedJob = owner && owner.kind === 'job' ? data.jobs.filter(job => job.id === owner.id)[0] : undefined;
  const members = selectedGroup ? data.jobs.filter(job => job.jobGroupId === selectedGroup.id) : [];
  const jobGroup = selectedJob && selectedJob.jobGroupId !== undefined
    ? data.groups.filter(group => group.id === selectedJob.jobGroupId)[0]
    : undefined;

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
        onSelect={(kind, id) => {
          setSelected({ kind, id });
          setShowMembers(false);
        }}
      />

      <section className="tw-relative tw-min-w-0 tw-flex-1 tw-px-6 tw-py-6 md:tw-px-8">
        <button
          type="button"
          onClick={() => downloadBase64File(CONSOLIDATED_SHEET_FILE_NAME, CONSOLIDATED_SHEET_BASE64, XLSX_MIME_TYPE)}
          className="tw-absolute tw-right-6 tw-top-6 md:tw-right-8 tw-flex tw-items-center tw-gap-2 tw-rounded-lg tw-border tw-border-solid tw-border-gray-400 tw-bg-white tw-px-4 tw-py-1 tw-text-sm tw-cursor-pointer hover:tw-bg-gray-50"
        >
          <span aria-hidden="true">↓</span>
          <span>Нэгдсэн sheet татах</span>
        </button>
        {error && <p className="tw-whitespace-pre-wrap tw-text-sm tw-text-red-700" role="alert">{error}</p>}
        {loading && <p className="tw-text-sm tw-text-gray-500">Ачаалж байна...</p>}
        {!loading && !owner && <p className="tw-text-sm tw-text-gray-500">Job group эсвэл Job олдсонгүй.</p>}

        {owner && (
          <>
            <div className="tw-mb-4 tw-flex tw-flex-wrap tw-items-baseline tw-gap-x-8 tw-gap-y-1 md:tw-pr-56">
              <h2 className="tw-m-0 tw-text-base tw-font-semibold">{heading}</h2>
              {selectedGroup && (
                <button
                  type="button"
                  aria-expanded={showMembers}
                  onClick={() => setShowMembers(!showMembers)}
                  className="tw-flex tw-items-center tw-gap-2 tw-whitespace-nowrap tw-border-0 tw-bg-transparent tw-p-0 tw-text-sm tw-font-semibold tw-cursor-pointer"
                >
                  <Icon iconName={showMembers ? 'ChevronDown' : 'ChevronRight'} className="tw-text-xs" />
                  <span>Ажлын байрууд ({members.length})</span>
                </button>
              )}
            </div>
            {selectedGroup && showMembers && (
              <ul className="tw-mb-4 tw-mt-0 tw-list-disc tw-pl-5 tw-text-sm">
                {members.map(job => <li key={job.id}>{job.title}</li>)}
                {members.length === 0 && <li className="tw-text-gray-500">Энэ бүлэгт ажлын байр байхгүй байна.</li>}
              </ul>
            )}
            {jobGroup && (
              <p className="tw-mb-4 tw-mt-0 tw-text-sm">
                <span className="tw-font-semibold">Job group: {jobGroup.title}</span>
                {' '}
                <span className="tw-text-xs tw-text-gray-400">
                  (энэ ажлын байр өөрийн task-гүй учраас бүлгийн task-ийг дагана)
                </span>
              </p>
            )}
            {sections.length > 0 && (
              <p className="tw-mb-4 tw-mt-0 tw-text-xs tw-text-gray-500">
                Ажил дээр дарж, түүнийг эхлүүлэгч болон түүнээс эхлэх ажлуудыг шугамаар харна уу.
              </p>
            )}
            {!loading && sections.length === 0 && <p className="tw-text-sm tw-text-gray-500">Task байхгүй байна.</p>}
            {sections.length > 0 && <JobProcessSections key={`${owner.kind}-${owner.id}`} sections={sections} />}
          </>
        )}
      </section>
    </div>
  );
}
