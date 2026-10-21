import * as React from 'react';
import PageIcon from '../common/PageIcon';
import type { PageIconName } from '../common/PageIcon';

export interface IToolbarButtonProps {
  iconName: PageIconName;
  label?: string;
  title?: string;
  disabled?: boolean;
  // colour of the icon; the default is the brand colour
  iconClassName?: string;
  onClick?: () => void;
}

export default function ToolbarButton({ iconName, label, title, disabled, iconClassName, onClick }: IToolbarButtonProps): React.ReactElement {
  return (
    <button
      type="button"
      title={title ?? label}
      aria-label={title ?? label}
      disabled={disabled}
      onClick={onClick}
      className={`tw-flex tw-items-center tw-gap-2 tw-px-3 tw-py-1.5 tw-text-sm tw-rounded tw-border-0 ${
        disabled
          ? 'tw-cursor-not-allowed tw-bg-gray-200 tw-text-gray-400 tw-shadow-none'
          : 'tw-bg-white tw-shadow-sm hover:tw-shadow tw-cursor-pointer'
      }`}
    >
      <PageIcon name={iconName} className={`tw-text-lg ${disabled ? 'tw-text-gray-400' : iconClassName ?? 'tw-text-brand'}`} />
      {label && <span>{label}</span>}
    </button>
  );
}
