import * as React from 'react';
import UserPersona from './features/newEmployees/UserPersona';
import type { IOnboardingTrackerProps } from '../IOnboardingTrackerProps';
import styles from '../OnboardingTracker.module.scss';
import NewEmployeeForm from './features/newEmployees/NewEmployeeForm';
import InternshipPlanDialog from './features/newEmployees/InternshipPlanDialog';
import type { INewEmployeeDraft, INewEmployeeRecord } from './features/newEmployees/NewEmployeeTypes';
import { useNewEmployees } from './features/newEmployees/useNewEmployees';
import type { UserRole } from '../../services/userRole';
import PageIcon from './features/common/PageIcon';
import { confirmDialog } from './features/common/ConfirmDialog';

type NewEmployeesPageProps = Pick<IOnboardingTrackerProps, 'newEmployeesService' | 'anketsService' | 'jobsService' | 'departmentsService' | 'graphService' | 'taskGroupProcessService' | 'taskResultsStatusFieldsService' | 'createListService' | 'listService' | 'tasksForJobsService' | 'internshipPlansService' | 'internshipTemplatesService'> & {
  // undefined while the role check hasn't resolved yet; the delete button and the finished-employees
  // divider stay hidden meanwhile, same as role 2
  role: UserRole | undefined;
};

interface IFormState {
  employee: INewEmployeeRecord | undefined;
}

// Compact icon + label button for the row actions cell (ToolbarButton's border/shadow is meant
// for standalone toolbars, not a dense table row).
interface IRowActionButtonProps {
  iconName: React.ComponentProps<typeof PageIcon>['name'];
  label: string;
  iconClassName: string;
  disabled?: boolean;
  onClick: () => void;
}

function RowActionButton({ iconName, label, iconClassName, disabled, onClick }: IRowActionButtonProps): React.ReactElement {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`tw-flex tw-items-center tw-gap-1 tw-rounded tw-border-0 tw-bg-transparent tw-px-2 tw-py-1 tw-text-xs tw-font-medium tw-whitespace-nowrap ${
        disabled ? 'tw-cursor-not-allowed tw-text-gray-400' : `tw-cursor-pointer hover:tw-bg-gray-50 ${iconClassName}`
      }`}
    >
      <PageIcon name={iconName} className={disabled ? 'tw-text-gray-400' : iconClassName} />
      {label}
    </button>
  );
}

