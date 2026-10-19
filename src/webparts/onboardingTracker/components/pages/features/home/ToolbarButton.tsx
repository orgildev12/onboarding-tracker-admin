import * as React from 'react';
import PageIcon from '../common/PageIcon';
import type { PageIconName } from '../common/PageIcon';

export interface IToolbarButtonProps {
  iconName: PageIconName;
  label?: string;
  title?: string;
  onClick?: () => void;
}

export default function ToolbarButton({ iconName, label, title, onClick }: IToolbarButtonProps): React.ReactElement {
  return (
    <button
      type="button"
      title={title ?? label}
      onClick={onClick}
      className="tw-flex tw-items-center tw-gap-2 tw-px-3 tw-py-1.5 tw-text-sm tw-bg-white tw-rounded tw-shadow-sm hover:tw-shadow tw-cursor-pointer tw-border-0"
    >
      <PageIcon name={iconName} className="tw-text-brand" />
      {label && <span>{label}</span>}
    </button>
  );
}
