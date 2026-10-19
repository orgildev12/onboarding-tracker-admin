import type { ProcessStatus, StepStatus } from '../../../../models/Employee';
import type { PageIconName } from './PageIcon';

export interface IStepStatusStyle {
  label: string;
  iconName: PageIconName | '';
  // classes of the round node
  nodeClass: string;
}

// Full class names are listed here so Tailwind can detect them.
export const STEP_STATUS_CONFIG: Record<StepStatus, IStepStatusStyle> = {
  completedOnTime: {
    label: 'Хугацаандаа дууссан',
    iconName: 'CheckMark',
    nodeClass: 'tw-bg-brand tw-text-white'
  },
  completedLate: {
    label: 'Хоцорч дууссан',
    iconName: 'CheckMark',
    nodeClass: 'tw-bg-brand tw-text-white'
  },
  noProcess: {
    label: 'Процесс байхгүй',
    iconName: 'CheckMark',
    nodeClass: 'tw-bg-brand tw-text-white'
  },
  inProgress: {
    label: 'Хэвийн үргэлжилж буй',
    iconName: 'Refresh',
    nodeClass: 'tw-bg-brand-light tw-text-gray-700 tw-border tw-border-brand'
  },
  delayed: {
    label: 'Хоцорч буй',
    iconName: 'Refresh',
    nodeClass: 'tw-bg-danger-light tw-text-gray-700 tw-border tw-border-danger'
  },
  notStarted: {
    label: 'Эхлээгүй',
    iconName: '',
    nodeClass: 'tw-border tw-border-dashed tw-border-gray-400 tw-bg-white'
  }
};

export interface IProcessStatusStyle {
  // short label used by the badge in the table
  badgeLabel: string;
  badgeClass: string;
  // long label used by the card
  cardLabel: string;
  cardTextClass: string;
  cardIconName: PageIconName;
  progressClass: string;
}

export const PROCESS_STATUS_CONFIG: Record<ProcessStatus, IProcessStatusStyle> = {
  normal: {
    badgeLabel: 'Хэвийн',
    badgeClass: 'tw-bg-brand-light tw-border-brand tw-text-gray-800',
    cardLabel: 'Процесс хэвийн',
    cardTextClass: 'tw-text-gray-500',
    cardIconName: 'Completed',
    progressClass: 'tw-bg-gray-500'
  },
  delayed: {
    badgeLabel: 'Хоцорч буй',
    badgeClass: 'tw-bg-warn-light tw-border-warn tw-text-gray-800',
    cardLabel: 'Процесс хоцорч эхэлсэн',
    cardTextClass: 'tw-text-danger',
    cardIconName: 'Clock',
    progressClass: 'tw-bg-danger'
  }
};