export default function NewEmployeesPage(props: NewEmployeesPageProps): React.ReactElement {
  const { data, loading, error, reload, save, remove } = useNewEmployees(props);
  const [form, setForm] = React.useState<IFormState | undefined>();
  const [actionError, setActionError] = React.useState('');
  // employee that was just created, to offer the field plan step
  const [createdId, setCreatedId] = React.useState<number | undefined>();
  const [planId, setPlanId] = React.useState<number | undefined>();
  const planEmployee = data.employees.filter(e => e.id === planId)[0];
  const createdEmployee = data.employees.filter(e => e.id === createdId)[0];
  const formEmployeeId = form?.employee?.id;
  const canDelete = props.role === 1;
  // Role 1 sees employees whose onboarding process is finished (TaskID 43 = "Дууссан") separated
  // below a divider; other roles never see them at all.
  const activeEmployees = data.employees.filter(e => !e.processFinished);
  const finishedEmployees = props.role === 1 ? data.employees.filter(e => e.processFinished) : [];
  const visibleEmployees = [...activeEmployees, ...finishedEmployees];

  const jobTitle = (employee: INewEmployeeRecord): string => {
    const job = data.jobs.filter(j => j.id === employee.jobId)[0];
    if (!job) {
      return '';
    }
    return job.isRegional && employee.whichRegion ? `${job.title} (${employee.whichRegion})` : job.title;
  };
  const managerCell = (id: number | undefined): React.ReactNode => {
    const user = data.users.filter(u => u.id === id)[0];
    return user
      ? <UserPersona graph={props.graphService} name={user.title} email={user.email} />
      : '';
  };
  // Dates are stored (and used by date inputs) as "YYYY-MM-DD"; this only reformats them for display.
  const displayDate = (value: string): string => value.replace(/-/g, '.');

  const submit = async (draft: INewEmployeeDraft): Promise<void> => {
    const isNew = !form || !form.employee;
    const id = await save(form && form.employee ? form.employee.id : undefined, draft, form ? form.employee : undefined);
    setForm(undefined);
    if (isNew) {
      setCreatedId(id);
    }
  };

  const removeEmployee = async (employee: INewEmployeeRecord): Promise<void> => {
    if (!(await confirmDialog(`"${employee.lastName} ${employee.firstName}", түүний анкет болон бүх task үр дүн, хариултыг устгах уу? Үүнийг буцаах боломжгүй.`))) {
      return;
    }
    setActionError('');
    remove(employee).catch((e: Error) => setActionError(e.message));
  };

  const renderRow = (employee: INewEmployeeRecord): React.ReactElement => (
    <tr
      key={employee.id}
      className="hover:tw-bg-gray-50 tw-cursor-pointer"
      onDoubleClick={() => setForm({ employee })}
    >
      <td>{employee.lastName} {employee.firstName}</td>
      <td>{employee.phone}</td>
      <td>{employee.workEmail}</td>
      <td>{jobTitle(employee)}</td>
      <td>{managerCell(employee.firstLineManagerId)}</td>
      <td>
        {employee.tasksCreated ? (
          <>
            {displayDate(employee.probationStartDate)} – {displayDate(employee.probationEndDate)}
            {employee.workStartDate && <div className="tw-text-xs tw-text-gray-500">Ажил эхлэх: {displayDate(employee.workStartDate)}</div>}
          </>
        ) : (
          <span className="tw-inline-block tw-rounded-full tw-bg-gray-100 tw-px-3 tw-py-0.5 tw-text-xs tw-text-gray-500">Төлөвлөгөө ороогүй</span>
        )}
      </td>
      <td>{employee.ankets.length} хуудас</td>
      <td className={styles.actions} onDoubleClick={event => event.stopPropagation()}>
        <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-1">
          <RowActionButton iconName="Edit" label="Засах" disabled={loading} iconClassName="tw-text-brand" onClick={() => setForm({ employee })} />
          {!employee.tasksCreated && (
            <RowActionButton iconName="Plan" label="Талбарын төлөвлөгөө" disabled={loading} iconClassName="tw-text-warn" onClick={() => setPlanId(employee.id)} />
          )}
          {canDelete && (
            <RowActionButton iconName="Delete" label="Устгах" disabled={loading} iconClassName="tw-text-danger" onClick={() => removeEmployee(employee)} />
          )}
        </div>
      </td>
    </tr>
  );

  return (
    <div className="tw-flex tw-flex-col tw-gap-4 tw-p-5 tw-min-h-full tw-bg-white">
      <div className="tw-flex tw-items-center tw-justify-between">
        <h2 className="tw-m-0 tw-text-base tw-font-semibold">Шинэ ажилтнууд ({visibleEmployees.length})</h2>
        <button type="button" disabled={loading} onClick={() => setForm({ employee: undefined })}>+ Шинэ ажилтан</button>
      </div>

      {(error || actionError) && <p className={styles.error} role="alert">{error || actionError}</p>}
      {loading && <p className="tw-text-sm tw-text-gray-500">Ачаалж байна...</p>}
      {!loading && visibleEmployees.length === 0 && <p className="tw-text-sm tw-text-gray-500">Шинэ ажилтан алга.</p>}

      {visibleEmployees.length > 0 && (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Нэр</th>
                <th>Утас</th>
                <th>Ажлын и-мэйл</th>
                <th>Ажлын байр</th>
                <th>Шууд удирдлага</th>
                <th>Туршилт</th>
                <th>Анкет</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {activeEmployees.map(renderRow)}
              {finishedEmployees.length > 0 && (
                <tr aria-hidden="true">
                  <td colSpan={8} className="tw-border-b-0 tw-pb-1 tw-pt-4">
                    <div className="tw-flex tw-items-center tw-gap-2 tw-text-xs tw-font-semibold tw-text-gray-500">
                      <span className="tw-h-px tw-flex-1 tw-bg-gray-300" />
                      <span>Дууссан ажилтнууд ({finishedEmployees.length})</span>
                      <span className="tw-h-px tw-flex-1 tw-bg-gray-300" />
                    </div>
                  </td>
                </tr>
              )}
              {finishedEmployees.map(renderRow)}
            </tbody>
          </table>
        </div>
      )}

      {form && (
        <NewEmployeeForm
          key={form.employee ? form.employee.id : 'new'}
          heading={form.employee ? 'Ажилтан засах' : 'Шинэ ажилтан'}
          initial={form.employee}
          jobs={data.jobs}
          departments={data.departments}
          users={data.users}
          regionOptions={data.regionOptions}
          personService={props.newEmployeesService}
          graph={props.graphService}
          planEntered={!!form.employee && form.employee.tasksCreated}
          onOpenPlan={formEmployeeId !== undefined ? () => { setPlanId(formEmployeeId); setForm(undefined); } : undefined}
          onSave={submit}
          onCancel={() => setForm(undefined)}
        />
      )}

      {createdEmployee && (
        <div className={styles.dialogBackdrop} role="presentation">
          <div className={styles.dialog} style={{ width: 'min(420px, 100%)' }} role="dialog" aria-modal="true">
            <h3>Шинэ ажилтан амжилттай бүртгэгдлээ</h3>
            <p className="tw-text-sm tw-text-gray-500">{createdEmployee.lastName} {createdEmployee.firstName}</p>
            <div className={styles.dialogActions}>
              <button type="button" onClick={() => { setPlanId(createdEmployee.id); setCreatedId(undefined); }}>Талбарын төлөвлөгөө оруулах</button>
              <button type="button" onClick={() => setCreatedId(undefined)}>Хаах</button>
            </div>
          </div>
        </div>
      )}

      {planEmployee && (
        <InternshipPlanDialog
          key={planEmployee.id}
          services={props}
          employee={planEmployee}
          users={data.users}
          graph={props.graphService}
          onSaved={() => { reload().catch(() => undefined); }}
          onClose={() => setPlanId(undefined)}
        />
      )}
    </div>
  );
}
