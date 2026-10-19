import * as React from 'react';
import PageIcon from './PageIcon';

export interface ISearchBoxProps {
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
}

export default function SearchBox({ value, placeholder, onChange }: ISearchBoxProps): React.ReactElement {
  return (
    <label className="tw-flex tw-items-center tw-gap-2 tw-w-[338px] tw-max-w-full tw-px-3 tw-py-2 tw-bg-white tw-border tw-border-solid tw-border-gray-300 tw-rounded-lg">
      <PageIcon name="Search" className="tw-text-gray-500" />
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        aria-label={placeholder}
        onChange={e => onChange(e.target.value)}
        className="tw-flex-1 tw-min-w-0 tw-text-sm tw-bg-transparent tw-border-0 focus:tw-outline-none"
      />
    </label>
  );
}
