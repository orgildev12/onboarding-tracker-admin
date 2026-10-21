import * as React from 'react';
import type { StepStatus } from '../../../../models/Employee';
import type { IStepLinks, LineColor } from '../../../../utils/stepLinks';
import { STEP_STATUS_CONFIG } from '../common/statusConfig';
import StatusNode from '../common/StatusNode';

const LINE_CLASS: Record<LineColor, string> = {
  gray: 'tw-bg-gray-300',
  red: 'tw-bg-danger'
};

export interface IStepCellProps {
  status: StepStatus;
  links: IStepLinks;
  onClick?: () => void;
  ariaLabel?: string;
}

// One step of one employee: round status node, connector lines and a caption.
// With `onClick` the whole cell is a button (hover / pressed colours, keyboard focus).
export default function StepCell({ status, links, onClick, ariaLabel }: IStepCellProps): React.ReactElement {
  const config = STEP_STATUS_CONFIG[status];
  const content = (
    <>
      {links.left && <div className={`tw-absolute tw-top-[30px] tw-left-0 tw-w-[calc(50%-14px)] tw-h-px ${LINE_CLASS[links.left]}`} />}
      {links.right && <div className={`tw-absolute tw-top-[30px] tw-right-0 tw-w-[calc(50%-14px)] tw-h-px ${LINE_CLASS[links.right]}`} />}
      <StatusNode status={status} sizeClass="tw-w-7 tw-h-7" className={onClick ? 'group-hover:tw-ring-4 group-hover:tw-ring-brand-light' : ''} />
      <div className="tw-text-center tw-text-xs tw-text-gray-600 tw-px-2">{config.label}</div>
    </>
  );
  const baseClass = 'tw-relative tw-flex tw-flex-col tw-items-center tw-gap-1 tw-py-4';

  if (!onClick) {
    return <div className={baseClass}>{content}</div>;
  }
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      className={`tw-group tw-w-full tw-h-full tw-border-0 tw-bg-transparent tw-cursor-pointer hover:tw-bg-gray-50 active:tw-bg-gray-100 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-brand ${baseClass}`}
    >
      {content}
    </button>
  );
}
