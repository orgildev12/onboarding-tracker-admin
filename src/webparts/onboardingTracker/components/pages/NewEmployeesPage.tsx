import * as React from 'react';
import UserPersona from './features/newEmployees/UserPersona';
import type { IOnboardingTrackerProps } from '../IOnboardingTrackerProps';
import styles from '../OnboardingTracker.module.scss';
import NewEmployeeForm from './features/newEmployees/NewEmployeeForm';
import InternshipPlanDialog from './features/newEmployees/InternshipPlanDialog';
import type { INewEmployeeDraft, INewEmployeeRecord } from './features/newEmployees/NewEmployeeTypes';
import { useNewEmployees } from './features/newEmployees/useNewEmployees';

type NewEmployeesPageProps = Pick<IOnboardingTrackerProps, 'newEmployeesService' | 'anketsService' | 'jobsService' | 'departmentsService' | 'graphService' | 'taskGroupProcessService' | 'taskResultsStatusFieldsService' | 'createListService' | 'listService' | 'tasksForJobsService' | 'internshipPlansService' | 'internshipTemplatesService'>;

interface IFormState {
  employee: INewEmployeeRecord | undefined;
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

  const submit = async (draft: INewEmployeeDraft): Promise<void> => {
    const isNew = !form || !form.employee;
    const id = await save(form && form.employee ? form.employee.id : undefined, draft, form ? form.employee : undefined);
    setForm(undefined);
    if (isNew) {
      setCreatedId(id);
    }
  };

  const removeEmployee = (employee: INewEmployeeRecord): void => {
    if (!window.confirm(`"${employee.lastName} ${employee.firstName}", түүний анкет болон бүх task үр дүн, хариултыг устгах уу? Үүнийг буцаах боломжгүй.`)) {
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
                  <td>{jobTitle(employee)}</td>
                  <td>{managerCell(employee.firstLineManagerId)}</td>
                  <td>
                    {employee.tasksCreated ? (
                      <>
                        {employee.probationStartDate} – {employee.probationEndDate}
                        {employee.workStartDate && <div className="tw-text-xs tw-text-gray-500">Ажил эхлэх: {employee.workStartDate}</div>}
                      </>
                    ) : (
                      <span className="tw-inline-block tw-rounded-full tw-bg-gray-100 tw-px-3 tw-py-0.5 tw-text-xs tw-text-gray-500">Төлөвлөгөө ороогүй</span>
                    )}
                  </td>
                  <td>{employee.ankets.length} хуудас</td>
                  <td className={styles.actions}>
                    <button type="button" disabled={loading} onClick={() => setForm({ employee })}>Засах</button>{' '}
                    <button type="button" disabled={loading} onClick={() => setPlanId(employee.id)}>Талбарын төлөвлөгөө</button>{' '}
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
          departments={data.departments}
          users={data.users}
          regionOptions={data.regionOptions}
          personService={props.newEmployeesService}
          graph={props.graphService}
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
