import * as React from 'react';

export default function Avatar({ sizeClass = 'tw-w-10 tw-h-10' }: { sizeClass?: string }): React.ReactElement {
  return <div className={`tw-rounded-full tw-bg-gray-300 tw-shrink-0 ${sizeClass}`} />;
}
