import * as React from 'react';
import type { IPositionRole } from '../../../../models/PositionRole';
import PageIcon from '../common/PageIcon';

export interface IPositionSidebarProps {
  roles: IPositionRole[];
  selectedRoleId: string;
  onSelectRole: (role: IPositionRole) => void;
}

export default function PositionSidebar({ roles, selectedRoleId, onSelectRole }: IPositionSidebarProps): React.ReactElement {
  return (
    <aside className="tw-w-full md:tw-w-[358px] tw-shrink-0 tw-border-r tw-border-solid tw-border-gray-300 tw-bg-gray-100">
      <div className="tw-flex tw-h-14 tw-w-full tw-items-center tw-gap-2 tw-border-0 tw-border-b tw-border-solid tw-border-gray-300 tw-bg-transparent tw-px-4 tw-text-sm tw-font-medium">
        <PageIcon name="PositionGroup" className="tw-text-lg" />
        <span className="tw-flex-1">Албан тушаалууд</span>
      </div>

      <div className="tw-flex tw-flex-col tw-gap-2 tw-px-4 tw-py-5">
        {roles.map(role => {
          const selected = role.id === selectedRoleId;
          return (
            <button
              key={role.id}
              type="button"
              aria-pressed={selected}
              onClick={() => onSelectRole(role)}
              className={`tw-min-h-10 tw-w-full tw-rounded-lg tw-border tw-border-solid tw-px-3 tw-py-2 tw-text-left tw-text-sm ${
                selected
                  ? 'tw-border-brand tw-bg-brand-light tw-text-gray-900'
                  : 'tw-border-gray-300 tw-bg-white hover:tw-bg-gray-50'
              }`}
            >
              {role.title}
            </button>
          );
        })}
      </div>
    </aside>
  );
}
