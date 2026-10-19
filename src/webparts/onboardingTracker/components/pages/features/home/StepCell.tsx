import * as React from 'react';
import type { StepStatus } from '../../../../models/Employee';
import type { IStepLinks, LineColor } from '../../../../utils/stepLinks';
import { STEP_STATUS_CONFIG } from '../common/statusConfig';
import PageIcon from '../common/PageIcon';

const LINE_CLASS: Record<LineColor, string> = {
  gray: 'tw-bg-gray-300',
  red: 'tw-bg-danger'
};

export interface IStepCellProps {
  status: StepStatus;
  links: IStepLinks;
}

// One step of one employee: round status node, connector lines and a caption.
export default function StepCell({ status, links }: IStepCellProps): React.ReactElement {
  const config = STEP_STATUS_CONFIG[status];
  return (
    <div className="tw-relative tw-flex tw-flex-col tw-items-center tw-gap-1 tw-py-4">
      {links.left && <div className={`tw-absolute tw-top-[28px] tw-left-0 tw-w-1/2 tw-h-px ${LINE_CLASS[links.left]}`} />}
      {links.right && <div className={`tw-absolute tw-top-[28px] tw-right-0 tw-w-1/2 tw-h-px ${LINE_CLASS[links.right]}`} />}
      <div className={`tw-relative tw-flex tw-items-center tw-justify-center tw-w-6 tw-h-6 tw-rounded-full tw-text-xs ${config.nodeClass}`}>
        {config.iconName && <PageIcon name={config.iconName} />}
      </div>
      <div className="tw-text-center tw-text-xs tw-text-gray-600 tw-px-2">{config.label}</div>
    </div>
  );
}
