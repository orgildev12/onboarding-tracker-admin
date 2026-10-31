import * as React from 'react';
import { Icon } from '@fluentui/react/lib/Icon';
import type { IJob } from './JobSettingsTypes';

export interface IJobGroupMembersProps {
  members: IJob[];
  unassignedJobs: IJob[];
  disabled: boolean;
  onAssign: (jobId: number) => void;
  onUnassign: (jobId: number) => void;
}

export default function JobGroupMembers(props: IJobGroupMembersProps): React.ReactElement {
  const [selectedJobId, setSelectedJobId] = React.useState('');
  const [expanded, setExpanded] = React.useState(false);

  return (
    <div>
      <button
        type="button"
        aria-expanded={expanded}
        onClick={() => setExpanded(value => !value)}
        className="tw-mb-2 tw-flex tw-items-center tw-gap-2 tw-border-0 tw-bg-transparent tw-p-0 tw-text-sm tw-font-semibold tw-cursor-pointer"
      >
        <Icon iconName={expanded ? 'ChevronDown' : 'ChevronRight'} className="tw-text-xs" />
        <span>Ажлын байрууд ({props.members.length})</span>
      </button>
      {expanded && (
        <>
      <ul className="tw-m-0 tw-list-disc tw-pl-5 tw-text-sm">
        {props.members.map(job => (
          <li key={job.id} className="tw-py-1">
            <span className="tw-inline-block tw-w-64">{job.title}</span>
            <button
              type="button"
              disabled={props.disabled}
              onClick={() => props.onUnassign(job.id)}
              className="tw-border-0 tw-bg-transparent tw-p-0 tw-text-xs tw-text-orange-600 tw-underline tw-cursor-pointer"
            >
              Хасах
            </button>
          </li>
        ))}
        {props.members.length === 0 && <li className="tw-text-gray-500">Энэ бүлэгт ажлын байр байхгүй байна.</li>}
      </ul>
      <div className="tw-mt-3 tw-flex tw-items-center tw-gap-2">
        <select
          value={selectedJobId}
          disabled={props.disabled || props.unassignedJobs.length === 0}
          onChange={event => setSelectedJobId(event.target.value)}
          aria-label="Бүлэгт нэмэх ажлын байр"
          className="tw-rounded tw-border tw-border-solid tw-border-gray-300 tw-px-2 tw-py-1 tw-text-sm"
        >
          <option value="">Ажлын байр сонгох</option>
          {props.unassignedJobs.map(job => <option key={job.id} value={job.id}>{job.title}</option>)}
        </select>
        <button
          type="button"
          disabled={props.disabled || !selectedJobId}
          onClick={() => {
            props.onAssign(Number(selectedJobId));
            setSelectedJobId('');
          }}
          className="tw-rounded-lg tw-border tw-border-solid tw-border-gray-400 tw-bg-white tw-px-6 tw-py-1 tw-text-sm tw-cursor-pointer"
        >
          + Нэмэх
        </button>
      </div>
        </>
      )}
    </div>
  );
}
