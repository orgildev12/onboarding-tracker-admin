import * as React from 'react';

export default function ProgressBar({ value, fillClass }: { value: number; fillClass: string }): React.ReactElement {
  const percent = Math.min(100, Math.max(0, value));
  return (
    <div className="tw-h-3 tw-w-full tw-rounded-full tw-bg-gray-200" role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}>
      <div className={`tw-h-3 tw-rounded-full ${fillClass}`} style={{ width: `${percent}%` }} />
    </div>
  );
}
