import * as React from 'react';
import type { IJob, IJobGroup } from './JobSettingsTypes';
import PageIcon from '../common/PageIcon';
import type { PageIconName } from '../common/PageIcon';

export interface IJobSidebarProps {
  groups: IJobGroup[];
  jobs: IJob[];
  selectedKind: 'group' | 'job' | undefined;
  selectedId: number | undefined;
  disabled: boolean;
  onSelect: (kind: 'group' | 'job', id: number) => void;
  onEdit: (kind: 'group' | 'job', item: IJobGroup | IJob) => void;
  onAdd: (kind: 'group' | 'job') => void;
}

interface ISectionProps {
  heading: string;
  iconName: PageIconName;
  kind: 'group' | 'job';
  items: Array<IJobGroup | IJob>;
  sidebar: IJobSidebarProps;
}

function Section({ heading, iconName, kind, items, sidebar }: ISectionProps): React.ReactElement {
  return (
    <div className="tw-border-0 tw-border-b tw-border-solid tw-border-gray-300">
      <div className="tw-flex tw-h-9 tw-items-center tw-gap-2 tw-px-3 tw-text-xs tw-font-medium">
        <PageIcon name={iconName} className="tw-text-base" />
        <span>{heading}</span>
      </div>
      <div className="tw-flex tw-flex-col tw-gap-1 tw-px-3 tw-pb-3">
        {items.map(item => {
          const selected = sidebar.selectedKind === kind && sidebar.selectedId === item.id;
          return (
            <div
              key={item.id}
              className={`tw-flex tw-items-center tw-rounded-lg tw-border tw-border-solid ${
                selected ? 'tw-border-brand tw-bg-brand-light' : 'tw-border-gray-300 tw-bg-white'
              }`}
            >
              <button
                type="button"
                aria-pressed={selected}
                onClick={() => sidebar.onSelect(kind, item.id)}
                className="tw-min-h-7 tw-flex-1 tw-border-0 tw-bg-transparent tw-px-2 tw-text-left tw-text-xs tw-cursor-pointer"
              >
                {item.title}
              </button>
              <button
                type="button"
                disabled={sidebar.disabled}
                aria-label={`${item.title} засах`}
                onClick={() => sidebar.onEdit(kind, item)}
                className="tw-border-0 tw-bg-transparent tw-px-2 tw-text-xs tw-cursor-pointer"
              >
                <span aria-hidden="true">✎</span>
              </button>
            </div>
          );
        })}
        <button
          type="button"
          disabled={sidebar.disabled}
          onClick={() => sidebar.onAdd(kind)}
          className="tw-min-h-7 tw-rounded-lg tw-border tw-border-solid tw-border-gray-400 tw-bg-white tw-text-xs tw-cursor-pointer"
        >
          + Нэмэх
        </button>
      </div>
    </div>
  );
}

export default function JobSidebar(props: IJobSidebarProps): React.ReactElement {
  return (
    <aside className="tw-w-full md:tw-w-[240px] tw-shrink-0 tw-border-0 tw-border-r tw-border-solid tw-border-gray-300 tw-bg-gray-100">
      <Section heading="New employee - JobGroups" iconName="PositionGroup" kind="group" items={props.groups} sidebar={props} />
      <Section heading="New employee - Jobs" iconName="PositionGroup" kind="job" items={props.jobs} sidebar={props} />
    </aside>
  );
}
