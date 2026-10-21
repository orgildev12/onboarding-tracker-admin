import * as React from 'react';
import { Icon } from '@fluentui/react/lib/Icon';
import PageIcon from '../common/PageIcon';
import type { PageIconName } from '../common/PageIcon';

export interface IQuickLinkCardProps {
  // iconsax icon; use `fluentIconName` for a Fluent UI (Microsoft) icon instead
  iconName?: PageIconName;
  fluentIconName?: string;
  label: string;
  // colour of the icon; the default is the brand colour
  iconClassName?: string;
  // font-size class of the icon; the default is tw-text-lg
  iconSizeClassName?: string;
  onClick?: () => void;
}

export default function QuickLinkCard({ iconName, fluentIconName, label, iconClassName, iconSizeClassName, onClick }: IQuickLinkCardProps): React.ReactElement {
  const iconClass = `${iconSizeClassName ?? 'tw-text-lg'} tw-shrink-0 ${iconClassName ?? 'tw-text-brand'}`;
  return (
    <button
      type="button"
      onClick={onClick}
      className="tw-flex tw-items-center tw-gap-3 tw-w-[250px] tw-px-5 tw-py-4 tw-bg-white tw-rounded tw-shadow-sm hover:tw-shadow tw-cursor-pointer tw-border-0 tw-text-left"
    >
      {fluentIconName
        ? <Icon iconName={fluentIconName} className={iconClass} />
        : iconName && <PageIcon name={iconName} className={iconClass} />}
      <span className="tw-text-sm">{label}</span>
    </button>
  );
}
