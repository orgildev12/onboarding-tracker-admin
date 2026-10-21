import * as React from 'react';
import type { IOnboardingTrackerProps } from '../IOnboardingTrackerProps';
import styles from '../OnboardingTracker.module.scss';
import EmployeeCardGrid from './features/home/EmployeeCardGrid';
import EmployeeListHeader from './features/home/EmployeeListHeader';
import EmployeeTable from './features/home/EmployeeTable';
import QuickLinkCard from './features/home/QuickLinkCard';
import type { ViewMode } from './features/home/ViewToggle';
import { useOnboardingData } from './features/process/useOnboardingData';
import type { IEmployee } from '../../models/Employee';

export interface IHomePageProps extends IOnboardingTrackerProps {
  onSelectEmployee: (employee: IEmployee) => void;
  onNavigate: (page: 'history' | 'settings') => void;
}

export default function HomePage(props: IHomePageProps): React.ReactElement {
  const { onSelectEmployee, onNavigate } = props;
  const [viewMode, setViewMode] = React.useState<ViewMode>('grid');
  const [expanded, setExpanded] = React.useState(false);
  const { data, loading, error } = useOnboardingData(props);

  // only the table can fill the screen
  const isExpanded = expanded && viewMode === 'list';

  React.useEffect(() => {
    if (!isExpanded) {
      return undefined;
    }
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        setExpanded(false);
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isExpanded]);

  return (
    <div className="tw-flex tw-flex-col tw-gap-5 tw-p-5 tw-min-h-full tw-bg-surface">
      {!isExpanded && (
        <div className="tw-flex tw-gap-4">
          <QuickLinkCard fluentIconName="History" iconClassName="tw-text-[#F15900]" iconSizeClassName="tw-text-base" label="Түүх" onClick={() => onNavigate('history')} />
          <QuickLinkCard iconName="EyeLinear" label="Хариуцагчийн тохиргоо" onClick={() => onNavigate('settings')} />
        </div>
      )}

      <div
        className={isExpanded
          ? 'tw-fixed tw-inset-0 tw-z-[1000] tw-flex tw-flex-col tw-gap-5 tw-overflow-auto tw-bg-surface tw-p-5'
          : 'tw-flex tw-flex-col tw-gap-5'}
      >
        <EmployeeListHeader
          count={data.employees.length}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          expanded={isExpanded}
          onToggleExpand={() => setExpanded(value => !value)}
        />

        {error && <p className={styles.error} role="alert">{error}</p>}
        {loading && <p className="tw-text-sm tw-text-gray-500">Ачаалж байна...</p>}
        {!loading && !error && data.employees.length === 0 && <p className="tw-text-sm tw-text-gray-500">Шинэ ажилтан алга.</p>}

        {viewMode === 'grid'
          ? <EmployeeCardGrid employees={data.employees} onSelectEmployee={onSelectEmployee} />
          : <EmployeeTable employees={data.employees} steps={data.steps} onSelectEmployee={onSelectEmployee} />}
      </div>
    </div>
  );
}
