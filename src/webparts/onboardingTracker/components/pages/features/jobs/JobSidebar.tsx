import * as React from 'react';
import type { IDepartment, IJob, IJobGroup } from './JobSettingsTypes';
import PageIcon from '../common/PageIcon';
import type { PageIconName } from '../common/PageIcon';

export interface IJobSidebarProps {
  groups: IJobGroup[];
  jobs: IJob[];
  departments: IDepartment[];
  selectedKind: 'group' | 'job' | undefined;
  selectedId: number | undefined;
  disabled: boolean;
  onSelect: (kind: 'group' | 'job', id: number) => void;
  onEdit: (kind: 'group' | 'job', item: IJobGroup | IJob) => void;
  onAdd: (kind: 'group' | 'job') => void;
}

interface IItemRowProps {
  kind: 'group' | 'job';
  item: IJobGroup | IJob;
  sidebar: IJobSidebarProps;
}

function ItemRow({ kind, item, sidebar }: IItemRowProps): React.ReactElement {
  const selected = sidebar.selectedKind === kind && sidebar.selectedId === item.id;
  return (
    <div
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
}

interface ICollapsibleProps {
  label: string;
  count: number;
  open: boolean;
  onToggle: () => void;
  // nested levels are indented and use a lighter style
  nested?: boolean;
  children: React.ReactNode;
}

function Collapsible({ label, count, open, onToggle, nested, children }: ICollapsibleProps): React.ReactElement {
  return (
    <div>
      <button
        type="button"
        aria-expanded={open}
        onClick={onToggle}
        className={`tw-flex tw-w-full tw-items-start tw-gap-1 tw-border-0 tw-bg-transparent tw-px-0 tw-py-1 tw-text-left tw-text-xs tw-cursor-pointer ${
          nested ? 'tw-font-normal tw-text-gray-700' : 'tw-font-semibold'
        }`}
      >
        <span aria-hidden="true" className="tw-w-3 tw-shrink-0">{open ? '▾' : '▸'}</span>
        <span className="tw-flex-1">{label}</span>
        <span className="tw-text-gray-500">{count}</span>
      </button>
      {open && <div className="tw-flex tw-flex-col tw-gap-1 tw-pl-3">{children}</div>}
    </div>
  );
}

interface ISectionProps {
  heading: string;
  iconName: PageIconName;
  kind: 'group' | 'job';
  sidebar: IJobSidebarProps;
  children: React.ReactNode;
}

function Section({ heading, iconName, kind, sidebar, children }: ISectionProps): React.ReactElement {
  return (
    <div className="tw-border-0 tw-border-b tw-border-solid tw-border-gray-300">
      <div className="tw-flex tw-h-9 tw-items-center tw-gap-2 tw-px-3 tw-text-xs tw-font-medium">
        <PageIcon name={iconName} className="tw-text-base" />
        <span>{heading}</span>
      </div>
      <div className="tw-flex tw-flex-col tw-gap-1 tw-px-3 tw-pb-3">
        {children}
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

const OTHER_KEY = 'other';
const OTHER_LABEL = 'Газар, хэлтэс сонгоогүй';

interface IJobNode {
  key: string;
  label: string;
  jobs: IJob[];
  heltes: IJobNode[];
}

// Gazar -> (jobs directly in it, Heltes -> jobs). Only departments that have jobs are listed.
function buildJobTree(jobs: IJob[], departments: IDepartment[]): IJobNode[] {
  const byId = new Map(departments.map(item => [item.id, item]));
  const nodes = new Map<number, IJobNode>();
  const other: IJobNode = { key: OTHER_KEY, label: OTHER_LABEL, jobs: [], heltes: [] };
  const nodeFor = (gazar: IDepartment): IJobNode => {
    const existing = nodes.get(gazar.id);
    if (existing) {
      return existing;
    }
    const created: IJobNode = { key: `gazar-${gazar.id}`, label: gazar.title, jobs: [], heltes: [] };
    nodes.set(gazar.id, created);
    return created;
  };

  jobs.forEach(job => {
    const department = job.departmentId === undefined ? undefined : byId.get(job.departmentId);
    const parent = department && !department.isGazar && department.gazarId !== undefined
      ? byId.get(department.gazarId)
      : undefined;
    if (department && department.isGazar) {
      nodeFor(department).jobs.push(job);
    } else if (department && parent) {
      const gazarNode = nodeFor(parent);
      let heltesNode = gazarNode.heltes.filter(item => item.key === `heltes-${department.id}`)[0];
      if (!heltesNode) {
        heltesNode = { key: `heltes-${department.id}`, label: department.title, jobs: [], heltes: [] };
        gazarNode.heltes.push(heltesNode);
      }
      heltesNode.jobs.push(job);
    } else {
      other.jobs.push(job);
    }
  });

  // keep the Departments list order
  const order = new Map(departments.map((item, index) => [item.id, index]));
  const result = Array.from(nodes.entries())
    .sort((a, b) => (order.get(a[0]) as number) - (order.get(b[0]) as number))
    .map(entry => entry[1]);
  result.forEach(node => node.heltes.sort((a, b) =>
    (order.get(Number(a.key.replace('heltes-', ''))) as number) - (order.get(Number(b.key.replace('heltes-', ''))) as number)));
  return other.jobs.length > 0 ? [...result, other] : result;
}

const countJobs = (node: IJobNode): number =>
  node.jobs.length + node.heltes.reduce((sum, item) => sum + item.jobs.length, 0);

function JobTree({ sidebar }: { sidebar: IJobSidebarProps }): React.ReactElement {
  const [open, setOpen] = React.useState<Record<string, boolean>>({});
  const tree = React.useMemo(() => buildJobTree(sidebar.jobs, sidebar.departments), [sidebar.jobs, sidebar.departments]);
  const toggle = (key: string): void => setOpen(current => ({ ...current, [key]: !current[key] }));
  const rows = (jobs: IJob[]): React.ReactNode =>
    jobs.map(job => <ItemRow key={job.id} kind="job" item={job} sidebar={sidebar} />);

  return (
    <>
      {tree.map(gazar => (
        <Collapsible
          key={gazar.key}
          label={gazar.label}
          count={countJobs(gazar)}
          open={!!open[gazar.key]}
          onToggle={() => toggle(gazar.key)}
        >
          {rows(gazar.jobs)}
          {gazar.heltes.map(heltes => (
            <Collapsible
              key={heltes.key}
              nested
              label={heltes.label}
              count={heltes.jobs.length}
              open={!!open[heltes.key]}
              onToggle={() => toggle(heltes.key)}
            >
              {rows(heltes.jobs)}
            </Collapsible>
          ))}
        </Collapsible>
      ))}
    </>
  );
}

export default function JobSidebar(props: IJobSidebarProps): React.ReactElement {
  return (
    <aside className="tw-w-full md:tw-w-[240px] tw-shrink-0 tw-border-0 tw-border-r tw-border-solid tw-border-gray-300 tw-bg-gray-100">
      <Section heading="New employee - JobGroups" iconName="PositionGroup" kind="group" sidebar={props}>
        {props.groups.map(group => <ItemRow key={group.id} kind="group" item={group} sidebar={props} />)}
      </Section>
      <Section heading="New employee - Jobs" iconName="PositionGroup" kind="job" sidebar={props}>
        <JobTree sidebar={props} />
      </Section>
    </aside>
  );
}
