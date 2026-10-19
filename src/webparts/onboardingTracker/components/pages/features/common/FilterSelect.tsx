import * as React from 'react';
import PageIcon from './PageIcon';

export interface IFilterSelectProps<T extends string> {
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
}

export default function FilterSelect<T extends string>({ value, options, onChange }: IFilterSelectProps<T>): React.ReactElement {
  return (
    <label className="tw-flex tw-items-center tw-gap-2 tw-w-[152px] tw-px-3 tw-py-2 tw-bg-white tw-border tw-border-solid tw-border-gray-300 tw-rounded-lg">
      <PageIcon name="Filter" className="tw-text-gray-500" />
      <select
        value={value}
        aria-label="Шүүлтүүр"
        onChange={e => onChange(e.target.value as T)}
        className="tw-flex-1 tw-min-w-0 tw-text-sm tw-bg-transparent tw-border-0 tw-cursor-pointer focus:tw-outline-none"
      >
        {options.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
    </label>
  );
}
