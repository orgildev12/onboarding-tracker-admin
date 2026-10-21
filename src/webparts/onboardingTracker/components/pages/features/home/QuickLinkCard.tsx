import * as React from 'react';
import PageIcon from '../common/PageIcon';
import type { PageIconName } from '../common/PageIcon';

export interface IQuickLinkCardProps {
  iconName: PageIconName;
  label: string;
  // colour of the icon; the default is the brand colour
  iconClassName?: string;
  onClick?: () => void;
}

export default function QuickLinkCard({ iconName, label, iconClassName, onClick }: IQuickLinkCardProps): React.ReactElement {
  return (
    <button
      type="button"
      onClick={onClick}
      className="tw-flex tw-items-center tw-gap-3 tw-w-[190px] tw-px-5 tw-py-4 tw-bg-white tw-rounded tw-shadow-sm hover:tw-shadow tw-cursor-pointer tw-border-0 tw-text-left"
    >
      <PageIcon name={iconName} className={`tw-text-xl ${iconClassName ?? 'tw-text-brand'}`} />
      <span className="tw-text-sm">{label}</span>
    </button>
  );
}
