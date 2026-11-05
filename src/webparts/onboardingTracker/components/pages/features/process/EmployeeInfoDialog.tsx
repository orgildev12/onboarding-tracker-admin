import * as React from 'react';
import type { IEmployee } from '../../../../models/Employee';
import type { GraphService } from '../../../../services/GraphService';
import styles from '../../../OnboardingTracker.module.scss';
import Avatar from '../common/Avatar';
import PageIcon from '../common/PageIcon';
import { PROCESS_STATUS_CONFIG } from '../common/statusConfig';
import UserPersona from '../newEmployees/UserPersona';
import type { EmployeeProfileServices } from './useEmployeeProfile';
import { useEmployeeProfile } from './useEmployeeProfile';

export interface IEmployeeInfoDialogProps {
  services: EmployeeProfileServices;
  employee: IEmployee;
  graph: GraphService;
  onClose: () => void;
}

// Dates are stored as "YYYY-MM-DD"; this only reformats them for display (same as NewEmployeesPage).
const displayDate = (value: string): string => (value ? value.replace(/-/g, '.') : '');

export default function EmployeeInfoDialog({ services, employee, graph, onClose }: IEmployeeInfoDialogProps): React.ReactElement {
  const status = PROCESS_STATUS_CONFIG[employee.status];
  const { profile, loading, error } = useEmployeeProfile(services, employee.id);

  return (
    <div className={styles.dialogBackdrop} role="presentation">
      <div className={styles.dialog} style={{ width: 'min(480px, 100%)' }} role="dialog" aria-modal="true">
        <div className="tw-flex tw-items-center tw-gap-3">
          <Avatar sizeClass="tw-w-14 tw-h-14" />
          <div>
            <h3 className="tw-m-0">{employee.lastName} {employee.firstName}</h3>
            <div className="tw-text-sm tw-text-gray-500">{profile ? profile.jobTitle : employee.position}</div>
          </div>
        </div>

        {error && <p className={styles.error} role="alert">{error}</p>}
        {loading && <p className="tw-text-sm tw-text-gray-500">Ачаалж байна...</p>}

        <dl className="tw-m-0 tw-mt-4 tw-grid tw-grid-cols-[auto_1fr] tw-gap-x-3 tw-gap-y-2 tw-text-sm">
          <dt className="tw-m-0 tw-text-gray-500">Төлөв</dt>
          <dd className={`tw-m-0 tw-flex tw-items-center tw-gap-1 ${status.cardTextClass}`}>
            <PageIcon name={status.cardIconName} />
            {status.cardLabel}
          </dd>

          <dt className="tw-m-0 tw-text-gray-500">Явц</dt>
          <dd className="tw-m-0">{employee.tasksDone ?? 0}/{employee.tasksTotal ?? 0}</dd>

          {profile && (
            <>
              <dt className="tw-m-0 tw-text-gray-500">Утас</dt>
              <dd className="tw-m-0">{profile.phone || '—'}</dd>

              <dt className="tw-m-0 tw-text-gray-500">Хувийн и-мэйл</dt>
              <dd className="tw-m-0">{profile.personalEmail || '—'}</dd>

              <dt className="tw-m-0 tw-text-gray-500">Ажлын и-мэйл</dt>
              <dd className="tw-m-0">{profile.workEmail || '—'}</dd>

              <dt className="tw-m-0 tw-text-gray-500">MBTI</dt>
              <dd className="tw-m-0">{profile.mbti || '—'}</dd>

              <dt className="tw-m-0 tw-text-gray-500">Шууд удирдлага</dt>
              <dd className="tw-m-0">
                {profile.managerName ? <UserPersona graph={graph} name={profile.managerName} email={profile.managerEmail} /> : '—'}
              </dd>

              <dt className="tw-m-0 tw-text-gray-500">Туршилт</dt>
              <dd className="tw-m-0">
                {profile.tasksCreated
                  ? `${displayDate(profile.probationStartDate)} – ${displayDate(profile.probationEndDate)}`
                  : 'Төлөвлөгөө ороогүй'}
              </dd>

              {profile.workStartDate && (
                <>
                  <dt className="tw-m-0 tw-text-gray-500">Ажил эхлэх</dt>
                  <dd className="tw-m-0">{displayDate(profile.workStartDate)}</dd>
                </>
              )}

              <dt className="tw-m-0 tw-text-gray-500">Анкет</dt>
              <dd className="tw-m-0">{profile.anketCount} хуудас</dd>
            </>
          )}
        </dl>

        <div className={styles.dialogActions}>
          <button type="button" onClick={onClose}>Хаах</button>
        </div>
      </div>
    </div>
  );
}
