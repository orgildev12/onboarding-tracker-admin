import * as React from 'react';
import type { HistoryFilter } from '../../../../models/HistoryEmployee';
import FilterSelect from '../common/FilterSelect';
import SearchBox from '../common/SearchBox';
import { HISTORY_FILTER_OPTIONS } from './historyConfig';

export interface IHistoryHeaderProps {
  // total is not shown when the list is read page by page
  count?: number;
  query: string;
  filter: HistoryFilter;
  onQueryChange: (query: string) => void;
  onFilterChange: (filter: HistoryFilter) => void;
}

export default function HistoryHeader({ count, query, filter, onQueryChange, onFilterChange }: IHistoryHeaderProps): React.ReactElement {
  return (
    <div className="tw-flex tw-flex-wrap tw-items-center tw-justify-between tw-gap-3">
      <h2 className="tw-m-0 tw-text-lg tw-font-semibold">
        Түүх{count !== undefined && <span className="tw-font-normal tw-text-gray-500"> ({count} ажилтан)</span>}
      </h2>
      <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-2">
        <SearchBox value={query} placeholder="Ажилтан хайх" onChange={onQueryChange} />
        <FilterSelect value={filter} options={HISTORY_FILTER_OPTIONS} onChange={onFilterChange} />
      </div>
    </div>
  );
}
