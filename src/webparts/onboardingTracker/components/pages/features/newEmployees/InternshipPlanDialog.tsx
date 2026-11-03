import * as React from 'react';
import styles from '../../../OnboardingTracker.module.scss';
import type { GraphService } from '../../../../services/GraphService';
import { formatDay } from '../../../../utils/workingDays';
import PersonPicker from './PersonPicker';
import type { INewEmployeeRecord, IUserOption } from './NewEmployeeTypes';
import { PLAN_DAYS, useInternshipPlan } from './useInternshipPlan';
import type { InternshipPlanServices } from './useInternshipPlan';

export interface IInternshipPlanDialogProps {
  services: InternshipPlanServices;
  employee: INewEmployeeRecord;
  users: IUserOption[];
  graph: GraphService;
  // called after the plan and dates were saved, so the list can refresh
  onSaved: () => void;
  onClose: () => void;
}

const WEEKDAYS = ['Ням', 'Даваа', 'Мягмар', 'Лхагва', 'Пүрэв', 'Баасан', 'Бямба'];

export default function InternshipPlanDialog({ services, employee, users, graph, onSaved, onClose }: IInternshipPlanDialogProps): React.ReactElement {
  const plan = useInternshipPlan(services, employee, onSaved);
  const [pickerError, setPickerError] = React.useState('');
  const [addId, setAddId] = React.useState('');
  const busy = plan.loading || plan.saving;
  const error = plan.error || pickerError;
  const hasStart = plan.days[0].date !== undefined;

  const submit = (event: React.FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    setPickerError('');
    plan.save().catch(() => undefined);
  };

  const trainerName = (id: number | undefined): string => {
    const user = users.filter(item => item.id === id)[0];
    return user ? user.title : '';
  };

  const rows: React.ReactElement[] = [];
  plan.days.forEach(({ day, date }) => {
    const dayTasks = plan.tasks.filter(task => task.day === day);
    rows.push(
      <tr key={`day-${day}`} className="tw-bg-gray-100">
        <th colSpan={3} className="tw-px-3 tw-py-1.5 tw-text-left tw-text-sm tw-font-semibold">
          {day}-р өдөр{date ? ` · ${formatDay(date)} (${WEEKDAYS[date.getDay()]})` : ''}
        </th>
      </tr>
    );
    if (dayTasks.length === 0) {
      rows.push(<tr key={`empty-${day}`}><td colSpan={3} className="tw-px-3 tw-py-1.5 tw-text-sm tw-text-gray-500">-</td></tr>);
    }
    dayTasks.forEach((task, position) => {
      rows.push(
        <tr key={`task-${task.taskId}`}>
          <td className="tw-px-3 tw-py-1.5 tw-text-sm">{task.title}</td>
          <td className="tw-whitespace-nowrap tw-px-3 tw-py-1.5">
            <button type="button" disabled={plan.readOnly || busy || day === 1} onClick={() => plan.moveDay(task.taskId, -1)} aria-label="Өмнөх өдөр рүү" title="Өмнөх өдөр рүү">−</button>{' '}
            <button type="button" disabled={plan.readOnly || busy || day === PLAN_DAYS} onClick={() => plan.moveDay(task.taskId, 1)} aria-label="Дараагийн өдөр рүү" title="Дараагийн өдөр рүү">+</button>{' '}
            <button type="button" disabled={plan.readOnly || busy || position === 0} onClick={() => plan.moveInDay(task.taskId, -1)} aria-label="Дээш">↑</button>{' '}
            <button type="button" disabled={plan.readOnly || busy || position === dayTasks.length - 1} onClick={() => plan.moveInDay(task.taskId, 1)} aria-label="Доош">↓</button>{' '}
            <button type="button" disabled={plan.readOnly || busy} onClick={() => plan.removeTask(task.taskId)}>Хасах</button>
          </td>
          <td className="tw-min-w-[240px] tw-px-3 tw-py-1.5">
            {plan.readOnly ? (
              <span className="tw-text-sm">{trainerName(task.trainerId) || '-'}</span>
            ) : (
              <PersonPicker
                service={services.newEmployeesService}
                graph={graph}
                users={users}
                selectedId={task.trainerId}
                onChange={id => plan.setTrainer(task.taskId, id)}
                onError={setPickerError}
                ariaLabel="Сургагч"
              />
            )}
          </td>
        </tr>
      );
    });
  });

  return (
    <div className={styles.dialogBackdrop} role="presentation">
      <form className={styles.dialog} style={{ width: 'min(820px, 100%)' }} onSubmit={submit}>
        <h3>Талбарын төлөвлөгөө – {employee.lastName} {employee.firstName}</h3>
        {plan.readOnly && <p className="tw-text-sm tw-text-gray-500">Task-ууд үүссэн тул төлөвлөгөөг өөрчлөх боломжгүй.</p>}
        {error && <p className={styles.error} role="alert">{error}</p>}
        {plan.notice && <p className="tw-text-sm tw-text-green-700" role="status">{plan.notice}</p>}

        <div className="tw-grid tw-grid-cols-1 sm:tw-grid-cols-2 tw-gap-x-4">
          <label className={styles.field}>
            <span>Талбараар ажиллаж эхлэх өдөр *</span>
            <input type="date" required disabled={plan.readOnly} value={plan.probationStart} onChange={event => plan.setProbationStart(event.target.value)} />
          </label>
          {hasStart && (
            <label className={styles.field}>
              <span>Үндсэн ажил эхлэх өдөр *</span>
              <input type="date" required disabled={plan.readOnly} value={plan.workStart} onChange={event => plan.setWorkStart(event.target.value)} />
            </label>
          )}
        </div>

        {/* the plan and the main work start date only appear once the internship start is known */}
        {hasStart && (
          <>
            <p className="tw-mt-0 tw-text-sm tw-text-gray-500">
              Туршилт дуусах: {plan.probationEnd ? formatDay(plan.probationEnd) : '-'}
            </p>
            {plan.warning && <p className="tw-text-sm tw-text-amber-600" role="status">{plan.warning}</p>}

            {plan.loading && <p className="tw-text-sm tw-text-gray-500">Ачаалж байна...</p>}
            {!plan.loading && plan.loaded && !plan.hasJobTasks && (
              <p className="tw-text-sm tw-text-gray-500">Энэ ажлын байранд дадлагын task байхгүй.</p>
            )}
            {!plan.loading && plan.hasJobTasks && (
              <>
                <table className="tw-mt-2 tw-w-full tw-border-collapse">
                  <tbody>{rows}</tbody>
                </table>
                {!plan.readOnly && plan.removed.length > 0 && (
                  <div className="tw-mt-3 tw-flex tw-items-center tw-gap-2">
                    <select aria-label="Хасагдсан task" value={addId} onChange={event => setAddId(event.target.value)}>
                      <option value="">Хасагдсан task нэмэх...</option>
                      {plan.removed.map(task => <option key={task.taskId} value={task.taskId}>{task.title}</option>)}
                    </select>
                    <button
                      type="button"
                      disabled={busy || !addId}
                      onClick={() => { plan.addTask(Number(addId)); setAddId(''); }}
                    >
                      Нэмэх
                    </button>
                  </div>
                )}
              </>
            )}
          </>
        )}

        <div className={styles.dialogActions}>
          {!plan.readOnly && <button type="submit" disabled={busy || !plan.loaded || !hasStart}>{plan.saving ? 'Хадгалж байна...' : 'Хадгалах'}</button>}
          <button type="button" disabled={plan.saving} onClick={onClose}>Хаах</button>
        </div>
      </form>
    </div>
  );
}
