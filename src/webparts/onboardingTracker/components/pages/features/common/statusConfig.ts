import type { ProcessStatus, StepStatus } from '../../../../models/Employee';
import type { PageIconName } from './PageIcon';

export interface IStepStatusStyle {
  label: string;
  iconName: PageIconName | '';
  textClass: string;
  // filled check circle surrounded by a translucent teal halo
  halo: boolean;
  // classes of the round node
  nodeClass: string;
}

// Full class names are listed here so Tailwind can detect them.
export const STEP_STATUS_CONFIG: Record<StepStatus, IStepStatusStyle> = {
  completedOnTime: {
    label: 'Хугацаандаа дууссан',
    iconName: 'CheckFilled',
    halo: true,
    textClass: 'tw-text-brand',
    nodeClass: ''
  },
  completedLate: {
    label: 'Хоцорч дууссан',
    iconName: 'CheckFilled',
    halo: true,
    textClass: 'tw-text-brand',
    nodeClass: ''
  },
  noProcess: {
    label: 'Процесс байхгүй',
    iconName: '',
    halo: false,
    textClass: 'tw-text-gray-500',
    nodeClass: 'tw-border tw-border-gray-300 tw-bg-gray-100 tw-text-gray-500'
  },
  inProgress: {
    label: 'Хэвийн үргэлжилж буй',
    iconName: 'RefreshCycle',
    halo: false,
    textClass: 'tw-text-brand',
    nodeClass: 'tw-bg-[rgba(41,127,135,0.2)] tw-text-[#292D32] tw-border tw-border-solid tw-border-brand'
  },
  delayed: {
    label: 'Хоцорч буй',
    iconName: 'RefreshCycle',
    halo: false,
    textClass: 'tw-text-danger',
    nodeClass: 'tw-bg-[rgba(161,13,0,0.2)] tw-text-[#292D32] tw-border tw-border-solid tw-border-danger'
  },
  notStarted: {
    label: 'Эхлээгүй',
    iconName: '',
    halo: false,
    textClass: 'tw-text-gray-500',
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
  processProgressStyle: { background: string };
}

export const PROCESS_STATUS_CONFIG: Record<ProcessStatus, IProcessStatusStyle> = {
  normal: {
    badgeLabel: 'Хэвийн',
    badgeClass: 'tw-bg-brand-light tw-border-brand tw-text-gray-800',
    cardLabel: 'Процесс хэвийн',
    cardTextClass: 'tw-text-gray-500',
    cardIconName: 'Completed',
    progressClass: 'tw-bg-gray-500',
    processProgressStyle: { background: 'linear-gradient(90deg, #297F87 0%, #13646B 100%)' }
  },
  delayed: {
    badgeLabel: 'Хоцорч буй',
    badgeClass: 'tw-bg-danger-light tw-border-danger tw-text-danger',
    cardLabel: 'Процесс хоцорч эхлэсэн',
    cardTextClass: 'tw-text-danger',
    cardIconName: 'Clock',
    progressClass: 'tw-bg-danger',
    processProgressStyle: { background: '#A10D00' }
  }
};
