import * as React from 'react';
import UserPersona from './features/newEmployees/UserPersona';
import type { IOnboardingTrackerProps } from '../IOnboardingTrackerProps';
import styles from '../OnboardingTracker.module.scss';
import NewEmployeeForm from './features/newEmployees/NewEmployeeForm';
import type { INewEmployeeDraft, INewEmployeeRecord } from './features/newEmployees/NewEmployeeTypes';
import { useNewEmployees } from './features/newEmployees/useNewEmployees';

type NewEmployeesPageProps = Pick<IOnboardingTrackerProps, 'newEmployeesService' | 'anketsService' | 'jobsService' | 'graphService'>;

interface IFormState {
  employee: INewEmployeeRecord | undefined;
}

export default function NewEmployeesPage(props: NewEmployeesPageProps): React.ReactElement {
  const { data, loading, error, save, remove } = useNewEmployees(props);
  const [form, setForm] = React.useState<IFormState | undefined>();
  const [actionError, setActionError] = React.useState('');

  const jobTitle = (id: number | undefined): string => {
    const job = data.jobs.filter(j => j.id === id)[0];
    return job ? job.title : '';
  };
  const managerCell = (id: number | undefined): React.ReactNode => {
    const user = data.users.filter(u => u.id === id)[0];
    return user
      ? <UserPersona graph={props.graphService} name={user.title} email={user.email} />
      : '';
  };

  const submit = async (draft: INewEmployeeDraft): Promise<void> => {
    await save(form && form.employee ? form.employee.id : undefined, draft, form ? form.employee : undefined);
    setForm(undefined);
  };

  const removeEmployee = (employee: INewEmployeeRecord): void => {
    if (!window.confirm(`"${employee.lastName} ${employee.firstName}" болон түүний анкетыг устгах уу? Үүнийг буцаах боломжгүй.`)) {
      return;
    }
    setActionError('');
    remove(employee).catch((e: Error) => setActionError(e.message));
  };

  return (
    <div className="tw-flex tw-flex-col tw-gap-4 tw-p-5 tw-min-h-full tw-bg-white">
      <div className="tw-flex tw-items-center tw-justify-between">
        <h2 className="tw-m-0 tw-text-base tw-font-semibold">Шинэ ажилтнууд ({data.employees.length})</h2>
        <button type="button" disabled={loading} onClick={() => setForm({ employee: undefined })}>+ Шинэ ажилтан</button>
      </div>

      {(error || actionError) && <p className={styles.error} role="alert">{error || actionError}</p>}
      {loading && <p className="tw-text-sm tw-text-gray-500">Ачаалж байна...</p>}
      {!loading && data.employees.length === 0 && <p className="tw-text-sm tw-text-gray-500">Шинэ ажилтан алга.</p>}

      {data.employees.length > 0 && (
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
              {data.employees.map(employee => (
                <tr key={employee.id}>
                  <td>{employee.lastName} {employee.firstName}</td>
                  <td>{employee.phone}</td>
                  <td>{employee.workEmail}</td>
                  <td>{jobTitle(employee.jobId)}</td>
                  <td>{managerCell(employee.firstLineManagerId)}</td>
                  <td>{employee.probationStartDate} – {employee.probationEndDate}</td>
                  <td>{employee.ankets.length} хуудас</td>
                  <td className={styles.actions}>
                    <button type="button" disabled={loading} onClick={() => setForm({ employee })}>Засах</button>{' '}
                    <button type="button" disabled={loading} onClick={() => removeEmployee(employee)}>Устгах</button>
                  </td>
                </tr>
              ))}
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
          users={data.users}
          personService={props.newEmployeesService}
          graph={props.graphService}
          onSave={submit}
          onCancel={() => setForm(undefined)}
        />
      )}
    </div>
  );
}
