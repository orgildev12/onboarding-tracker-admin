import * as React from 'react';
import PageIcon from '../common/PageIcon';
import type { PageIconName } from '../common/PageIcon';

export type ViewMode = 'grid' | 'list';

export interface IViewToggleProps {
  value: ViewMode;
  onChange: (mode: ViewMode) => void;
}

const OPTIONS: { mode: ViewMode; label: string; iconName: PageIconName }[] = [
  { mode: 'grid', label: 'Грид', iconName: 'GridView' },
  { mode: 'list', label: 'Хүснэгт', iconName: 'List' }
];

export default function ViewToggle({ value, onChange }: IViewToggleProps): React.ReactElement {
  return (
    <div className="tw-flex tw-p-0.5 tw-bg-white tw-rounded tw-shadow-sm tw-border tw-border-solid tw-border-line-light">
      {OPTIONS.map(option => {
        const active = option.mode === value;
        return (
          <button
            key={option.mode}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(option.mode)}
            className={`tw-flex tw-items-center tw-gap-2 tw-px-3 tw-py-1 tw-text-sm tw-rounded tw-border-0 tw-cursor-pointer ${
              active ? 'tw-bg-brand tw-text-white' : 'tw-bg-transparent tw-text-gray-700'
            }`}
          >
            <PageIcon name={option.iconName} />
            <span>{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
