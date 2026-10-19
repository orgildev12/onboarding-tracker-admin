import * as React from 'react';
import type { StepStatus } from '../../../../models/Employee';
import { STEP_STATUS_CONFIG } from './statusConfig';
import PageIcon from './PageIcon';

export interface IStatusNodeProps {
  status: StepStatus;
  sizeClass?: string;
}

// Round status marker used by the step timeline and the step accordion.
export default function StatusNode({ status, sizeClass = 'tw-w-6 tw-h-6' }: IStatusNodeProps): React.ReactElement {
  const config = STEP_STATUS_CONFIG[status];
  return (
    <div className={`tw-relative tw-flex tw-shrink-0 tw-items-center tw-justify-center tw-rounded-full tw-text-xs ${sizeClass} ${config.nodeClass}`}>
      {config.iconName && <PageIcon name={config.iconName} />}
    </div>
  );
}
