import * as React from 'react';
import type { IOnboardingTrackerProps } from '../IOnboardingTrackerProps';
import styles from '../OnboardingTracker.module.scss';
import type { HistoryFilter, IHistoryEmployee } from '../../models/HistoryEmployee';
import HistoryCardGrid from './features/history/HistoryCardGrid';
import HistoryHeader from './features/history/HistoryHeader';
import HistoryPagination from './features/history/HistoryPagination';
import { useHistoryEmployees } from './features/history/useHistoryEmployees';

const PAGE_SIZE = 30;

export interface IHistoryPageProps extends IOnboardingTrackerProps {
  onSelectEmployee: (employee: IHistoryEmployee) => void;
}

// Finished employees, read from SharePoint 30 at a time. Search and the result filter run on the server.
export default function HistoryPage(props: IHistoryPageProps): React.ReactElement {
  const { onSelectEmployee } = props;
  const [query, setQuery] = React.useState('');
  const [filter, setFilter] = React.useState<HistoryFilter>('all');
  const { employees, page, hasPrevious, hasNext, loading, error, goNext, goPrevious } =
    useHistoryEmployees(props, query, filter, PAGE_SIZE);

  return (
    <div className="tw-flex tw-flex-col tw-gap-8 tw-p-5 md:tw-p-8 tw-min-h-full tw-bg-white">
      <HistoryHeader
        query={query}
        filter={filter}
        onQueryChange={setQuery}
        onFilterChange={setFilter}
      />
      {error && <p className={styles.error} role="alert">{error}</p>}
      {loading && <p className="tw-text-sm tw-text-gray-500">Ачаалж байна...</p>}
      {!loading && !error && <HistoryCardGrid employees={employees} onSelectEmployee={onSelectEmployee} />}
      {!error && (hasPrevious || hasNext) && (
        <HistoryPagination
          page={page}
          hasPrevious={hasPrevious}
          hasNext={hasNext}
          onPrevious={goPrevious}
          onNext={goNext}
        />
      )}
    </div>
  );
}
