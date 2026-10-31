import type { HistoryFilter, HistoryResult } from '../../../../models/HistoryEmployee';
import type { PageIconName } from '../common/PageIcon';

export interface IHistoryResultStyle {
  label: string;
  iconName: PageIconName;
  textClass: string;
  cardClass: string;
}

// Full class names are listed here so Tailwind can detect them.
export const HISTORY_RESULT_CONFIG: Record<HistoryResult, IHistoryResultStyle> = {
  passed: {
    label: 'Процесс амжилттай дууссан',
    iconName: 'StatusCircleCheckmark',
    textClass: 'tw-text-gray-500',
    cardClass: 'tw-bg-white tw-border-line-light'
  },
  failed: {
    label: 'Ажилд ороогүй',
    iconName: 'StatusCircleBlock',
    textClass: 'tw-text-danger',
    cardClass: 'tw-bg-white tw-border-line-light'
  }
};

export const HISTORY_FILTER_OPTIONS: { value: HistoryFilter; label: string }[] = [
  { value: 'all', label: 'Бүгд' },
  { value: 'passed', label: 'Тэнцсэн' },
  { value: 'failed', label: 'Тэнцээгүй' }
];
