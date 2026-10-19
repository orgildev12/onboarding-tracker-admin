import * as React from 'react';
import { DUMMY_HISTORY } from '../../data/dummyHistory';
import type { HistoryFilter, IHistoryEmployee } from '../../models/HistoryEmployee';
import { filterHistory } from '../../utils/historyFilter';
import HistoryCardGrid from './features/history/HistoryCardGrid';
import HistoryHeader from './features/history/HistoryHeader';

export interface IHistoryPageProps {
  onSelectEmployee: (employee: IHistoryEmployee) => void;
}

// Dummy data for now; replace DUMMY_HISTORY with data from a service later.
export default function HistoryPage({ onSelectEmployee }: IHistoryPageProps): React.ReactElement {
  const [query, setQuery] = React.useState('');
  const [filter, setFilter] = React.useState<HistoryFilter>('all');
  const employees = filterHistory(DUMMY_HISTORY, query, filter);

  return (
    <div className="tw-flex tw-flex-col tw-gap-8 tw-p-5 md:tw-p-8 tw-min-h-full tw-bg-surface">
      <HistoryHeader
        count={DUMMY_HISTORY.length}
        query={query}
        filter={filter}
        onQueryChange={setQuery}
        onFilterChange={setFilter}
      />
      <HistoryCardGrid employees={employees} onSelectEmployee={onSelectEmployee} />
    </div>
  );
}
