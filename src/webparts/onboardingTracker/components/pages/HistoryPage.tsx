import * as React from 'react';
import type { IOnboardingTrackerProps } from '../IOnboardingTrackerProps';
import styles from '../OnboardingTracker.module.scss';
import type { HistoryFilter, IHistoryEmployee } from '../../models/HistoryEmployee';
import { filterHistory } from '../../utils/historyFilter';
import HistoryCardGrid from './features/history/HistoryCardGrid';
import HistoryHeader from './features/history/HistoryHeader';
import { useOnboardingData } from './features/process/useOnboardingData';

export interface IHistoryPageProps extends IOnboardingTrackerProps {
  onSelectEmployee: (employee: IHistoryEmployee) => void;
}

export default function HistoryPage(props: IHistoryPageProps): React.ReactElement {
  const { onSelectEmployee } = props;
  const [query, setQuery] = React.useState('');
  const [filter, setFilter] = React.useState<HistoryFilter>('all');
  const { data, loading, error } = useOnboardingData(props, undefined, true);

  // HasPassed choices: "Процесс амжилттай ..." = passed, "Ажилд ороогүй" = failed. The default
  // "Шийдэгдэх боломжгүй" is not used on history rows, so anything else counts as failed.
  const history: IHistoryEmployee[] = React.useMemo(() => data.employees.map(employee => {
    const passed = (employee.hasPassed || '').toLowerCase().indexOf('амжилттай') !== -1;
    return {
      ...employee,
      result: passed ? 'passed' : 'failed',
      confirmedDate: passed ? employee.probationEndDate : undefined
    };
  }), [data.employees]);
  const employees = filterHistory(history, query, filter);

  return (
    <div className="tw-flex tw-flex-col tw-gap-8 tw-p-5 md:tw-p-8 tw-min-h-full tw-bg-surface">
      <HistoryHeader
        count={history.length}
        query={query}
        filter={filter}
        onQueryChange={setQuery}
        onFilterChange={setFilter}
      />
      {error && <p className={styles.error} role="alert">{error}</p>}
      {loading && <p className="tw-text-sm tw-text-gray-500">Ачаалж байна...</p>}
      {!loading && !error && <HistoryCardGrid employees={employees} onSelectEmployee={onSelectEmployee} />}
    </div>
  );
}
