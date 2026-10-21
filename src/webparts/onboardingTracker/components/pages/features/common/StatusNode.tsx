import * as React from 'react';
import type { StepStatus } from '../../../../models/Employee';
import { STEP_STATUS_CONFIG } from './statusConfig';
import PageIcon from './PageIcon';

export interface IStatusNodeProps {
  status: StepStatus;
  sizeClass?: string;
  className?: string;
}

// Round status marker used by the step timeline and the step accordion (28px in the design).
export default function StatusNode({ status, sizeClass = 'tw-w-7 tw-h-7', className = '' }: IStatusNodeProps): React.ReactElement {
  const config = STEP_STATUS_CONFIG[status];
  if (config.halo) {
    // translucent teal halo, white disc, filled check circle (same size as the halo) on top
    return (
      <div
        className={`tw-relative tw-flex tw-shrink-0 tw-items-center tw-justify-center tw-rounded-full ${sizeClass} ${className}`}
        style={{ backgroundColor: 'rgba(41, 127, 135, 0.3)' }}
      >
        <span className="tw-absolute tw-rounded-full tw-bg-white" style={{ inset: '12%' }} />
        {config.iconName && <PageIcon name={config.iconName} className="tw-relative tw-h-full tw-w-full tw-text-brand" />}
      </div>
    );
  }
  return (
    <div className={`tw-relative tw-flex tw-shrink-0 tw-items-center tw-justify-center tw-rounded-full tw-text-xs ${sizeClass} ${config.nodeClass} ${className}`}>
      {config.iconName && <PageIcon name={config.iconName} className="tw-h-[57%] tw-w-[57%]" />}
    </div>
  );
}
