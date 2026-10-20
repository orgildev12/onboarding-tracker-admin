import * as React from 'react';
import { DUMMY_EMPLOYEES, DUMMY_STEPS } from '../../data/dummyEmployees';
import EmployeeCardGrid from './features/home/EmployeeCardGrid';
import EmployeeListHeader from './features/home/EmployeeListHeader';
import EmployeeTable from './features/home/EmployeeTable';
import QuickLinkCard from './features/home/QuickLinkCard';
import type { ViewMode } from './features/home/ViewToggle';
import type { IEmployee } from '../../models/Employee';

// Dummy data for now; replace DUMMY_* with data from a service later.
export default function HomePage({ onSelectEmployee }: { onSelectEmployee: (employee: IEmployee) => void }): React.ReactElement {
  const [viewMode, setViewMode] = React.useState<ViewMode>('grid');

  return (
    <div className="tw-flex tw-flex-col tw-gap-5 tw-p-5 tw-min-h-full tw-bg-surface">
      <div className="tw-flex tw-gap-4">
        <QuickLinkCard iconName="History" label="Түүхээ" />
        <QuickLinkCard iconName="Permissions" label="Хариуцагчийн тохиргоо" />
      </div>

      <EmployeeListHeader count={DUMMY_EMPLOYEES.length} viewMode={viewMode} onViewModeChange={setViewMode} />

      {viewMode === 'grid'
        ? <EmployeeCardGrid employees={DUMMY_EMPLOYEES} onSelectEmployee={onSelectEmployee} />
        : <EmployeeTable employees={DUMMY_EMPLOYEES} steps={DUMMY_STEPS} />}
    </div>
  );
}
