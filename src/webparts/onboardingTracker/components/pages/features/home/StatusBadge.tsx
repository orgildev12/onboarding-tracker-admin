import * as React from 'react';
import type { ProcessStatus } from '../../../../models/Employee';
import { PROCESS_STATUS_CONFIG } from '../common/statusConfig';

export default function StatusBadge({ status }: { status: ProcessStatus }): React.ReactElement {
  const config = PROCESS_STATUS_CONFIG[status];
  return (
    <span className={`tw-inline-block tw-px-4 tw-py-0.5 tw-text-sm tw-border tw-rounded-full ${config.badgeClass}`}>
      {config.badgeLabel}
    </span>
  );
}
